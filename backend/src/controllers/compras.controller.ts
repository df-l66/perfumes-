import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';

export const getCompras = async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient(req);
    const { data, error } = await client
      .from('compras')
      .select(`
        *,
        compra_detalles (*)
      `)
      .order('fecha', { ascending: false });

    if (error) {
      console.error(error);
      throw error;
    }
    
    const formattedData = data?.map((compra: any) => ({
      ...compra,
      items: compra.compra_detalles
    }));
    
    res.status(200).json(formattedData || []);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener compras', error: error.message });
  }
};

export const createCompra = async (req: Request, res: Response) => {
  const { items, ...compraData } = req.body;
  
  try {
    const client = getSupabaseClient(req);
    const { data: compra, error: compraError } = await client
      .from('compras')
      .insert([compraData])
      .select()
      .maybeSingle();

    if (compraError || !compra) throw compraError || new Error('No se pudo crear el encabezado de compra');

    for (const item of items) {
      const isMP = !!item.materia_prima_id;
      
      const detalleData = {
        compra_id: compra.id,
        producto_id: item.producto_id || null,
        materia_prima_id: item.materia_prima_id || null,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_costo: item.precio_costo,
        precio_venta: item.precio_venta || 0,
        subtotal: item.subtotal
      };
      
      await client.from('compra_detalles').insert([detalleData]);

      if (isMP) {
        const { data: mp } = await client.from('materias_primas').select('stock').eq('id', item.materia_prima_id).maybeSingle();
        if (mp) {
          const nuevoStock = Number(mp.stock) + item.cantidad;
          await client.from('materias_primas').update({ stock: nuevoStock }).eq('id', item.materia_prima_id);
          
          await client.from('movimientos_materias_primas').insert([{
            materia_prima_id: item.materia_prima_id,
            materia_prima_nombre: item.nombre,
            tipo: 'entrada',
            cantidad: item.cantidad,
            stock_anterior: mp.stock,
            stock_nuevo: nuevoStock,
            referencia: `Compra ${compra.factura_compra}`,
            registrado_por: compraData.comprador_id
          }]);
        }
      } else if (item.producto_id) {
        const { data: prod } = await client
          .from('productos')
          .select('stock, stock_minimo, descripcion')
          .eq('id', item.producto_id)
          .maybeSingle();

        if (prod) {
          const isPorEncargo = prod.descripcion?.includes('[POR_ENCARGO]');
          const nuevoStock = isPorEncargo ? prod.stock : (prod.stock + item.cantidad);
          const nuevoEstado = isPorEncargo 
            ? 'activo' 
            : (nuevoStock <= 0 ? 'inactivo' : nuevoStock <= prod.stock_minimo ? 'stock_bajo' : 'activo');

          // Actualizar stock y precio de costo/venta
          const updatePayload: any = { 
            stock: nuevoStock,
            estado: nuevoEstado,
            precio_costo: item.precio_costo
          };
          
          if (item.precio_venta && item.precio_venta > 0) {
            updatePayload.precio_venta = item.precio_venta;
          }

          await client
            .from('productos')
            .update(updatePayload)
            .eq('id', item.producto_id);

          // Registrar en Kardex
          await client.from('movimientos_kardex').insert([{
            producto_id: item.producto_id,
            producto_nombre: item.nombre,
            tipo: 'entrada',
            cantidad: item.cantidad,
            stock_anterior: prod.stock,
            stock_nuevo: nuevoStock,
            referencia: `Compra ${compra.factura_compra}`,
            registrado_por: compraData.comprador_id
          }]);
        }
      }
    }

    // Fetch the inserted items to return them correctly
    const { data: insertedItems } = await client
      .from('compra_detalles')
      .select('*')
      .eq('compra_id', compra.id);

    res.status(201).json({ ...compra, items: insertedItems || [] });
  } catch (error: any) {
    res.status(400).json({ message: 'No se pudo crear la compra', error: error.message });
  }
};

export const anularCompra = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { autorNombre, autorId } = req.body;
  
  try {
    const client = getSupabaseClient(req);
    const { data: compra, error: fetchError } = await client
      .from('compras')
      .select('*, compra_detalles(*)')
      .eq('id', id)
      .maybeSingle();
      
    if (fetchError || !compra) throw new Error('Compra no encontrada');
    if (compra.estado === 'anulada') throw new Error('La compra ya estaba anulada');

    const { error: updateError } = await client
      .from('compras')
      .update({ estado: 'anulada' })
      .eq('id', id);

    if (updateError) throw updateError;

    // Descontar el stock (reversar compra)
    for (const item of compra.compra_detalles) {
      if (item.materia_prima_id) {
        const { data: mp } = await client.from('materias_primas').select('stock').eq('id', item.materia_prima_id).maybeSingle();
        if (mp) {
          const nuevoStock = Number(mp.stock) - item.cantidad;
          await client.from('materias_primas').update({ stock: nuevoStock }).eq('id', item.materia_prima_id);
          
          await client.from('movimientos_materias_primas').insert([{
            materia_prima_id: item.materia_prima_id,
            materia_prima_nombre: item.nombre,
            tipo: 'ajuste_salida',
            cantidad: item.cantidad,
            stock_anterior: mp.stock,
            stock_nuevo: nuevoStock,
            referencia: `Anulación de Compra ${compra.factura_compra}`,
            registrado_por: autorId
          }]);
        }
      } else if (item.producto_id) {
        const { data: prod } = await client
          .from('productos')
          .select('stock, stock_minimo, descripcion')
          .eq('id', item.producto_id)
          .maybeSingle();

        if (prod) {
          const isPorEncargo = prod.descripcion?.includes('[POR_ENCARGO]');
          const nuevoStock = isPorEncargo ? prod.stock : Math.max(0, prod.stock - item.cantidad);
          const nuevoEstado = isPorEncargo 
            ? 'activo'
            : (nuevoStock <= 0 ? 'inactivo' : nuevoStock <= prod.stock_minimo ? 'stock_bajo' : 'activo');

          await client
            .from('productos')
            .update({ 
              stock: nuevoStock,
              estado: nuevoEstado
            })
            .eq('id', item.producto_id);

          await client.from('movimientos_kardex').insert([{
            producto_id: item.producto_id,
            producto_nombre: item.nombre,
            tipo: 'ajuste_salida',
            cantidad: item.cantidad,
            stock_anterior: prod.stock,
            stock_nuevo: nuevoStock,
            referencia: `Anulación de Compra ${compra.factura_compra}`,
            registrado_por: autorId
          }]);
        }
      }
    }

    res.status(200).json({ message: 'Compra anulada correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: 'No se pudo anular la compra', error: error.message });
  }
};

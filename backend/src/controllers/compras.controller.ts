import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getCompras = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
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
    
    const formattedData = data.map((compra: any) => ({
      ...compra,
      items: compra.compra_detalles
    }));
    
    res.status(200).json(formattedData);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener compras', error: error.message });
  }
};

export const createCompra = async (req: Request, res: Response) => {
  const { items, ...compraData } = req.body;
  
  try {
    const { data: compra, error: compraError } = await supabase
      .from('compras')
      .insert([compraData])
      .select()
      .single();

    if (compraError) throw compraError;

    for (const item of items) {
      const detalleData = {
        compra_id: compra.id,
        producto_id: item.producto_id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_costo: item.precio_costo,
        precio_venta: item.precio_venta,
        subtotal: item.subtotal
      };
      
      await supabase.from('compra_detalles').insert([detalleData]);

      const { data: prod } = await supabase
        .from('productos')
        .select('stock, stock_minimo')
        .eq('id', item.producto_id)
        .single();

      if (prod) {
        const nuevoStock = prod.stock + item.cantidad;
        const nuevoEstado = nuevoStock <= 0 ? 'inactivo' : nuevoStock <= prod.stock_minimo ? 'stock_bajo' : 'activo';

        // Actualizar stock y precio de costo/venta
        const updatePayload: any = { 
          stock: nuevoStock,
          estado: nuevoEstado,
          precio_costo: item.precio_costo
        };
        
        if (item.precio_venta && item.precio_venta > 0) {
          updatePayload.precio_venta = item.precio_venta;
        }

        await supabase
          .from('productos')
          .update(updatePayload)
          .eq('id', item.producto_id);

        // Registrar en Kardex
        await supabase.from('movimientos_kardex').insert([{
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

    // Fetch the inserted items to return them correctly
    const { data: insertedItems } = await supabase
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
    const { data: compra, error: fetchError } = await supabase
      .from('compras')
      .select('*, compra_detalles(*)')
      .eq('id', id)
      .single();
      
    if (fetchError || !compra) throw new Error('Compra no encontrada');
    if (compra.estado === 'anulada') throw new Error('La compra ya estaba anulada');

    const { error: updateError } = await supabase
      .from('compras')
      .update({ estado: 'anulada' })
      .eq('id', id);

    if (updateError) throw updateError;

    // Descontar el stock (reversar compra)
    for (const item of compra.compra_detalles) {
      const { data: prod } = await supabase
        .from('productos')
        .select('stock, stock_minimo')
        .eq('id', item.producto_id)
        .single();

      if (prod) {
        const nuevoStock = prod.stock - item.cantidad;
        const nuevoEstado = nuevoStock <= 0 ? 'inactivo' : nuevoStock <= prod.stock_minimo ? 'stock_bajo' : 'activo';

        await supabase
          .from('productos')
          .update({ 
            stock: nuevoStock,
            estado: nuevoEstado
          })
          .eq('id', item.producto_id);

        await supabase.from('movimientos_kardex').insert([{
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

    res.status(200).json({ message: 'Compra anulada correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: 'No se pudo anular la compra', error: error.message });
  }
};

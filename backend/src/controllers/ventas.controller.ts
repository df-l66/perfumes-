import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';

export const getVentas = async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient(req);
    const { data, error } = await client
      .from('ventas')
      .select(`
        *,
        venta_detalles (*)
      `)
      .order('fecha', { ascending: false });

    if (error) {
      console.error("Error getVentas:", error);
      throw error;
    }
    
    // Formatear para que coincida con la interfaz del frontend
    const formattedData = (data || []).map((venta: any) => ({
      ...venta,
      items: venta.venta_detalles || []
    }));
    
    res.status(200).json(formattedData);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
  }
};

export const createVenta = async (req: Request, res: Response) => {
  const { items, ...ventaData } = req.body;
  
  try {
    const client = getSupabaseClient(req);
    // 1. Limpiar datos de columnas que no existen en la tabla ventas
    const { subtotal, descuento, impuestos, monto_pagado, cambio, abono_inicial, abono_metodo_pago, ...cleanVentaData } = ventaData;
    
    // 2. Insertar la venta principal
    const { data: venta, error: ventaError } = await client
      .from('ventas')
      .insert([{
        factura: cleanVentaData.factura,
        cliente_id: cleanVentaData.cliente_id,
        cliente_nombre: cleanVentaData.cliente_nombre,
        vendedor_id: cleanVentaData.vendedor_id,
        vendedor_nombre: cleanVentaData.vendedor_nombre,
        total: cleanVentaData.total,
        metodo_pago: cleanVentaData.metodo_pago,
        notas: cleanVentaData.notas,
        estado: cleanVentaData.estado || (cleanVentaData.metodo_pago === 'credito' ? 'pendiente' : 'completada')
      }])
      .select()
      .maybeSingle();

    if (ventaError || !venta) throw ventaError || new Error('No se pudo registrar la venta');

    // 3. Procesar cada ítem
    for (const item of items) {
      const isPreparado = item.es_preparado;
      const detallePayload: any = {
        venta_id: venta.id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      };
      
      if (!isPreparado) {
        detallePayload.producto_id = item.producto_id;
      }

      await client.from('venta_detalles').insert([detallePayload]);

      if (isPreparado && item.receta) {
        const descontarMateriaPrima = async (id: string, qty: number) => {
          if (!id) return;
          const { data: mp } = await client.from('materias_primas').select('stock, stock_minimo, nombre').eq('id', id).maybeSingle();
          if (mp) {
            const nuevoStock = Number(mp.stock) - qty;
            const nuevoEstado = nuevoStock <= 0 ? 'inactivo' : nuevoStock <= Number(mp.stock_minimo) ? 'stock_bajo' : 'activo';
            await client.from('materias_primas').update({ stock: nuevoStock, estado: nuevoEstado }).eq('id', id);
            await client.from('movimientos_materias_primas').insert([{
              materia_prima_id: id,
              materia_prima_nombre: mp.nombre,
              tipo: 'salida',
              cantidad: qty,
              stock_anterior: mp.stock,
              stock_nuevo: nuevoStock,
              referencia: `Venta ${venta.factura}`,
              registrado_por: venta.vendedor_id
            }]);
          }
        };

        if (Array.isArray(item.receta)) {
          for (const ing of item.receta) {
            await descontarMateriaPrima(ing.materia_prima_id, ing.cantidad * item.cantidad);
          }
        }
      } else if (item.producto_id) {
        const { data: prod } = await client.from('productos').select('stock, stock_minimo, descripcion').eq('id', item.producto_id).maybeSingle();
        if (prod) {
          const isPorEncargo = prod.descripcion?.includes('[POR_ENCARGO]');
          
          let nuevoStock = prod.stock - item.cantidad;
          if (isPorEncargo && nuevoStock < 0) {
            nuevoStock = 0;
          }
          
          const nuevoEstado = isPorEncargo 
            ? 'activo' 
            : (nuevoStock <= 0 ? 'inactivo' : nuevoStock <= prod.stock_minimo ? 'stock_bajo' : 'activo');
          
          await client.from('productos').update({ stock: nuevoStock, estado: nuevoEstado }).eq('id', item.producto_id);

          await client.from('movimientos_kardex').insert([{
            producto_id: item.producto_id,
            producto_nombre: item.nombre,
            tipo: 'salida',
            cantidad: item.cantidad,
            stock_anterior: prod.stock,
            stock_nuevo: nuevoStock,
            referencia: `Venta ${venta.factura}`,
            registrado_por: venta.vendedor_id
          }]);
        }
      }
    }

    // 4. Actualizar crédito del cliente y registrar abono inicial si aplica
    if (venta.metodo_pago === 'credito' && venta.cliente_id) {
      const abonoMonto = Math.max(0, Math.min(Number(abono_inicial) || 0, venta.total));
      const deudaNeta = venta.total - abonoMonto;

      const { data: cliente } = await client.from('clientes').select('credito_usado').eq('id', venta.cliente_id).maybeSingle();
      if (cliente) {
        await client.from('clientes').update({ credito_usado: (cliente.credito_usado || 0) + deudaNeta }).eq('id', venta.cliente_id);
      }

      if (abonoMonto > 0) {
        await client.from('abonos').insert([{
          cliente_id: venta.cliente_id,
          cliente_nombre: venta.cliente_nombre,
          monto: abonoMonto,
          metodo_pago: abono_metodo_pago || 'efectivo',
          notas: `Abono inicial en venta ${venta.factura}`,
          registrado_por: venta.vendedor_nombre || 'Sistema'
        }]);
      }
    }

    res.status(201).json({ ...venta, items });
  } catch (error: any) {
    console.error('Error al crear venta:', error);
    res.status(400).json({ message: 'No se pudo crear la venta', error: error.message });
  }
};

export const anularVenta = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { autorNombre, autorId } = req.body;
  
  try {
    const client = getSupabaseClient(req);
    const { data: venta, error: fetchError } = await client
      .from('ventas')
      .select('*, venta_detalles(*)')
      .eq('id', id)
      .maybeSingle();
      
    if (fetchError || !venta) throw new Error('Venta no encontrada');
    if (venta.estado === 'anulada') throw new Error('La venta ya estaba anulada');

    for (const item of venta.venta_detalles) {
      if (!item.producto_id) continue;
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
          tipo: 'ajuste_entrada',
          cantidad: item.cantidad,
          stock_anterior: prod.stock,
          stock_nuevo: nuevoStock,
          referencia: `Anulación de Venta ${venta.factura}`,
          registrado_por: autorId
        }]);
      }
    }

    const { data: movsMp } = await client
      .from('movimientos_materias_primas')
      .select('*')
      .eq('referencia', `Venta ${venta.factura}`);

    if (movsMp && movsMp.length > 0) {
      for (const mov of movsMp) {
        const { data: mp } = await client
          .from('materias_primas')
          .select('stock, stock_minimo')
          .eq('id', mov.materia_prima_id)
          .maybeSingle();

        if (mp) {
          const nuevoStock = Number(mp.stock) + Number(mov.cantidad);
          const nuevoEstado = nuevoStock <= 0 ? 'inactivo' : nuevoStock <= Number(mp.stock_minimo) ? 'stock_bajo' : 'activo';

          await client.from('materias_primas').update({ stock: nuevoStock, estado: nuevoEstado }).eq('id', mov.materia_prima_id);
          
          await client.from('movimientos_materias_primas').insert([{
            materia_prima_id: mov.materia_prima_id,
            materia_prima_nombre: mov.materia_prima_nombre,
            tipo: 'entrada',
            cantidad: mov.cantidad,
            stock_anterior: mp.stock,
            stock_nuevo: nuevoStock,
            referencia: `Anulación de Venta ${venta.factura}`,
            registrado_por: autorId
          }]);
        }
      }
    }

    if (venta.metodo_pago === 'credito' && venta.cliente_id) {
      const { data: cliente } = await client
        .from('clientes')
        .select('credito_usado')
        .eq('id', venta.cliente_id)
        .maybeSingle();
        
      if (cliente) {
        await client
          .from('clientes')
          .update({ credito_usado: Math.max(0, (cliente.credito_usado || 0) - venta.total) })
          .eq('id', venta.cliente_id);
      }
    }

    const { error: updateError } = await client
      .from('ventas')
      .update({ estado: 'anulada' })
      .eq('id', id);

    if (updateError) throw updateError;

    res.status(200).json({ message: 'Venta anulada correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: 'No se pudo anular la venta', error: error.message });
  }
};

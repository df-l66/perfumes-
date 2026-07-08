import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getVentas = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        venta_detalles (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Formatear para que coincida con la interfaz del frontend
    const formattedData = data.map((venta: any) => ({
      ...venta,
      items: venta.venta_detalles
    }));
    
    res.status(200).json(formattedData);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
  }
};

export const createVenta = async (req: Request, res: Response) => {
  const { items, ...ventaData } = req.body;
  
  try {
    // 1. Crear la venta principal
    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .insert([ventaData])
      .select()
      .single();

    if (ventaError) throw ventaError;

    // 2. Procesar cada item de la venta
    for (const item of items) {
      // 2.1 Insertar en detalles
      const detalleData = {
        venta_id: venta.id,
        producto_id: item.producto_id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      };
      
      const { error: detalleError } = await supabase.from('venta_detalles').insert([detalleData]);
      if (detalleError) console.error('Error insertando detalle:', detalleError);

      // 2.2 Obtener stock actual del producto
      const { data: prod } = await supabase
        .from('productos')
        .select('stock, stock_minimo')
        .eq('id', item.producto_id)
        .single();

      if (prod) {
        const nuevoStock = prod.stock - item.cantidad;
        const nuevoEstado = nuevoStock <= 0 ? 'inactivo' : nuevoStock <= prod.stock_minimo ? 'stock_bajo' : 'activo';

        // 2.3 Actualizar stock del producto
        await supabase
          .from('productos')
          .update({ 
            stock: nuevoStock,
            estado: nuevoEstado
          })
          .eq('id', item.producto_id);

        // 2.4 Registrar en Kardex
        await supabase.from('movimientos_kardex').insert([{
          producto_id: item.producto_id,
          producto_nombre: item.nombre,
          tipo: 'salida',
          cantidad: item.cantidad,
          stock_anterior: prod.stock,
          stock_nuevo: nuevoStock,
          referencia: `Venta ${venta.factura}`,
          registrado_por: ventaData.vendedor_nombre
        }]);
      }
    }
    // 3. Actualizar crédito del cliente si es venta a crédito
    if (ventaData.metodo_pago === 'credito' && ventaData.cliente_id) {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('credito_usado')
        .eq('id', ventaData.cliente_id)
        .single();
        
      if (cliente) {
        await supabase
          .from('clientes')
          .update({ credito_usado: (cliente.credito_usado || 0) + ventaData.total })
          .eq('id', ventaData.cliente_id);
      }
    }

    res.status(201).json(venta);
  } catch (error: any) {
    res.status(400).json({ message: 'No se pudo crear la venta', error: error.message });
  }
};

export const anularVenta = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { autorNombre } = req.body;
  
  try {
    // Obtener la venta con sus detalles
    const { data: venta, error: fetchError } = await supabase
      .from('ventas')
      .select('*, venta_detalles(*)')
      .eq('id', id)
      .single();
      
    if (fetchError || !venta) throw new Error('Venta no encontrada');
    if (venta.estado === 'anulada') throw new Error('La venta ya estaba anulada');

    // Cambiar estado a anulada
    const { error: updateError } = await supabase
      .from('ventas')
      .update({ estado: 'anulada' })
      .eq('id', id);

    if (updateError) throw updateError;

    // Devolver el stock de cada producto
    for (const item of venta.venta_detalles) {
      const { data: prod } = await supabase
        .from('productos')
        .select('stock, stock_minimo')
        .eq('id', item.producto_id)
        .single();

      if (prod) {
        const nuevoStock = prod.stock + item.cantidad;
        const nuevoEstado = nuevoStock <= 0 ? 'inactivo' : nuevoStock <= prod.stock_minimo ? 'stock_bajo' : 'activo';

        await supabase
          .from('productos')
          .update({ 
            stock: nuevoStock,
            estado: nuevoEstado
          })
          .eq('id', item.producto_id);

        // Registrar entrada por anulación en Kardex
        await supabase.from('movimientos_kardex').insert([{
          producto_id: item.producto_id,
          producto_nombre: item.nombre,
          tipo: 'ajuste_entrada',
          cantidad: item.cantidad,
          stock_anterior: prod.stock,
          stock_nuevo: nuevoStock,
          referencia: `Anulación de Venta ${venta.factura}`,
          registrado_por: autorNombre || 'Sistema'
        }]);
      }
    }
    // Devolver crédito al cliente si la venta era a crédito
    if (venta.metodo_pago === 'credito' && venta.cliente_id) {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('credito_usado')
        .eq('id', venta.cliente_id)
        .single();
        
      if (cliente) {
        await supabase
          .from('clientes')
          .update({ credito_usado: Math.max(0, (cliente.credito_usado || 0) - venta.total) })
          .eq('id', venta.cliente_id);
      }
    }

    res.status(200).json({ message: 'Venta anulada correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: 'No se pudo anular la venta', error: error.message });
  }
};

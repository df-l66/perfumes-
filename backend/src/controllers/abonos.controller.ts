import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';

export const getAbonos = async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient(req);
    let { data, error } = await client
      .from('abonos')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      const fallback = await client.from('abonos').select('*');
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener abonos', error: error.message });
  }
};

export const createAbono = async (req: Request, res: Response) => {
  const { cliente_id, cliente_nombre, monto, metodo_pago, notas, registrado_por } = req.body;
  
  try {
    const client = getSupabaseClient(req);
    // 1. Insertar abono
    const { data: abono, error: insertError } = await client
      .from('abonos')
      .insert([{
        cliente_id,
        cliente_nombre,
        monto,
        metodo_pago,
        notas,
        registrado_por
      }])
      .select()
      .maybeSingle();

    if (insertError) throw insertError;

    // 2. Actualizar crédito del cliente
    const { data: cliente, error: cliError } = await client
      .from('clientes')
      .select('credito_usado')
      .eq('id', cliente_id)
      .maybeSingle();

    if (cliente && !cliError) {
      const nuevoCredito = Math.max(0, (cliente.credito_usado || 0) - monto);
      await client
        .from('clientes')
        .update({ credito_usado: nuevoCredito })
        .eq('id', cliente_id);
    }

    // 3. Distribución FIFO automática para cambiar estado de ventas
    try {
      // 3.a Obtener todos los abonos del cliente para calcular el total abonado históricamente
      const { data: todosAbonos } = await client
        .from('abonos')
        .select('monto')
        .eq('cliente_id', cliente_id);
        
      const totalAbonado = (todosAbonos || []).reduce((sum, a) => sum + (Number(a.monto) || 0), 0);

      // 3.b Obtener todas las ventas a crédito del cliente (no anuladas), de más antigua a más reciente
      const { data: ventasCredito } = await client
        .from('ventas')
        .select('id, total, estado')
        .eq('cliente_id', cliente_id)
        .eq('metodo_pago', 'credito')
        .neq('estado', 'anulada')
        .order('fecha', { ascending: true });

      if (ventasCredito && ventasCredito.length > 0) {
        let saldoDisponible = totalAbonado;

        for (const venta of ventasCredito) {
          const totalVenta = Number(venta.total) || 0;
          
          if (saldoDisponible >= totalVenta) {
            // La venta está totalmente pagada
            saldoDisponible -= totalVenta;
            if (venta.estado !== 'completada') {
              await client.from('ventas').update({ estado: 'completada' }).eq('id', venta.id);
            }
          } else {
            // La venta no está pagada completamente
            saldoDisponible = 0; // Se consumió todo el saldo
            if (venta.estado !== 'pendiente') {
              await client.from('ventas').update({ estado: 'pendiente' }).eq('id', venta.id);
            }
          }
        }
      }
    } catch (fifoError) {
      console.error("Error en la distribución FIFO de abonos:", fifoError);
      // No lanzamos el error para no bloquear la respuesta exitosa del abono
    }

    res.status(201).json(abono);
  } catch (error: any) {
    res.status(400).json({ message: 'Error al registrar el abono', error: error.message });
  }
};

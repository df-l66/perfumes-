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

    res.status(201).json(abono);
  } catch (error: any) {
    res.status(400).json({ message: 'Error al registrar el abono', error: error.message });
  }
};

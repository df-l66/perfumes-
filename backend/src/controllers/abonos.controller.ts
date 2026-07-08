import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getAbonos = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('abonos')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener abonos', error: error.message });
  }
};

export const createAbono = async (req: Request, res: Response) => {
  const { cliente_id, cliente_nombre, monto, metodo_pago, notas, registrado_por } = req.body;
  
  try {
    // 1. Insertar abono
    const { data: abono, error: insertError } = await supabase
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
      .single();

    if (insertError) throw insertError;

    // 2. Actualizar crédito del cliente
    const { data: cliente, error: cliError } = await supabase
      .from('clientes')
      .select('credito_usado')
      .eq('id', cliente_id)
      .single();

    if (cliente && !cliError) {
      const nuevoCredito = Math.max(0, (cliente.credito_usado || 0) - monto);
      await supabase
        .from('clientes')
        .update({ credito_usado: nuevoCredito })
        .eq('id', cliente_id);
    }

    res.status(201).json(abono);
  } catch (error: any) {
    res.status(400).json({ message: 'Error al registrar el abono', error: error.message });
  }
};

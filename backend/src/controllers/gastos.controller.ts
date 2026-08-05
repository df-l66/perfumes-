import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';

export const getGastos = async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient(req);
    let { data, error } = await client
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      const fallback = await client.from('gastos').select('*');
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener gastos', error: error.message });
  }
};

export const createGasto = async (req: Request, res: Response) => {
  const gastoData = req.body;
  try {
    const client = getSupabaseClient(req);
    const { data, error } = await client
      .from('gastos')
      .insert([gastoData])
      .select()
      .maybeSingle();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: 'Error al registrar el gasto', error: error.message });
  }
};

export const deleteGasto = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const client = getSupabaseClient(req);
    const { error } = await client
      .from('gastos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Gasto eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al eliminar el gasto', error: error.message });
  }
};

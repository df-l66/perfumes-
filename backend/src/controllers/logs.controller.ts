import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';

export const getLogs = async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient(req);
    let { data, error } = await client
      .from('activity_logs')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(100);

    if (error) {
      const fallback = await client.from('activity_logs').select('*').limit(100);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener logs', error: error.message });
  }
};

export const createLog = async (req: Request, res: Response) => {
  const logData = req.body;
  
  try {
    const client = getSupabaseClient(req);
    const { data, error } = await client
      .from('activity_logs')
      .insert([logData])
      .select()
      .maybeSingle();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: 'Error al guardar log', error: error.message });
  }
};

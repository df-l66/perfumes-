import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getLogs = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(100); // Traer solo los últimos 100 para no saturar

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener logs', error: error.message });
  }
};

export const createLog = async (req: Request, res: Response) => {
  const logData = req.body;
  
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([logData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: 'Error al guardar log', error: error.message });
  }
};

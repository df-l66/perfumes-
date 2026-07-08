import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getGastos = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener gastos', error: error.message });
  }
};

export const createGasto = async (req: Request, res: Response) => {
  const gastoData = req.body;
  try {
    const { data, error } = await supabase
      .from('gastos')
      .insert([gastoData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: 'Error al registrar el gasto', error: error.message });
  }
};

export const deleteGasto = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Gasto eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al eliminar el gasto', error: error.message });
  }
};

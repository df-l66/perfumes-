import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getClientes = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
  }
};

export const getClienteById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Cliente no encontrado' });
    
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

export const createCliente = async (req: Request, res: Response) => {
  const clienteData = req.body;
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert([clienteData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: 'No se pudo crear el cliente', error: error.message });
  }
};

export const updateCliente = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.status(200).json(data);
  } catch (error: any) {
    res.status(400).json({ message: 'No se pudo actualizar el cliente', error: error.message });
  }
};

export const deleteCliente = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ message: 'Cliente eliminado correctamente', data });
  } catch (error: any) {
    res.status(500).json({ message: 'No se pudo eliminar el cliente', error: error.message });
  }
};

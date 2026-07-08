import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getProveedores = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener proveedores', error: error.message });
  }
};

export const getProveedorById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Proveedor no encontrado' });
    
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

export const createProveedor = async (req: Request, res: Response) => {
  const providerData = req.body;
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .insert([providerData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: 'No se pudo crear el proveedor', error: error.message });
  }
};

export const updateProveedor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Proveedor no encontrado' });

    res.status(200).json(data);
  } catch (error: any) {
    res.status(400).json({ message: 'No se pudo actualizar el proveedor', error: error.message });
  }
};

export const deleteProveedor = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ message: 'Proveedor eliminado correctamente', data });
  } catch (error: any) {
    res.status(500).json({ message: 'No se pudo eliminar el proveedor', error: error.message });
  }
};

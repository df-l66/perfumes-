import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getConfig = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignorar error de no encontrado
    
    if (!data) {
      // Si no existe, devolver valores por defecto
      return res.status(200).json({
        id: 1,
        nombre: 'Mi Empresa',
        nit: '000000000-0',
        direccion: 'Ciudad',
        telefono: '0000000',
        iva_porcentaje: 19,
        resolucion: 'PENDIENTE',
        giro: 'general'
      });
    }

    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener configuracion', error: error.message });
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  const config = req.body;
  
  try {
    const { data, error } = await supabase
      .from('company_config')
      .upsert([{ ...config, id: 1 }])
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(400).json({ message: 'Error al actualizar configuracion', error: error.message });
  }
};

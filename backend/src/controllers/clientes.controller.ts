import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';

export const getClientes = async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient(req);
    const { data, error } = await client
      .from('clientes')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (error) {
      console.error(error);
      throw error;
    }
    res.status(200).json(data || []);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
  }
};

export const getClienteById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const client = getSupabaseClient(req);
    const { data, error } = await client
      .from('clientes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

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
    const client = getSupabaseClient(req);
    const documentoClean = clienteData.documento ? String(clienteData.documento).trim() : '';
    const nombreClean = clienteData.nombre ? String(clienteData.nombre).trim() : '';

    if (!nombreClean) {
      return res.status(400).json({ message: 'El nombre o razón social es obligatorio.' });
    }

    if (!documentoClean) {
      return res.status(400).json({ message: 'El número de documento o NIT es obligatorio.' });
    }

    // Validar si el documento ya existe
    const { data: existingDoc, error: docError } = await client
      .from('clientes')
      .select('id')
      .eq('documento', documentoClean)
      .maybeSingle();
      
    if (docError) {
      console.error('Error al verificar documento existente:', docError);
    }

    if (existingDoc) {
      return res.status(400).json({ message: `El documento o NIT "${documentoClean}" ya se encuentra registrado.` });
    }

    const payload = {
      ...clienteData,
      nombre: nombreClean,
      documento: documentoClean,
      email: clienteData.email ? String(clienteData.email).trim() : '',
      telefono: clienteData.telefono ? String(clienteData.telefono).trim() : '',
      ciudad: clienteData.ciudad ? String(clienteData.ciudad).trim() : '',
      direccion: clienteData.direccion ? String(clienteData.direccion).trim() : '',
      limite_credito: clienteData.limite_credito !== undefined && clienteData.limite_credito !== null ? Number(clienteData.limite_credito) : 0,
      credito_usado: clienteData.credito_usado !== undefined && clienteData.credito_usado !== null ? Number(clienteData.credito_usado) : 0,
      fecha_registro: clienteData.fecha_registro || new Date().toISOString().split('T')[0]
    };

    const { data, error } = await client
      .from('clientes')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error insertando cliente en Supabase:', error);
      throw error;
    }
    
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error en createCliente:', error);
    res.status(400).json({ 
      message: error.message || 'No se pudo crear el cliente', 
      error: error.message 
    });
  }
};

export const updateCliente = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const client = getSupabaseClient(req);
    const { data, error } = await client
      .from('clientes')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

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
    const client = getSupabaseClient(req);
    const { data, error } = await client
      .from('clientes')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    res.status(200).json({ message: 'Cliente eliminado correctamente', data });
  } catch (error: any) {
    res.status(500).json({ message: 'No se pudo eliminar el cliente', error: error.message });
  }
};

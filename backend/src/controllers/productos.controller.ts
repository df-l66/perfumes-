import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Obtener todos los productos
export const getProductos = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// Obtener un solo producto por ID
export const getProductoById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Producto no encontrado' });
    
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// Crear un nuevo producto
export const createProducto = async (req: Request, res: Response) => {
  const productData = req.body;
  try {
    const { data, error } = await supabase
      .from('productos')
      .insert([productData])
      .select()
      .single();

    if (error) {
      require('fs').appendFileSync('supabase-error.log', JSON.stringify({ body: productData, error }) + '\\n');
      throw error;
    }
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    require('fs').appendFileSync('supabase-error.log', 'Catch: ' + JSON.stringify(error) + '\\n');
    res.status(400).json({ message: 'No se pudo crear el producto', error: error.message });
  }
};

// Actualizar un producto existente
export const updateProducto = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const { data, error } = await supabase
      .from('productos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Producto no encontrado para actualizar' });

    res.status(200).json(data);
  } catch (error: any) {
    res.status(400).json({ message: 'No se pudo actualizar el producto', error: error.message });
  }
};

// Eliminar un producto
export const deleteProducto = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23503') {
        throw new Error('No se puede eliminar este producto porque ya tiene un historial de ventas, compras o movimientos en el Kardex. Por favor, cambia su estado a "inactivo" en su lugar.');
      }
      throw error;
    }
    res.status(200).json({ message: 'Producto eliminado correctamente', data });
  } catch (error: any) {
    res.status(400).json({ message: 'No se pudo eliminar el producto', error: error.message });
  }
};

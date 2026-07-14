import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Obtener todas las materias primas
export const getMateriasPrimas = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('materias_primas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error al obtener materias primas:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// Obtener una sola materia prima por ID
export const getMateriaPrimaById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('materias_primas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Materia prima no encontrada' });
    
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// Crear una nueva materia prima
export const createMateriaPrima = async (req: Request, res: Response) => {
  const mpData = req.body;
  try {
    const { data, error } = await supabase
      .from('materias_primas')
      .insert([mpData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error al crear materia prima:', error);
    res.status(400).json({ message: 'No se pudo crear la materia prima', error: error.message });
  }
};

// Actualizar una materia prima existente
export const updateMateriaPrima = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const { data, error } = await supabase
      .from('materias_primas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Materia prima no encontrada para actualizar' });

    res.status(200).json(data);
  } catch (error: any) {
    res.status(400).json({ message: 'No se pudo actualizar la materia prima', error: error.message });
  }
};

// Eliminar una materia prima
export const deleteMateriaPrima = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('materias_primas')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23503') {
        throw new Error('No se puede eliminar esta materia prima porque ya tiene un historial de movimientos.');
      }
      throw error;
    }
    res.status(200).json({ message: 'Materia prima eliminada correctamente', data });
  } catch (error: any) {
    res.status(400).json({ message: 'No se pudo eliminar la materia prima', error: error.message });
  }
};

// Registrar movimiento (entrada/salida manual o compra)
export const registrarMovimiento = async (req: Request, res: Response) => {
  const { materia_prima_id, tipo, cantidad, notas, referencia, autorId } = req.body;
  
  try {
    // 1. Obtener materia prima actual
    const { data: mp, error: mpError } = await supabase
      .from('materias_primas')
      .select('*')
      .eq('id', materia_prima_id)
      .single();

    if (mpError || !mp) throw new Error('Materia prima no encontrada');

    const stock_anterior = Number(mp.stock);
    const cantNum = Number(cantidad);
    const stock_nuevo = (tipo === 'entrada' || tipo === 'ajuste_entrada') 
      ? stock_anterior + cantNum 
      : Math.max(0, stock_anterior - cantNum);
      
    const nuevoEstado = stock_nuevo <= 0 ? 'inactivo' : stock_nuevo <= Number(mp.stock_minimo) ? 'stock_bajo' : 'activo';

    // 2. Actualizar stock
    const { error: updateError } = await supabase
      .from('materias_primas')
      .update({ 
        stock: stock_nuevo,
        estado: nuevoEstado 
      })
      .eq('id', materia_prima_id);

    if (updateError) throw updateError;

    // 3. Registrar el movimiento
    const { data: movimiento, error: movError } = await supabase
      .from('movimientos_materias_primas')
      .insert([{
        materia_prima_id,
        materia_prima_nombre: mp.nombre,
        tipo,
        cantidad: cantNum,
        stock_anterior,
        stock_nuevo,
        referencia: referencia || 'Movimiento manual',
        notas,
        registrado_por: autorId
      }])
      .select()
      .single();

    if (movError) throw movError;

    res.status(201).json(movimiento);
  } catch (error: any) {
    res.status(400).json({ message: 'Error al registrar el movimiento', error: error.message });
  }
};

// Obtener historial de movimientos
export const getMovimientos = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('movimientos_materias_primas')
      .select('*, profiles!movimientos_materias_primas_registrado_por_fkey(nombre)')
      .order('fecha', { ascending: false });

    if (error) throw error;
    
    const formattedData = data?.map((m: any) => ({
      ...m,
      registrado_por: m.profiles?.nombre || m.registrado_por
    }));

    res.status(200).json(formattedData);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener movimientos', error: error.message });
  }
};

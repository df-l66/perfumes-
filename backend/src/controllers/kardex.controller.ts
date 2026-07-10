import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getKardex = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('movimientos_kardex')
      .select('*, profiles!movimientos_kardex_registrado_por_fkey(nombre)')
      .order('fecha', { ascending: false });

    if (error) throw error;
    
    const formattedData = data?.map((m: any) => ({
      ...m,
      registrado_por: m.profiles?.nombre || m.registrado_por
    }));

    res.status(200).json(formattedData);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener el kardex', error: error.message });
  }
};

export const registrarAjuste = async (req: Request, res: Response) => {
  const { producto_id, tipo, cantidad, notas, autorId, autorNombre } = req.body;
  
  try {
    // 1. Obtener producto actual
    const { data: prod, error: prodError } = await supabase
      .from('productos')
      .select('*')
      .eq('id', producto_id)
      .single();

    if (prodError || !prod) throw new Error('Producto no encontrado');

    const stock_anterior = prod.stock;
    const stock_nuevo = tipo === 'ajuste_entrada' 
      ? stock_anterior + cantidad 
      : Math.max(0, stock_anterior - cantidad);
      
    const nuevoEstado = stock_nuevo <= 0 ? 'inactivo' : stock_nuevo <= prod.stock_minimo ? 'stock_bajo' : 'activo';

    // 2. Actualizar stock del producto
    const { error: updateError } = await supabase
      .from('productos')
      .update({ 
        stock: stock_nuevo,
        estado: nuevoEstado 
      })
      .eq('id', producto_id);

    if (updateError) throw updateError;

    // 3. Registrar el movimiento en el Kardex
    const { data: movimiento, error: movError } = await supabase
      .from('movimientos_kardex')
      .insert([{
        producto_id,
        producto_nombre: prod.nombre,
        tipo,
        cantidad,
        stock_anterior,
        stock_nuevo,
        referencia: 'Ajuste Manual',
        notas,
        registrado_por: autorId
      }])
      .select()
      .single();

    if (movError) throw movError;

    res.status(201).json(movimiento);
  } catch (error: any) {
    res.status(400).json({ message: 'Error al registrar el ajuste de kardex', error: error.message });
  }
};

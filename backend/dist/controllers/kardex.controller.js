"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarAjuste = exports.getKardex = void 0;
const supabase_1 = require("../config/supabase");
const getKardex = async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('movimientos_kardex')
            .select('*')
            .order('fecha', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener el kardex', error: error.message });
    }
};
exports.getKardex = getKardex;
const registrarAjuste = async (req, res) => {
    const { producto_id, tipo, cantidad, notas, autorNombre } = req.body;
    try {
        // 1. Obtener producto actual
        const { data: prod, error: prodError } = await supabase_1.supabase
            .from('productos')
            .select('*')
            .eq('id', producto_id)
            .single();
        if (prodError || !prod)
            throw new Error('Producto no encontrado');
        const stock_anterior = prod.stock;
        const stock_nuevo = tipo === 'ajuste_entrada'
            ? stock_anterior + cantidad
            : Math.max(0, stock_anterior - cantidad);
        const nuevoEstado = stock_nuevo <= 0 ? 'inactivo' : stock_nuevo <= prod.stock_minimo ? 'stock_bajo' : 'activo';
        // 2. Actualizar stock del producto
        const { error: updateError } = await supabase_1.supabase
            .from('productos')
            .update({
            stock: stock_nuevo,
            estado: nuevoEstado
        })
            .eq('id', producto_id);
        if (updateError)
            throw updateError;
        // 3. Registrar el movimiento en el Kardex
        const { data: movimiento, error: movError } = await supabase_1.supabase
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
                registrado_por: autorNombre
            }])
            .select()
            .single();
        if (movError)
            throw movError;
        res.status(201).json(movimiento);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al registrar el ajuste de kardex', error: error.message });
    }
};
exports.registrarAjuste = registrarAjuste;

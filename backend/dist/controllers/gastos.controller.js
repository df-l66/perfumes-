"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGasto = exports.createGasto = exports.getGastos = void 0;
const supabase_1 = require("../config/supabase");
const getGastos = async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('gastos')
            .select('*')
            .order('fecha', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener gastos', error: error.message });
    }
};
exports.getGastos = getGastos;
const createGasto = async (req, res) => {
    const gastoData = req.body;
    try {
        const { data, error } = await supabase_1.supabase
            .from('gastos')
            .insert([gastoData])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al registrar el gasto', error: error.message });
    }
};
exports.createGasto = createGasto;
const deleteGasto = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase_1.supabase
            .from('gastos')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        res.status(200).json({ message: 'Gasto eliminado correctamente' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar el gasto', error: error.message });
    }
};
exports.deleteGasto = deleteGasto;

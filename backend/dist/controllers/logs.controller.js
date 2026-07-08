"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLog = exports.getLogs = void 0;
const supabase_1 = require("../config/supabase");
const getLogs = async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('activity_logs')
            .select('*')
            .order('fecha', { ascending: false })
            .limit(100); // Traer solo los últimos 100 para no saturar
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener logs', error: error.message });
    }
};
exports.getLogs = getLogs;
const createLog = async (req, res) => {
    const logData = req.body;
    try {
        const { data, error } = await supabase_1.supabase
            .from('activity_logs')
            .insert([logData])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al guardar log', error: error.message });
    }
};
exports.createLog = createLog;

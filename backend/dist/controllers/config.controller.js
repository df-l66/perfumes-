"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConfig = exports.getConfig = void 0;
const supabase_1 = require("../config/supabase");
const getConfig = async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('company_config')
            .select('*')
            .eq('id', 1)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error; // Ignorar error de no encontrado
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener configuracion', error: error.message });
    }
};
exports.getConfig = getConfig;
const updateConfig = async (req, res) => {
    const config = req.body;
    try {
        const { data, error } = await supabase_1.supabase
            .from('company_config')
            .upsert([{ ...config, id: 1 }])
            .select()
            .single();
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al actualizar configuracion', error: error.message });
    }
};
exports.updateConfig = updateConfig;

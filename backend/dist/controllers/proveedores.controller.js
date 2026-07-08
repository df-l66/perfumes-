"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProveedor = exports.updateProveedor = exports.createProveedor = exports.getProveedorById = exports.getProveedores = void 0;
const supabase_1 = require("../config/supabase");
const getProveedores = async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('proveedores')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener proveedores', error: error.message });
    }
};
exports.getProveedores = getProveedores;
const getProveedorById = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase_1.supabase
            .from('proveedores')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};
exports.getProveedorById = getProveedorById;
const createProveedor = async (req, res) => {
    const providerData = req.body;
    try {
        const { data, error } = await supabase_1.supabase
            .from('proveedores')
            .insert([providerData])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (error) {
        res.status(400).json({ message: 'No se pudo crear el proveedor', error: error.message });
    }
};
exports.createProveedor = createProveedor;
const updateProveedor = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        const { data, error } = await supabase_1.supabase
            .from('proveedores')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(400).json({ message: 'No se pudo actualizar el proveedor', error: error.message });
    }
};
exports.updateProveedor = updateProveedor;
const deleteProveedor = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase_1.supabase
            .from('proveedores')
            .delete()
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        res.status(200).json({ message: 'Proveedor eliminado correctamente', data });
    }
    catch (error) {
        res.status(500).json({ message: 'No se pudo eliminar el proveedor', error: error.message });
    }
};
exports.deleteProveedor = deleteProveedor;

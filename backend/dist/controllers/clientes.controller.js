"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCliente = exports.updateCliente = exports.createCliente = exports.getClienteById = exports.getClientes = void 0;
const supabase_1 = require("../config/supabase");
const getClientes = async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('clientes')
            .select('*')
            .order('fecha_registro', { ascending: false });
        if (error) {
            console.error(error);
            throw error;
        }
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
    }
};
exports.getClientes = getClientes;
const getClienteById = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase_1.supabase
            .from('clientes')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ message: 'Cliente no encontrado' });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};
exports.getClienteById = getClienteById;
const createCliente = async (req, res) => {
    const clienteData = req.body;
    try {
        const { data, error } = await supabase_1.supabase
            .from('clientes')
            .insert([clienteData])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (error) {
        res.status(400).json({ message: 'No se pudo crear el cliente', error: error.message });
    }
};
exports.createCliente = createCliente;
const updateCliente = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        const { data, error } = await supabase_1.supabase
            .from('clientes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ message: 'Cliente no encontrado' });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(400).json({ message: 'No se pudo actualizar el cliente', error: error.message });
    }
};
exports.updateCliente = updateCliente;
const deleteCliente = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase_1.supabase
            .from('clientes')
            .delete()
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        res.status(200).json({ message: 'Cliente eliminado correctamente', data });
    }
    catch (error) {
        res.status(500).json({ message: 'No se pudo eliminar el cliente', error: error.message });
    }
};
exports.deleteCliente = deleteCliente;

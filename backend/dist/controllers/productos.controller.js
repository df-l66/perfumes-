"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProducto = exports.updateProducto = exports.createProducto = exports.getProductoById = exports.getProductos = void 0;
const supabase_1 = require("../config/supabase");
// Obtener todos los productos
const getProductos = async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('productos')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};
exports.getProductos = getProductos;
// Obtener un solo producto por ID
const getProductoById = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase_1.supabase
            .from('productos')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ message: 'Producto no encontrado' });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};
exports.getProductoById = getProductoById;
// Crear un nuevo producto
const createProducto = async (req, res) => {
    const productData = req.body;
    try {
        const { data, error } = await supabase_1.supabase
            .from('productos')
            .insert([productData])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (error) {
        console.error('Error al crear producto:', error);
        res.status(400).json({ message: 'No se pudo crear el producto', error: error.message });
    }
};
exports.createProducto = createProducto;
// Actualizar un producto existente
const updateProducto = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        const { data, error } = await supabase_1.supabase
            .from('productos')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ message: 'Producto no encontrado para actualizar' });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(400).json({ message: 'No se pudo actualizar el producto', error: error.message });
    }
};
exports.updateProducto = updateProducto;
// Eliminar un producto
const deleteProducto = async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase_1.supabase
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
    }
    catch (error) {
        res.status(400).json({ message: 'No se pudo eliminar el producto', error: error.message });
    }
};
exports.deleteProducto = deleteProducto;

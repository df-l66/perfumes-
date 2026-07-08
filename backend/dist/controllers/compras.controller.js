"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anularCompra = exports.createCompra = exports.getCompras = void 0;
const supabase_1 = require("../config/supabase");
const getCompras = async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('compras')
            .select(`
        *,
        compra_detalles (*)
      `)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        const formattedData = data.map((compra) => ({
            ...compra,
            items: compra.compra_detalles
        }));
        res.status(200).json(formattedData);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener compras', error: error.message });
    }
};
exports.getCompras = getCompras;
const createCompra = async (req, res) => {
    const { items, ...compraData } = req.body;
    try {
        const { data: compra, error: compraError } = await supabase_1.supabase
            .from('compras')
            .insert([compraData])
            .select()
            .single();
        if (compraError)
            throw compraError;
        for (const item of items) {
            const detalleData = {
                compra_id: compra.id,
                producto_id: item.producto_id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio_costo: item.precio_costo,
                precio_venta: item.precio_venta,
                subtotal: item.subtotal
            };
            await supabase_1.supabase.from('compra_detalles').insert([detalleData]);
            const { data: prod } = await supabase_1.supabase
                .from('productos')
                .select('stock, stock_minimo')
                .eq('id', item.producto_id)
                .single();
            if (prod) {
                const nuevoStock = prod.stock + item.cantidad;
                const nuevoEstado = nuevoStock <= 0 ? 'inactivo' : nuevoStock <= prod.stock_minimo ? 'stock_bajo' : 'activo';
                // Actualizar stock y precio de costo/venta
                const updatePayload = {
                    stock: nuevoStock,
                    estado: nuevoEstado,
                    precio_costo: item.precio_costo
                };
                if (item.precio_venta && item.precio_venta > 0) {
                    updatePayload.precio_venta = item.precio_venta;
                }
                await supabase_1.supabase
                    .from('productos')
                    .update(updatePayload)
                    .eq('id', item.producto_id);
                // Registrar en Kardex
                await supabase_1.supabase.from('movimientos_kardex').insert([{
                        producto_id: item.producto_id,
                        producto_nombre: item.nombre,
                        tipo: 'entrada',
                        cantidad: item.cantidad,
                        stock_anterior: prod.stock,
                        stock_nuevo: nuevoStock,
                        referencia: `Compra ${compra.factura_compra}`,
                        registrado_por: compraData.comprador_nombre
                    }]);
            }
        }
        res.status(201).json(compra);
    }
    catch (error) {
        res.status(400).json({ message: 'No se pudo crear la compra', error: error.message });
    }
};
exports.createCompra = createCompra;
const anularCompra = async (req, res) => {
    const { id } = req.params;
    const { autorNombre } = req.body;
    try {
        const { data: compra, error: fetchError } = await supabase_1.supabase
            .from('compras')
            .select('*, compra_detalles(*)')
            .eq('id', id)
            .single();
        if (fetchError || !compra)
            throw new Error('Compra no encontrada');
        if (compra.estado === 'anulada')
            throw new Error('La compra ya estaba anulada');
        const { error: updateError } = await supabase_1.supabase
            .from('compras')
            .update({ estado: 'anulada' })
            .eq('id', id);
        if (updateError)
            throw updateError;
        // Descontar el stock (reversar compra)
        for (const item of compra.compra_detalles) {
            const { data: prod } = await supabase_1.supabase
                .from('productos')
                .select('stock, stock_minimo')
                .eq('id', item.producto_id)
                .single();
            if (prod) {
                const nuevoStock = prod.stock - item.cantidad;
                const nuevoEstado = nuevoStock <= 0 ? 'inactivo' : nuevoStock <= prod.stock_minimo ? 'stock_bajo' : 'activo';
                await supabase_1.supabase
                    .from('productos')
                    .update({
                    stock: nuevoStock,
                    estado: nuevoEstado
                })
                    .eq('id', item.producto_id);
                await supabase_1.supabase.from('movimientos_kardex').insert([{
                        producto_id: item.producto_id,
                        producto_nombre: item.nombre,
                        tipo: 'ajuste_salida',
                        cantidad: item.cantidad,
                        stock_anterior: prod.stock,
                        stock_nuevo: nuevoStock,
                        referencia: `Anulación de Compra ${compra.factura_compra}`,
                        registrado_por: autorNombre || 'Sistema'
                    }]);
            }
        }
        res.status(200).json({ message: 'Compra anulada correctamente' });
    }
    catch (error) {
        res.status(500).json({ message: 'No se pudo anular la compra', error: error.message });
    }
};
exports.anularCompra = anularCompra;

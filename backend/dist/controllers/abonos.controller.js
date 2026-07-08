"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAbono = exports.getAbonos = void 0;
const supabase_1 = require("../config/supabase");
const getAbonos = async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('abonos')
            .select('*')
            .order('fecha', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener abonos', error: error.message });
    }
};
exports.getAbonos = getAbonos;
const createAbono = async (req, res) => {
    const { cliente_id, cliente_nombre, monto, metodo_pago, notas, registrado_por } = req.body;
    try {
        // 1. Insertar abono
        const { data: abono, error: insertError } = await supabase_1.supabase
            .from('abonos')
            .insert([{
                cliente_id,
                cliente_nombre,
                monto,
                metodo_pago,
                notas,
                registrado_por
            }])
            .select()
            .single();
        if (insertError)
            throw insertError;
        // 2. Actualizar crédito del cliente
        const { data: cliente, error: cliError } = await supabase_1.supabase
            .from('clientes')
            .select('credito_usado')
            .eq('id', cliente_id)
            .single();
        if (cliente && !cliError) {
            const nuevoCredito = Math.max(0, (cliente.credito_usado || 0) - monto);
            await supabase_1.supabase
                .from('clientes')
                .update({ credito_usado: nuevoCredito })
                .eq('id', cliente_id);
        }
        res.status(201).json(abono);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al registrar el abono', error: error.message });
    }
};
exports.createAbono = createAbono;

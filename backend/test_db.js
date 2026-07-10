const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const { data, error } = await supabase.from('ventas').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data:", data);
  }
}

async function tryRPC() {
  const payload = {
      factura: "TEST-0001",
      cliente_id: null,
      cliente_nombre: "TEST",
      vendedor_id: "00000000-0000-0000-0000-000000000000",
      vendedor_nombre: "TEST",
      subtotal: 100,
      descuento: 0,
      impuestos: 0,
      total: 100,
      metodo_pago: "contado",
      monto_pagado: 100,
      cambio: 0,
      estado: "completada"
  };
  const { data, error } = await supabase.rpc('registrar_venta_transaccion', {
      venta_data: payload,
      items_data: []
  });
  console.log("RPC Result:", data, "RPC Error:", error);
}

checkTable().then(tryRPC);

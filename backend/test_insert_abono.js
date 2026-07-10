const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY);
async function testInsert() {
  const { data, error } = await supabase.from('abonos').insert([{
    cliente_id: "00000000-0000-0000-0000-000000000000",
    cliente_nombre: "Test",
    monto: 100,
    metodo_pago: "efectivo",
    notas: "Test",
    registrado_por: "Admin"
  }]).select().single();
  console.log("Insert result:", data);
  if (error) console.error("Insert error:", error);
}
testInsert();

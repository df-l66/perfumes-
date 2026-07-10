const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY);
async function testInsert() {
  const { data, error } = await supabase.from('gastos').insert([{
    descripcion: "Test",
    monto: 100,
    registrado_por: "Admin"
  }]).select().single();
  console.log("Gastos Insert error:", error);
}
testInsert();

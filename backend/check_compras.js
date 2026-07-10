const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY);
async function checkCompras() {
  const { data, error } = await supabase.from('compras').select('*').limit(1);
  console.log("Compras:", data);
  if (error) console.error(error);
}
checkCompras();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY);
async function checkAbonos() {
  const { data, error } = await supabase.from('abonos').select('*').limit(1);
  console.log("Abonos table data:", data);
  if (error) console.error("Error Abonos table:", error);
}
checkAbonos();

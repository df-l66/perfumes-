const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY);
async function checkSchema() {
  const { data, error } = await supabase.from('abonos').select('*').limit(1);
  if (error) console.error(error);
  console.log("columns check");
  const { data: cols } = await supabase.rpc('get_table_columns', { table_name: 'abonos' });
  console.log(cols);
}
checkSchema();

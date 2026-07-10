const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVentas() {
  const { data, error } = await supabase.from('ventas').select('*');
  if (error) {
    console.error("Error fetching ventas:", error);
  } else {
    console.log("Total ventas in DB:", data?.length);
    console.log("Sample:", data?.[0]);
  }
}

checkVentas();

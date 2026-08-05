import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Request } from 'express';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan credenciales de Supabase en el archivo .env');
}

// Cliente principal de Supabase usando la Service Role Key para omitir RLS en el servidor Node.js
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export const getSupabaseClient = (_req?: Request) => {
  return supabase;
};

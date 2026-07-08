import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Nota: para verificar JWT propiamente en Supabase, a veces se usa la anon key o JWT_SECRET

const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de autorización faltante o inválido' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar el token con Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ message: 'Token expirado o no autorizado', error: error?.message });
    }

    // Opcional: Inyectar el ID de usuario en la request
    (req as any).user = data.user;
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error de autenticación' });
  }
};

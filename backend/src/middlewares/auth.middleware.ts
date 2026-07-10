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
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return res.status(401).json({ message: 'Token expirado o no autorizado', error: authError?.message });
    }

    // Obtener el perfil para saber el rol
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ message: 'Perfil de usuario no encontrado', error: profileError?.message });
    }

    // Inyectar el usuario y su rol en la request
    (req as any).user = {
      ...authData.user,
      rol: profile.rol
    };
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error de autenticación' });
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user || user.rol !== 'admin') {
    return res.status(403).json({ 
      message: 'Acceso Denegado. Se requieren permisos de administrador para realizar esta acción.' 
    });
  }
  
  next();
};

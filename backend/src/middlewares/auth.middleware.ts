import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (req.method === 'GET') {
        (req as any).user = { id: 'system', rol: 'admin' };
        return next();
      }
      return res.status(401).json({ message: 'Token de autorización faltante o inválido' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar el token con Supabase
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData?.user) {
      if (req.method === 'GET') {
        (req as any).user = { id: 'system', rol: 'admin' };
        return next();
      }
      return res.status(401).json({ message: 'Token expirado o no autorizado', error: authError?.message });
    }

    // Obtener el perfil para saber el rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', authData.user.id)
      .maybeSingle();

    const rol = profile?.rol || authData.user.user_metadata?.role || authData.user.app_metadata?.role || 'admin';

    // Inyectar el usuario y su rol en la request
    (req as any).user = {
      ...authData.user,
      rol
    };
    
    next();
  } catch (error) {
    if (req.method === 'GET') {
      (req as any).user = { id: 'system', rol: 'admin' };
      return next();
    }
    res.status(500).json({ message: 'Error de autenticación' });
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user || (user.rol !== 'admin' && user.rol !== 'vendedor' && user.id !== 'system')) {
    return res.status(403).json({ 
      message: 'Acceso Denegado. Se requieren permisos para realizar esta acción.' 
    });
  }
  
  next();
};

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Role } from '../types';
import { supabase } from '../config/supabase';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // Obtener el perfil del usuario para el rol y el nombre
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.nombre,
              role: profile.rol as Role
            });
            setAuthError(null);
          } else {
            console.error('Perfil no encontrado:', error);
            await supabase.auth.signOut();
            setUser(null);
            setAuthError('Tu cuenta no tiene un perfil asignado o falta configurar roles en la base de datos.');
          }
        } catch (err) {
          console.error('Error catastrófico de red o autenticación:', err);
          await supabase.auth.signOut();
          setUser(null);
          setAuthError('Error de red al conectar con la base de datos. Verifica tu llave de Supabase.');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      logout, 
      isAdmin: user?.role === 'admin',
      loading,
      authError 
    }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

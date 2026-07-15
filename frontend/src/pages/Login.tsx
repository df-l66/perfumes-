import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { authError } = useAuth();
  
  const navigate = useNavigate();

  // Detener el loading si hay un error global de auth (ej. falta de perfil)
  React.useEffect(() => {
    if (authError) {
      setLoading(false);
    }
  }, [authError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLocalError(
        signInError.message === 'Invalid login credentials' 
          ? 'Correo o contraseña incorrectos.' 
          : signInError.message
      );
      setLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex bg-zinc-900">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-amber-950/60 via-zinc-900 to-zinc-950" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl animate-pulse-subtle" />

        <div className="relative animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Building2 size={20} className="text-white animate-pulse" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">GestiónPro</span>
          </div>
        </div>

        <div className="relative space-y-6 animate-fade-in-up animation-delay-100">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Plataforma Asegurada<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-emerald-400">Nivel Empresarial</span>
            </h2>
            <p className="text-zinc-400 mt-4 text-lg leading-relaxed max-w-md">
              Toda la información viaja protegida bajo encriptación SSL y tokens JWT. Control estricto de acceso.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              'Autenticación blindada impulsada por Supabase',
              'Control de accesos basado en perfiles autorizados',
              'Registro completo de auditoría y movimientos'
            ].map((f, index) => (
              <div key={index} className="flex items-center gap-3 transition-transform hover:translate-x-1 duration-200">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <span className="text-zinc-300 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-fade-in-up animation-delay-300">
          <p className="text-zinc-600 text-xs font-medium">© 2025 GestiónPro · Entorno Seguro</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />
        <div className="w-full max-w-md relative z-10 animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-md">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-zinc-800 font-bold text-lg">GestiónPro</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-zinc-200/80 border border-zinc-100 p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-200">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Acceso Restringido</h1>
              <p className="text-zinc-500 mt-1.5 text-sm">Ingresa tus credenciales para continuar</p>
            </div>

            {displayError && (
              <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-zinc-800"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-zinc-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-zinc-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 disabled:opacity-70 disabled:hover:bg-amber-600 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-amber-600/25 hover:shadow-xl hover:shadow-amber-600/35 cursor-pointer text-sm"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Iniciar Sesión Segura'}
              </button>
            </form>

            <p className="text-center text-[10px] uppercase font-bold tracking-wider text-zinc-400 mt-6">
              Contacta al administrador si olvidaste tu clave
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

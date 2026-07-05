import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

export function Login() {
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    login(selectedRole);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-teal-950/60 via-slate-900 to-slate-950" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-teal-400/5 rounded-full blur-2xl animate-pulse-subtle" />

        <div className="relative animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Building2 size={20} className="text-white animate-pulse" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">GestiónPro</span>
          </div>
        </div>

        <div className="relative space-y-6 animate-fade-in-up animation-delay-100">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Control total de tu<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-400 to-emerald-400">negocio</span>
            </h2>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed max-w-md">
              Gestiona productos, proveedores, clientes y ventas desde una plataforma intuitiva y optimizada.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              'Inventario inteligente con alertas de stock bajo',
              'Flujo interactivo de ventas con carrito automatizado',
              'Permisos estructurados según tu rol (Admin y Vendedor)'
            ].map((f, index) => (
              <div key={f} className="flex items-center gap-3 transition-transform hover:translate-x-1 duration-200">
                <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                </div>
                <span className="text-slate-300 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-fade-in-up animation-delay-300">
          <p className="text-slate-600 text-xs font-medium">© 2025 GestiónPro · Experiencia Corporativa Refinada</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600/5 rounded-full blur-3xl" />
        <div className="w-full max-w-md relative z-10 animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shadow-md">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-slate-800 font-bold text-lg">GestiónPro</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Iniciar sesión</h1>
              <p className="text-slate-500 mt-1.5 text-sm">Selecciona tu rol para acceder al sistema</p>
            </div>

            {/* Role selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Rol de acceso</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Admin */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer active:scale-97 ${
                    selectedRole === 'admin'
                      ? 'border-teal-500 bg-teal-50/50 shadow-sm shadow-teal-100/50 -translate-y-0.5'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedRole === 'admin' ? 'bg-teal-500 shadow-md shadow-teal-500/20' : 'bg-slate-100'}`}>
                    <ShieldCheck size={20} className={selectedRole === 'admin' ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-sm ${selectedRole === 'admin' ? 'text-teal-700' : 'text-slate-700'}`}>Administrador</p>
                    <p className="text-slate-400 text-[10px] uppercase font-semibold mt-0.5 tracking-wider">Acceso total</p>
                  </div>
                </button>

                {/* Vendedor */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('vendedor')}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer active:scale-97 ${
                    selectedRole === 'vendedor'
                      ? 'border-teal-500 bg-teal-50/50 shadow-sm shadow-teal-100/50 -translate-y-0.5'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedRole === 'vendedor' ? 'bg-teal-500 shadow-md shadow-teal-500/20' : 'bg-slate-100'}`}>
                    <UserCheck size={20} className={selectedRole === 'vendedor' ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-sm ${selectedRole === 'vendedor' ? 'text-teal-700' : 'text-slate-700'}`}>Vendedor</p>
                    <p className="text-slate-400 text-[10px] uppercase font-semibold mt-0.5 tracking-wider">Operación</p>
                  </div>
                </button>
              </div>
            </div>

            {/* User info preview */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 transition-colors duration-300">
              <div className="w-8 h-8 rounded-full bg-teal-600/10 text-teal-600 flex items-center justify-center font-bold text-sm">
                {selectedRole === 'admin' ? 'A' : 'L'}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Identidad Simulada</p>
                <p className="text-sm font-bold text-slate-800">
                  {selectedRole === 'admin' ? 'Admin Sistema' : 'Laura Gómez'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {selectedRole === 'admin' ? 'admin@sistema.co' : 'lgomez@sistema.co'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-3.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-teal-600/25 hover:shadow-xl hover:shadow-teal-600/35 cursor-pointer text-center text-sm"
            >
              Acceder al sistema
            </button>

            <p className="text-center text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-5">
              Entorno Demostrativo · Sin Contraseña
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { UserPlus, Building2, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchCreateClientePublico } from '../api/clientes';

export function RegistroCliente() {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'persona' as 'empresa' | 'persona',
    documento: '',
    email: '',
    telefono: '',
    ciudad: '',
    direccion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!formData.nombre.trim()) throw new Error('El nombre o razón social es obligatorio.');
      if (!formData.documento.trim()) throw new Error('El documento (NIT/Cédula) es obligatorio.');
      if (!/^\d+$/.test(formData.documento.trim())) throw new Error('El documento debe contener únicamente números.');
      if (formData.documento.trim().length < 5) throw new Error('El número de documento es muy corto.');

      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          throw new Error('Por favor, ingresa un correo electrónico válido.');
        }
      }

      if (formData.telefono) {
        const telDigitos = formData.telefono.replace(/\s+/g, '');
        if (!/^\+?\d+$/.test(telDigitos)) {
          throw new Error('El teléfono debe contener únicamente dígitos numéricos (puede incluir un + al inicio).');
        }
        if (telDigitos.length < 7) {
          throw new Error('El número de teléfono es muy corto.');
        }
      }

      await fetchCreateClientePublico({
        ...formData,
        fecha_registro: new Date().toISOString().split('T')[0],
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Hubo un error al procesar tu registro. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex bg-zinc-900 items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">¡Registro Exitoso!</h2>
            <p className="text-zinc-600">Tus datos han sido guardados correctamente. Ahora eres parte de nuestros clientes.</p>
          </div>
          <div className="pt-4 border-t border-zinc-100">
            <p className="text-sm font-medium text-zinc-500 mb-1">¿Qué sigue?</p>
            <p className="text-sm text-zinc-500">Pronto un asesor se pondrá en contacto contigo. Ya puedes cerrar esta pestaña de forma segura.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-zinc-900">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-amber-950/60 via-zinc-900 to-zinc-950" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl animate-pulse-subtle" />

        <div className="relative animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-transparent flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-amber-500'); }} />
            </div>
            <span className="text-amber-500 font-extrabold text-3xl tracking-tight">Fragancias JM</span>
          </div>
        </div>

        <div className="relative space-y-6 animate-fade-in-up animation-delay-100">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Únete a nosotros<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-emerald-400">Regístrate ahora</span>
            </h2>
            <p className="text-zinc-400 mt-4 text-lg leading-relaxed max-w-md">
              Completa tus datos para ser registrado como cliente en nuestro sistema y disfrutar de nuestros servicios.
            </p>
          </div>
        </div>

        <div className="relative animate-fade-in-up animation-delay-300">
          <p className="text-zinc-600 text-xs font-medium">© 2026 Fragancias JM · Entorno Seguro</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col p-8 bg-zinc-50 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-lg mx-auto my-auto relative z-10 animate-fade-in-up py-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-20 h-20 rounded-xl bg-transparent overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-amber-500'); }} />
            </div>
            <span className="text-amber-600 font-bold text-2xl">Fragancias JM</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-zinc-200/80 border border-zinc-100 p-8">
            <div className="mb-8 text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900">Registro de Cliente</h1>
              <p className="text-zinc-500 mt-2 text-sm">Ingresa tus datos para registrarte</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-3">
                <div className="mt-0.5"><AlertCircle className="w-4 h-4 text-red-600" /></div>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex gap-4 p-1 bg-zinc-100 rounded-xl">
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    formData.tipo === 'persona' 
                      ? 'bg-white text-zinc-900 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                  onClick={() => setFormData({ ...formData, tipo: 'persona' })}
                >
                  <User size={16} /> Persona
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    formData.tipo === 'empresa' 
                      ? 'bg-white text-zinc-900 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                  onClick={() => setFormData({ ...formData, tipo: 'empresa' })}
                >
                  <Building2 size={16} /> Empresa
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  {formData.tipo === 'empresa' ? 'Razón Social' : 'Nombre Completo'}
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.replace(/\d/g, '') })}
                  placeholder={formData.tipo === 'empresa' ? 'Ej. Inversiones ABC' : 'Ej. Juan Pérez'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    {formData.tipo === 'empresa' ? 'NIT' : 'Documento'}
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                    value={formData.documento}
                    onChange={(e) => setFormData({ ...formData, documento: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Teléfono</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/[^\d+]/g, '') })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Ciudad</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value.replace(/\d/g, '') })}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Dirección</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3.5 px-4 rounded-xl font-semibold transition-colors disabled:opacity-70 mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Completar Registro'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

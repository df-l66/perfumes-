import React, { useState } from 'react';
import { Save, Building2, Landmark } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { AlertBox } from '../components/ui/AlertBox';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import type { CompanyConfig } from '../types';

export function Configuracion() {
  const { configuracion, updateConfiguracion } = useAppData();
  const { user, isAdmin } = useAuth();
  const [form, setForm] = useState<CompanyConfig>({ ...configuracion });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfiguracion(form, user?.name || 'Admin', user?.role || 'admin');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const inp = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed';
  const field = (label: string, children: React.ReactNode) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );

  return (
    <Layout
      title="Configuración"
      subtitle="Parámetros corporativos y fiscales del sistema"
    >
      <div className="max-w-3xl">
        {!isAdmin && (
          <AlertBox type="warning" title="Acceso restringido" className="mb-6">
            Solo los usuarios con el rol de <strong>Administrador</strong> pueden modificar la configuración tributaria y los datos corporativos de la empresa.
          </AlertBox>
        )}

        {success && (
          <AlertBox type="note" title="Configuración guardada" className="mb-6">
            Los parámetros fiscales se han actualizado y se aplicarán a todas las facturas y comprobantes emitidos a partir de este momento.
          </AlertBox>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card: Datos Corporativos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building2 size={18} className="text-teal-600" />
              <h2 className="text-sm font-bold text-slate-800">Información de la Empresa</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('Nombre Comercial o Razón Social', (
                <input
                  required
                  disabled={!isAdmin}
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className={inp}
                />
              ))}
              {field('NIT / Identificación Tributaria', (
                <input
                  required
                  disabled={!isAdmin}
                  value={form.nit}
                  onChange={e => setForm(f => ({ ...f, nit: e.target.value }))}
                  className={inp}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('Dirección Fiscal', (
                <input
                  required
                  disabled={!isAdmin}
                  value={form.direccion}
                  onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                  className={inp}
                />
              ))}
              {field('Teléfono de Contacto', (
                <input
                  required
                  disabled={!isAdmin}
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  className={inp}
                />
              ))}
            </div>
          </div>

          {/* Card: Parámetros Fiscales */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Landmark size={18} className="text-teal-600" />
              <h2 className="text-sm font-bold text-slate-800">Impuestos y Parámetros de Facturación</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {field('IVA (%)', (
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    disabled={!isAdmin}
                    value={form.iva_porcentaje}
                    onChange={e => setForm(f => ({ ...f, iva_porcentaje: +e.target.value }))}
                    className={`${inp} pr-8`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              ))}
              {field('Giro / Rubro Comercial', (
                <select
                  disabled={true}
                  value={form.giro}
                  className={`${inp} bg-slate-50 cursor-not-allowed`}
                >
                  <option value="perfumeria">Perfumería y Fragancias (Fijo)</option>
                </select>
              ))}
              {field('Prefijo Facturación', (
                <input
                  required
                  disabled
                  className={inp}
                  value="FAC-2025-"
                />
              ))}
            </div>

            {field('Resolución Legal de Facturación', (
              <textarea
                required
                rows={3}
                disabled={!isAdmin}
                value={form.resolucion}
                onChange={e => setForm(f => ({ ...f, resolucion: e.target.value }))}
                className={inp}
                placeholder="Texto legal que aparece en la parte inferior de las facturas (resoluciones fiscales, etc.)"
              />
            ))}
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <Button type="submit" icon={<Save size={16} />} className="shadow-lg shadow-teal-600/10">
                Guardar Configuración
              </Button>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
}

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Truck, Search, Eye, Power, Mail, Phone, MapPin, User, FileText, Calendar, DollarSign } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AlertBox } from '../components/ui/AlertBox';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import type { Proveedor, ProveedorEstado } from '../types';

const EMPTY: any = {
  nombre: '', nit: '', contacto: '', telefono: '', email: '', ciudad: '', direccion: '', estado: 'activo'
};

export function Proveedores() {
  const { proveedores, compras, configuracion, addProveedor, updateProveedor, deleteProveedor } = useAppData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState<Proveedor | null>(null);
  const [detailItem, setDetailItem] = useState<Proveedor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  const filtered = React.useMemo(() => {
    return proveedores.filter(p => {
      const s = search.toLowerCase();
      return p.nombre.toLowerCase().includes(s) ||
        p.nit.toLowerCase().includes(s) ||
        p.contacto.toLowerCase().includes(s) ||
        p.ciudad.toLowerCase().includes(s);
    });
  }, [proveedores, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const toggleEstado = (p: Proveedor) => {
    const nuevoEstado: ProveedorEstado = p.estado === 'activo' ? 'inactivo' : 'activo';
    updateProveedor({ ...p, estado: nuevoEstado }, user?.name || 'Usuario', user?.role || 'admin');
  };

  const openCreate = () => { setEditItem(null); setForm(EMPTY); setError(null); setCurrentPage(1); setModalOpen(true); };
  const openEdit = (p: Proveedor) => { setEditItem(p); setForm({ ...p }); setError(null); setCurrentPage(1); setModalOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar nombre único
    const nombreExiste = proveedores.some(p => p.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase() && (!editItem || p.id !== editItem.id));
    if (nombreExiste) {
      setError(`Ya existe un proveedor con el nombre comercial "${form.nombre}".`);
      return;
    }

    // Validar NIT único
    const nitExiste = proveedores.some(p => p.nit.trim().toLowerCase() === form.nit.trim().toLowerCase() && (!editItem || p.id !== editItem.id));
    if (nitExiste) {
      setError(`El NIT "${form.nit}" ya está registrado a nombre de otro proveedor.`);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email.trim())) {
      setError("Por favor ingresa una dirección de correo electrónico válida.");
      return;
    }

    // Validar teléfono numérico
    const telefonoDigitos = form.telefono.replace(/\s+/g, '');
    if (!/^\+?\d+$/.test(telefonoDigitos)) {
      setError("El número de teléfono debe contener únicamente dígitos numéricos (se permiten prefijos +).");
      return;
    }

    const uName = user?.name || 'Usuario';
    const uRole = user?.role || 'admin';
    if (editItem) {
      updateProveedor({ ...form, id: editItem.id }, uName, uRole);
      setSuccessToast('¡Proveedor actualizado con éxito!');
    } else {
      addProveedor(form, uName, uRole);
      setSuccessToast('¡Proveedor registrado con éxito!');
    }
    setModalOpen(false);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const inp = 'w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors bg-white';
  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="block text-xs font-semibold text-zinc-600 mb-1.5">{label}</label>
      {children}
    </div>
  );

  const isAdmin = user?.role === 'admin';

  return (
    <Layout
      title="Proveedores"
      subtitle="Directorio de proveedores registrados"
      action={<Button icon={<Plus size={16} />} onClick={openCreate}>Nuevo Proveedor</Button>}
    >
      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Buscar por nombre, NIT, contacto o ciudad…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
        />
      </div>

      {/* Table view */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-zinc-100">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Truck size={32} className="mx-auto text-zinc-300 mb-3" />
              <p className="text-zinc-400 text-sm">No se encontraron proveedores</p>
            </div>
          ) : paginated.map(p => (
            <div key={p.id} className="p-4 space-y-3 hover:bg-zinc-50/60 transition-colors">
              <div className="flex gap-3 items-start justify-between">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                    <Truck size={16} className="text-zinc-500" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-800 text-sm leading-tight">{p.nombre}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{p.nit} · {p.ciudad}</p>
                  </div>
                </div>
                <Badge variant={p.estado} />
              </div>

              <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100 text-xs text-zinc-600 space-y-1">
                <p><strong>Contacto:</strong> {p.contacto}</p>
                <p><strong>Tel:</strong> {p.telefono}</p>
                <p><strong>Email:</strong> {p.email}</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => setDetailItem(p)} className="flex-1 py-2 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors">
                  <Eye size={14} className="mr-1.5" /> Detalles
                </button>
                {isAdmin && (
                  <>
                    <button onClick={() => openEdit(p)} className="flex-1 py-2 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors">
                      <Pencil size={14} className="mr-1.5" /> Editar
                    </button>
                    <button onClick={() => setDeleteConfirm(p)} className="px-3.5 py-2 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                {[
                  { label: 'Nombre / Empresa', className: '' }, 
                  { label: 'NIT', className: '' }, 
                  { label: 'Contacto', className: 'hidden md:table-cell' }, 
                  { label: 'Teléfono', className: 'hidden sm:table-cell' }, 
                  { label: 'Email', className: 'hidden lg:table-cell' }, 
                  { label: 'Ciudad', className: 'hidden sm:table-cell' }, 
                  { label: 'Estado', className: 'hidden md:table-cell' }, 
                  { label: 'Acciones', className: 'text-right' }
                ].map(h => (
                  <th key={h.label} className={`px-4 sm:px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap ${h.className}`}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Truck size={32} className="mx-auto text-zinc-300 mb-3" />
                    <p className="text-zinc-400 text-sm">No se encontraron proveedores</p>
                  </td>
                </tr>
              ) : paginated.map(p => (
                <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-4 sm:px-5 py-3.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                        <Truck size={14} className="text-zinc-500" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-zinc-800 text-sm truncate max-w-[120px] sm:max-w-xs block">{p.nombre}</span>
                        <span className="text-[10px] sm:hidden text-zinc-500">{p.nit}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 font-mono text-xs text-zinc-500 hidden sm:table-cell">{p.nit}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-zinc-700 hidden md:table-cell">{p.contacto}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-zinc-600 whitespace-nowrap hidden sm:table-cell">{p.telefono}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-zinc-600 hidden lg:table-cell">{p.email}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-zinc-600 hidden sm:table-cell">{p.ciudad}</td>
                  <td className="px-4 sm:px-5 py-3.5 hidden md:table-cell"><Badge variant={p.estado} /></td>
                  <td className="px-4 sm:px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setDetailItem(p)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-amber-600 transition-colors cursor-pointer" title="Ver detalles">
                        <Eye size={16} />
                      </button>
                      {isAdmin && (
                        <>
                          <button 
                            onClick={() => toggleEstado(p)} 
                            className={`p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer ${p.estado === 'inactivo' ? 'text-zinc-400 hover:text-emerald-600' : 'text-emerald-600 hover:text-red-500'}`} 
                            title={p.estado === 'inactivo' ? 'Activar Proveedor' : 'Inactivar Proveedor'}
                          >
                            <Power size={16} />
                          </button>
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-amber-600 transition-colors cursor-pointer" title="Editar">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 font-medium">
          <div>
            {filtered.length > 0 ? (
              <span>
                Mostrando <strong className="text-zinc-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> al <strong className="text-zinc-700">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</strong> de <strong className="text-zinc-700">{filtered.length}</strong> proveedores
              </span>
            ) : (
              <span>0 proveedores encontrados</span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2.5 py-1 rounded-md border border-zinc-200 bg-white text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Anterior
              </button>
              <span className="font-semibold text-zinc-500">
                Pág. {currentPage} de {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-2.5 py-1 rounded-md border border-zinc-200 bg-white text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Proveedor' : 'Nuevo Proveedor'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <AlertBox type="warning" title="Atención" className="mb-4">{error}</AlertBox>}

          {field('Nombre / Empresa', <input required minLength={3} value={form.nombre} onChange={e => setForm((f: any) => ({ ...f, nombre: e.target.value }))} className={inp} />)}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('NIT', <input required minLength={3} value={form.nit} onChange={e => setForm((f: any) => ({ ...f, nit: e.target.value }))} className={inp} placeholder="900.123.456-7" />)}
            {field('Ciudad', <input required value={form.ciudad} onChange={e => setForm((f: any) => ({ ...f, ciudad: e.target.value }))} className={inp} />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Persona de contacto', <input required value={form.contacto} onChange={e => setForm((f: any) => ({ ...f, contacto: e.target.value }))} className={inp} />)}
            {field('Estado', (
              <select value={form.estado} onChange={e => setForm((f: any) => ({ ...f, estado: e.target.value as ProveedorEstado }))} className={inp}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Teléfono', <input required minLength={7} pattern="[+0-9- ]+" value={form.telefono} onChange={e => setForm((f: any) => ({ ...f, telefono: e.target.value }))} className={inp} />)}
            {field('Email', <input type="email" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} className={inp} />)}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editItem ? 'Guardar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar Proveedor" size="sm">
        <AlertBox type="critical" title="Acción irreversible">
          ¿Eliminar a <strong>{deleteConfirm?.nombre}</strong>?
        </AlertBox>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => { deleteProveedor(deleteConfirm!.id, user?.name || 'Usuario', user?.role || 'admin'); setDeleteConfirm(null); }}>Eliminar</Button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Detalles del Proveedor" size="lg">
        {detailItem && (() => {
          const supplierPurchases = compras.filter(c => c.proveedor_id === detailItem.id && c.estado === 'completada');
          const totalInverted = supplierPurchases.reduce((sum, c) => sum + c.total, 0);
          const lastPurchase = supplierPurchases.length > 0
            ? new Date(Math.max(...supplierPurchases.map(c => new Date(c.fecha).getTime()))).toLocaleDateString('es-CO')
            : 'Ninguna';

          return (
            <div className="space-y-6 p-1">
              <div className="flex items-center gap-4 bg-zinc-50 p-4.5 rounded-2xl border border-zinc-200/60 shadow-inner">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-800 leading-tight">{detailItem.nombre}</h3>
                  <p className="text-xs font-mono text-zinc-400 mt-0.5">NIT: {detailItem.nit}</p>
                </div>
                <div className="ml-auto">
                  <Badge variant={detailItem.estado} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Contacto Principal</span>
                  <div className="flex items-center gap-2 mt-1">
                    <User size={13} className="text-zinc-400 shrink-0" />
                    <span className="text-sm font-semibold text-zinc-700">{detailItem.contacto}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Ciudad</span>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin size={13} className="text-zinc-400 shrink-0" />
                    <span className="text-sm font-semibold text-zinc-700">{detailItem.ciudad}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Teléfono de Contacto</span>
                  <a href={`tel:${detailItem.telefono}`} className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-xl border border-zinc-100 hover:border-amber-200 hover:bg-amber-50/20 text-zinc-700 hover:text-amber-600 transition-all font-semibold text-xs w-fit">
                    <Phone size={13} className="shrink-0" />
                    {detailItem.telefono}
                  </a>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Correo Electrónico</span>
                  <a href={`mailto:${detailItem.email}`} className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-xl border border-zinc-100 hover:border-amber-200 hover:bg-amber-50/20 text-zinc-700 hover:text-amber-600 transition-all font-semibold text-xs w-fit">
                    <Mail size={13} className="shrink-0" />
                    {detailItem.email}
                  </a>
                </div>
              </div>

              {/* Estadísticas de Compras (Métricas) */}
              <div className="border-t border-zinc-100 pt-4">
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-3">Métricas de Abastecimiento</span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-center">
                    <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Compras</span>
                    <p className="text-lg font-extrabold text-zinc-700 mt-1 font-mono">{supplierPurchases.length}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-center">
                    <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Total Invertido</span>
                    <p className="text-sm font-bold text-amber-600 mt-1.5 font-mono">{formatCurrency(totalInverted)}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-center">
                    <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Última Transac.</span>
                    <p className="text-xs font-semibold text-zinc-600 mt-2">{lastPurchase}</p>
                  </div>
                </div>
              </div>

              {/* Historial de Compras */}
              <div className="border-t border-zinc-100 pt-4">
                <span className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2.5">Historial de Compras Realizadas</span>
                {(() => {
                  const allSupplierPurchases = compras
                    .filter(c => c.proveedor_id === detailItem.id)
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

                  if (allSupplierPurchases.length === 0) {
                    return <p className="text-xs text-zinc-400 italic">No se han registrado compras con este proveedor.</p>;
                  }

                  return (
                    <div className="rounded-xl border border-zinc-200 overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Factura</th>
                            <th className="py-2 px-3">Fecha</th>
                            <th className="py-2 px-3">Ítems</th>
                            <th className="py-2 px-3 text-right">Total</th>
                            <th className="py-2 px-3 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-zinc-600 bg-white">
                          {allSupplierPurchases.map(c => (
                            <tr key={c.id} className="hover:bg-zinc-50/50">
                              <td className="py-2 px-3 font-mono font-bold text-amber-600">{c.factura_compra}</td>
                              <td className="py-2 px-3">{new Date(c.fecha).toLocaleDateString('es-CO')}</td>
                              <td className="py-2 px-3">{c.items.length} ítems</td>
                              <td className="py-2 px-3 text-right font-semibold font-mono">{formatCurrency(c.total)}</td>
                              <td className="py-2 px-3 text-center">
                                <Badge variant={c.estado} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })()}
        <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-zinc-100">
          <Button variant="secondary" onClick={() => setDetailItem(null)}>Cerrar</Button>
        </div>
      </Modal>

      {/* Toast Animado */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-emerald-600/10 border border-emerald-500/20 animate-slide-in-right">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center animate-bounce-short">
            <svg className="w-3.5 h-3.5 text-white stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-wide">{successToast}</span>
        </div>
      )}
    </Layout>
  );
}

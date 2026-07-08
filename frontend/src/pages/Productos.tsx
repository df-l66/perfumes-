import React, { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Package, FileDown, PlusCircle, Eye, Power } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AlertBox } from '../components/ui/AlertBox';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { exportToCSV as downloadCSV } from '../utils/exportToCSV';
import type { Producto, ProductStatus } from '../types';

const EMPTY: Omit<Producto, 'id'> = {
  codigo: '', nombre: '', categoria: '', proveedor_id: '',
  precio_costo: 0, precio_venta: 0, stock: 0, stock_minimo: 5,
  estado: 'activo', unidad: 'Frasco', descripcion: '',  tipo_producto: 'perfume', calidad: 'Original', mililitros: 100, genero: 'Unisex', familia_olfativa: ''
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const formatNumberWithDots = (val: number | string) => {
  if (val === undefined || val === null || val === 0) return '';
  const numStr = String(val).replace(/\D/g, '');
  if (!numStr) return '';
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(+numStr);
};

export function Productos() {
  const { productos, proveedores, addProducto, updateProducto, deleteProducto, configuracion, kardex, registrarAjusteKardex } = useAppData();
  const { isAdmin, user } = useAuth();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProductStatus | 'todos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Producto | null>(null);
  const [form, setForm] = useState<Omit<Producto, 'id'>>(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState<Producto | null>(null);
  const [detailItem, setDetailItem] = useState<Producto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const [activeTab, setActiveTab] = useState<'catalogo' | 'kardex'>('catalogo');
  const [ajusteModalOpen, setAjusteModalOpen] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({ producto_id: '', tipo: 'ajuste_entrada' as 'ajuste_entrada' | 'ajuste_salida', cantidad: '', notas: '' });
  const [kardexSearch, setKardexSearch] = useState('');
  const [kardexFilterTipo, setKardexFilterTipo] = useState<'todos' | 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida'>('todos');

  const handlePriceChange = (field: 'precio_costo' | 'precio_venta', rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');
    const numericValue = digits ? parseInt(digits, 10) : 0;
    setForm(f => ({ ...f, [field]: numericValue }));
  };

  const toggleEstado = (p: Producto) => {
    const nuevoEstado = p.estado === 'inactivo' 
      ? (p.stock === 0 ? 'inactivo' : p.stock <= p.stock_minimo ? 'stock_bajo' : 'activo') 
      : 'inactivo';
    
    updateProducto({
      ...p,
      estado: nuevoEstado
    }, user?.name || 'Usuario', user?.role || 'admin');
  };

  const filtered = useMemo(() => {
    return productos.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo.toLowerCase().includes(search.toLowerCase()) ||
        p.categoria.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'todos' || p.estado === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [productos, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Producto) => {
    setEditItem(p);
    setForm({ ...p });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar código duplicado
    const codExiste = productos.some(p => p.codigo.trim().toLowerCase() === form.codigo.trim().toLowerCase() && (!editItem || p.id !== editItem.id));
    if (codExiste) {
      setError(`El código de producto "${form.codigo}" ya está asignado a otro perfume.`);
      return;
    }

    // Validar precio de venta vs costo
    if (form.precio_venta < form.precio_costo) {
      setError("El precio de venta no puede ser menor al precio de costo del perfume.");
      return;
    }

    // Validar valores numéricos negativos
    if (form.stock < 0 || form.stock_minimo < 0) {
      setError("Las cantidades de inventario (Stock y Mínimo) no pueden ser valores negativos.");
      return;
    }

    // Validar volumen
    if (!form.mililitros || form.mililitros <= 0) {
      setError("El volumen del perfume debe ser mayor a 0 ml.");
      return;
    }

    // Validar categoría y proveedor seleccionados
    if (!form.categoria) {
      setError("Debes seleccionar una categoría válida para el perfume.");
      return;
    }
    if (!form.proveedor_id) {
      setError("Debes seleccionar un proveedor para el abastecimiento.");
      return;
    }

    const computed = {
      ...form,
      estado: form.estado === 'inactivo'
        ? 'inactivo'
        : form.stock === 0
          ? 'inactivo'
          : form.stock <= form.stock_minimo
            ? 'stock_bajo'
            : 'activo',
    } as Omit<Producto, 'id'>;
    
    const userName = user?.name || 'Usuario';
    const userRole = user?.role || 'admin';
    
    if (editItem) {
      updateProducto({ ...computed, id: editItem.id }, userName, userRole);
      setSuccessToast('¡Perfume/Producto actualizado con éxito!');
    } else {
      addProducto(computed, userName, userRole);
      setSuccessToast('¡Perfume/Producto registrado con éxito!');
    }
    setModalOpen(false);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteProducto(deleteConfirm.id, user?.name || 'Usuario', user?.role || 'admin');
      setDeleteConfirm(null);
    }
  };

  const handleAjusteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ajusteForm.producto_id || !ajusteForm.cantidad) return;
    const qty = parseInt(ajusteForm.cantidad.replace(/\D/g, ''), 10);
    if (qty <= 0) return;
    registrarAjusteKardex(ajusteForm.producto_id, ajusteForm.tipo, qty, ajusteForm.notas, user?.name || 'Usuario', user?.role || 'admin');
    setSuccessToast('Ajuste de inventario registrado con éxito');
    setAjusteModalOpen(false);
    setAjusteForm({ producto_id: '', tipo: 'ajuste_entrada', cantidad: '', notas: '' });
    setTimeout(() => setSuccessToast(null), 3000);
  };



  const exportToCSV = () => {
    const headers: Record<string, string> = {
      codigo: 'Código',
      nombre: 'Nombre',
      categoria: 'Categoría',
      ...(isAdmin ? { precio_costo: 'Precio Costo' } : {}),
      precio_venta: 'Precio Venta',
      stock: 'Stock',
      stock_minimo: 'Stock Mínimo',
      estado: 'Estado'
    };

    downloadCSV(filtered, `Catalogo_Productos_${new Date().toISOString().slice(0, 10)}`, headers);
  };

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );

  const inp = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors bg-white';

  return (
    <Layout
      title="Productos"
      subtitle="Gestión del catálogo de productos"
      action={isAdmin ? <Button icon={<Plus size={16} />} onClick={openCreate}>Nuevo Producto</Button> : undefined}
    >
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('catalogo')}
          className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'catalogo' ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Catálogo de Productos
        </button>
        <button 
          onClick={() => setActiveTab('kardex')}
          className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'kardex' ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Kardex y Ajustes (Historial)
        </button>
      </div>

      {activeTab === 'catalogo' && (
        <>
          {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Buscar por nombre, código o categoría…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {(['todos', 'activo', 'stock_bajo', 'inactivo'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                filterStatus === s
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s === 'todos' ? 'Todos' : s === 'stock_bajo' ? 'Stock Bajo' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <Button variant="secondary" size="sm" icon={<FileDown size={14} />} onClick={exportToCSV} className="ml-auto sm:ml-0">
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  'Código', 
                  'Producto', 
                  'Categoría', 
                  'Calidad', 
                  'Volumen',
                  'Precio Venta', 
                  'Stock', 
                  'Mín.', 
                  'Estado', 
                  'Acciones'
                ].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center">
                    <Package size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-400 text-sm">No se encontraron productos</p>
                  </td>
                </tr>
              ) : paginated.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">{p.codigo}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60 shrink-0 flex items-center justify-center">
                        {p.imagen ? (
                          <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{p.nombre}</p>
                        <p className="text-xs text-slate-400">{p.unidad} · {p.descripcion.slice(0, 50)}{p.descripcion.length > 50 ? '…' : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{p.categoria}</td>
                  
                  {/* Columnas fijas de Perfumes */}
                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium scale-90 ${p.calidad === 'Original' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                      {p.calidad || 'Original'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap font-mono text-xs">{p.mililitros || 100} ml</td>

                  <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{formatCurrency(p.precio_venta)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-bold ${p.stock === 0 ? 'text-red-600' : p.stock <= p.stock_minimo ? 'text-amber-600' : 'text-slate-800'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{p.stock_minimo}</td>
                  <td className="px-5 py-3.5"><Badge variant={p.estado} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailItem(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer" title="Ver detalles">
                        <Eye size={14} />
                      </button>
                      {isAdmin && (
                        <>
                          <button 
                            onClick={() => toggleEstado(p)} 
                            className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${p.estado === 'inactivo' ? 'text-slate-400 hover:text-emerald-600' : 'text-emerald-600 hover:text-red-500'}`} 
                            title={p.estado === 'inactivo' ? 'Activar Perfume' : 'Inactivar Perfume'}
                          >
                            <Power size={14} />
                          </button>
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer" title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer" title="Eliminar">
                            <Trash2 size={14} />
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
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            {filtered.length > 0 ? (
              <span>
                Mostrando <strong className="text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> al <strong className="text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</strong> de <strong className="text-slate-700">{filtered.length}</strong> perfumes
              </span>
            ) : (
              <span>0 perfumes encontrados</span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Anterior
              </button>
              <span className="font-semibold text-slate-500">
                Pág. {currentPage} de {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {activeTab === 'kardex' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={kardexSearch}
                  onChange={e => setKardexSearch(e.target.value)}
                  placeholder="Buscar producto o referencia..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                />
              </div>
              <select 
                value={kardexFilterTipo} 
                onChange={e => setKardexFilterTipo(e.target.value as any)}
                className="w-40 px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              >
                <option value="todos">Todos los tipos</option>
                <option value="entrada">Entradas (Compras)</option>
                <option value="salida">Salidas (Ventas)</option>
                <option value="ajuste_entrada">Sobrantes (Ajuste +)</option>
                <option value="ajuste_salida">Daños/Pérdida (Ajuste -)</option>
              </select>
            </div>
            
            <Button onClick={() => setAjusteModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 border-amber-600 text-white shadow-amber-500/20">
              Registrar Ajuste Manual
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Tipo Movimiento</th>
                    <th className="py-3 px-4 text-right">Cantidad</th>
                    <th className="py-3 px-4 text-right">Stock Final</th>
                    <th className="py-3 px-4">Referencia</th>
                    <th className="py-3 px-4">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kardex
                    .filter(k => 
                      (kardexFilterTipo === 'todos' || k.tipo === kardexFilterTipo) &&
                      (k.producto_nombre.toLowerCase().includes(kardexSearch.toLowerCase()) || 
                       k.referencia.toLowerCase().includes(kardexSearch.toLowerCase()))
                    )
                    .slice(0, 50)
                    .map(k => (
                    <tr key={k.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-500">{new Date(k.fecha).toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{k.producto_nombre}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                          ${k.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-700' :
                            k.tipo === 'salida' ? 'bg-sky-100 text-sky-700' :
                            k.tipo === 'ajuste_entrada' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {k.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-bold font-mono ${(k.tipo === 'entrada' || k.tipo === 'ajuste_entrada') ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(k.tipo === 'entrada' || k.tipo === 'ajuste_entrada') ? '+' : '-'}{k.cantidad}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-700">{k.stock_nuevo}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-600">{k.referencia}</span>
                        {k.notas && <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{k.notas}</p>}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{k.registrado_por}</td>
                    </tr>
                  ))}
                  {kardex.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No hay movimientos en el Kardex todavía.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajuste Manual de Inventario */}
      <Modal isOpen={ajusteModalOpen} onClose={() => setAjusteModalOpen(false)} title="Ajuste de Inventario" size="md">
        <form onSubmit={handleAjusteSubmit} className="space-y-4">
          <AlertBox type="warning" title="Atención">
            Los ajustes manuales alteran el stock físico y se guardan permanentemente en el Kardex para auditoría.
          </AlertBox>
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Producto a Ajustar</label>
            <select 
              required
              value={ajusteForm.producto_id}
              onChange={e => setAjusteForm({...ajusteForm, producto_id: e.target.value})}
              className={inp}
            >
              <option value="">-- Seleccionar producto --</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} (Stock actual: {p.stock})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipo de Ajuste</label>
              <select 
                required
                value={ajusteForm.tipo}
                onChange={e => setAjusteForm({...ajusteForm, tipo: e.target.value as any})}
                className={inp}
              >
                <option value="ajuste_entrada">Sobrante (Aumentar stock)</option>
                <option value="ajuste_salida">Daño/Pérdida (Reducir stock)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cantidad</label>
              <input 
                required
                type="text"
                value={ajusteForm.cantidad}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAjusteForm({...ajusteForm, cantidad: val ? formatNumberWithDots(parseInt(val, 10)) : ''})
                }}
                className={`${inp} font-mono font-bold text-center`}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Justificación (Opcional)</label>
            <textarea 
              value={ajusteForm.notas}
              onChange={e => setAjusteForm({...ajusteForm, notas: e.target.value})}
              className={`${inp} resize-none`}
              rows={2}
              placeholder="Ej: Frasco roto durante limpieza..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setAjusteModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Aplicar Ajuste</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <AlertBox type="critical" title="Error de Validación">
              {error}
            </AlertBox>
          )}

          <div className="grid grid-cols-2 gap-4">
            {field('Código', <input required value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} className={inp} placeholder="PER-001" />)}
            {field('Unidad', <input required value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} className={inp} placeholder="Frasco, Spray…" />)}
          </div>
          {field('Nombre del Producto', <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inp} placeholder="Nombre completo" />)}
          <div className="grid grid-cols-2 gap-4">
            {field('Categoría', (
              <select required value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className={inp}>
                <option value="">— Seleccionar —</option>
                <option value="Fragancias Árabes">Fragancias Árabes</option>
                <option value="Fragancias Casuales">Fragancias Casuales</option>
                <option value="Fragancias Deportivas">Fragancias Deportivas</option>
                <option value="Fragancias Elegantes">Fragancias Elegantes</option>
                <option value="Fragancias Premium">Fragancias Premium</option>
                <option value="Decants / Muestras">Decants / Muestras</option>
              </select>
            ))}
            {field('Proveedor', (
              <select value={form.proveedor_id} onChange={e => setForm(f => ({ ...f, proveedor_id: e.target.value }))} className={inp}>
                <option value="">— Seleccionar —</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {isAdmin && field('Precio Costo (COP)', (
              <input 
                type="text" 
                required 
                value={formatNumberWithDots(form.precio_costo)} 
                onChange={e => handlePriceChange('precio_costo', e.target.value)} 
                className={inp} 
                placeholder="0" 
              />
            ))}
            {field('Precio Venta (COP)', (
              <input 
                type="text" 
                required 
                value={formatNumberWithDots(form.precio_venta)} 
                onChange={e => handlePriceChange('precio_venta', e.target.value)} 
                className={inp} 
                placeholder="0" 
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Stock Actual', <input type="number" min={0} required value={form.stock} onChange={e => setForm(f => ({ ...f, stock: +e.target.value }))} className={inp} />)}
            {field('Stock Mínimo', <input type="number" min={0} required value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: +e.target.value }))} className={inp} />)}
          </div>
          {/* Campos específicos de Perfumería (Fijos) */}
          <div className="p-4.5 bg-teal-50/30 rounded-xl border border-teal-100/50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {field('Calidad del Perfume', (
                <select value={form.calidad || 'Original'} onChange={e => setForm(f => ({ ...f, calidad: e.target.value }))} className={inp}>
                  <option value="Original">Original</option>
                  <option value="1.1 Original">1.1 Original (Alta Similitud)</option>
                  <option value="Replica AAA">Réplica AAA</option>
                  <option value="Tester">Tester / Probador</option>
                  <option value="Decant">Decant (Muestra)</option>
                </select>
              ))}
              {field('Volumen / Tamaño (Mililitros)', (
                <div className="relative">
                  <input type="number" min={1} required value={form.mililitros || 100} onChange={e => setForm(f => ({ ...f, mililitros: +e.target.value }))} className={`${inp} pr-8`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ml</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('Género', (
                <select value={form.genero || 'Unisex'} onChange={e => setForm(f => ({ ...f, genero: e.target.value as any }))} className={inp}>
                  <option value="Unisex">Unisex</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              ))}
              {field('Familia Olfativa', <input value={form.familia_olfativa || ''} onChange={e => setForm(f => ({ ...f, familia_olfativa: e.target.value }))} className={inp} placeholder="Amaderada, Floral, Cítrica…" />)}
            </div>
          </div>

          {field('Descripción', <textarea rows={2} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={inp} placeholder="Descripción corta del producto…" />)}
          <div className="grid grid-cols-2 gap-4">
            {field('Estado del Producto', (
              <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as any }))} className={inp}>
                <option value="activo">Activo / Disponible</option>
                <option value="inactivo">Inactivo / Oculto</option>
              </select>
            ))}
            {field('URL de la Imagen', <input value={form.imagen || ''} onChange={e => setForm(f => ({ ...f, imagen: e.target.value }))} className={inp} placeholder="https://ejemplo.com/perfume.jpg" />)}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editItem ? 'Guardar Cambios' : 'Crear Producto'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar Producto" size="sm">
        <AlertBox type="critical" title="Acción irreversible">
          ¿Estás seguro de que deseas eliminar <strong>{deleteConfirm?.nombre}</strong>?
        </AlertBox>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Sí, eliminar</Button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title="Detalles del Perfume" size="lg">
        {detailItem && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
            <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-200/50 flex items-center justify-center min-h-64 max-h-80 shadow-inner">
              {detailItem.imagen ? (
                <img src={detailItem.imagen} alt={detailItem.nombre} className="w-full h-full object-cover" />
              ) : (
                <Package size={64} className="text-slate-300" />
              )}
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nombre</span>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">{detailItem.nombre}</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{detailItem.codigo} · {detailItem.unidad}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Calidad</span>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${detailItem.calidad === 'Original' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                      {detailItem.calidad || 'Original'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Volumen</span>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 mt-1 font-mono">
                      {detailItem.mililitros || 100} ml
                    </span>
                  </div>
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Categoría</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">{detailItem.categoria}</p>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Proveedor</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    {proveedores.find(pv => pv.id === detailItem.proveedor_id)?.nombre ?? 'Desconocido'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Género</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">{detailItem.genero || 'Unisex'}</p>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Familia Olfativa</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">{detailItem.familia_olfativa || 'No especificada'}</p>
                </div>
              </div>

              <div className="border-t border-b border-slate-100 py-3">
                {isAdmin ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Costo</span>
                      <p className="text-sm font-semibold text-slate-600 mt-0.5">{formatCurrency(detailItem.precio_costo)}</p>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Precio Venta</span>
                      <p className="text-base font-extrabold text-teal-600 mt-0.5">{formatCurrency(detailItem.precio_venta)}</p>
                    </div>
                    <div className="col-span-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 flex items-center justify-between mt-1">
                      <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Utilidad</span>
                      <p className="text-sm font-extrabold text-emerald-600">
                        {detailItem.precio_venta > 0 
                          ? `${(((detailItem.precio_venta - detailItem.precio_costo) / detailItem.precio_venta) * 100).toFixed(1)}%` 
                          : '0.0%'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Precio Venta</span>
                    <p className="text-base font-extrabold text-teal-600 mt-0.5">{formatCurrency(detailItem.precio_venta)}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stock</span>
                  <p className={`text-sm font-bold mt-1 ${detailItem.stock === 0 ? 'text-red-600' : detailItem.stock <= detailItem.stock_minimo ? 'text-amber-600' : 'text-slate-800'}`}>
                    {detailItem.stock}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mínimo</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">{detailItem.stock_minimo}</p>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estado</span>
                  <div className="mt-1"><Badge variant={detailItem.estado} /></div>
                </div>
              </div>

              {detailItem.descripcion && (
                <div className="pt-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Descripción</span>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{detailItem.descripcion}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
          <Button onClick={() => setDetailItem(null)}>Cerrar</Button>
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

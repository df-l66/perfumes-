import React, { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Beaker, FileDown, Eye, Droplet, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import type { MateriaPrima, MateriaPrimaEstado } from '../types';

const EMPTY: any = {
  nombre: '', tipo: 'esencia', unidad_medida: 'ml', stock: '', stock_minimo: '', costo_unitario: '', estado: 'activo', imagen: ''
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const formatNumberWithDots = (val: number | string) => {
  if (val === undefined || val === null || val === 0) return '';
  const numStr = String(val).replace(/\D/g, '');
  if (!numStr) return '';
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(+numStr);
};

const AutoSlider = ({ images, alt }: { images: string[], alt: string }) => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="w-full h-full relative">
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </div>
  );
};

export function MateriasPrimas() {
  const { materiasPrimas, addMateriaPrima, updateMateriaPrima, deleteMateriaPrima, registrarMovimientoMateriaPrima, movimientosMateriasPrimas } = useAppData();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [ajusteModalOpen, setAjusteModalOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [editItem, setEditItem] = useState<MateriaPrima | null>(null);
  const [viewItem, setViewItem] = useState<MateriaPrima | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ajusteError, setAjusteError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  
  const [ajusteForm, setAjusteForm] = useState({
    materia_prima_id: '',
    tipo: 'entrada' as 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida',
    cantidad: '',
    referencia: '',
    notas: ''
  });

  const filtered = useMemo(() => {
    return materiasPrimas.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.tipo.toLowerCase().includes(search.toLowerCase()));
  }, [materiasPrimas, search]);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (p: MateriaPrima) => {
    setEditItem(p);
    const images = p.imagen ? p.imagen.split(',') : [''];
    setForm({ ...p, imagen: images[0] || '', imagen2: images[1] || '' });
    setError(null);
    setModalOpen(true);
  };

  const handlePriceChange = (field: keyof MateriaPrima, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const num = cleaned === '' ? '' : Number(cleaned);
    setForm((f: any) => ({ ...f, [field]: num }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.nombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    if (form.costo_unitario <= 0) {
      setError('El costo de referencia debe ser mayor a 0.');
      return;
    }

    const isDuplicate = materiasPrimas.some(m => m.nombre.toLowerCase() === form.nombre.toLowerCase() && m.id !== editItem?.id);
    if (isDuplicate) {
      setError('Ya existe una materia prima con ese nombre.');
      return;
    }

    const finalForm = { ...form };
    if (form.tipo === 'esencia') {
      finalForm.imagen = [form.imagen, form.imagen2].filter(Boolean).join(',');
    } else {
      finalForm.imagen = form.imagen || '';
    }
    delete finalForm.imagen2;

    if (editItem) {
      updateMateriaPrima(editItem.id, finalForm, user?.name || '', user?.role || '');
    } else {
      addMateriaPrima(finalForm, user?.name || '', user?.role || '');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta materia prima?')) {
      deleteMateriaPrima(id, user?.name || '', user?.role || '');
    }
  };

  const handleAjusteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAjusteError(null);

    const cantidadNum = Number(ajusteForm.cantidad);
    if (cantidadNum <= 0) {
      setAjusteError('La cantidad debe ser mayor a 0.');
      return;
    }

    if (ajusteForm.tipo === 'salida' || ajusteForm.tipo === 'ajuste_salida') {
      const mp = materiasPrimas.find(m => m.id === ajusteForm.materia_prima_id);
      if (mp && cantidadNum > mp.stock) {
        setAjusteError(`Stock insuficiente. El stock actual es de ${mp.stock} ${mp.unidad_medida}.`);
        return;
      }
    }

    registrarMovimientoMateriaPrima(
      ajusteForm.materia_prima_id,
      ajusteForm.tipo,
      cantidadNum,
      ajusteForm.referencia,
      ajusteForm.notas,
      user?.id || '',
      user?.name || '',
      user?.role || ''
    );
    setAjusteModalOpen(false);
    setAjusteForm({ materia_prima_id: '', tipo: 'entrada', cantidad: '', referencia: '', notas: '' });
  };

  const openAjuste = (id?: string) => {
    setAjusteForm(prev => ({ ...prev, materia_prima_id: id || '' }));
    setAjusteError(null);
    setAjusteModalOpen(true);
  };

  const inp = 'w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  return (
    <Layout title="Materias Primas">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar materia prima..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => openAjuste()} variant="secondary" className="flex-1 sm:flex-none">
            <Package className="w-4 h-4 mr-2" />
            Ajuste de Stock
          </Button>
          <Button onClick={openCreate} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Materia Prima
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-zinc-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No se encontraron materias primas.
            </div>
          ) : filtered.map(p => (
            <div key={p.id} className="p-4 space-y-3 hover:bg-zinc-50/60 transition-colors">
              <div className="flex gap-3 items-start justify-between">
                <div className="flex gap-3 items-center">
                  {p.tipo === 'esencia' ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                      {p.imagen ? <AutoSlider images={p.imagen.split(',')} alt={p.nombre} /> : <Droplet className="w-5 h-5 text-purple-300" />}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                      {p.tipo === 'alcohol' ? <Beaker className="w-5 h-5 text-blue-300" /> : <Package className="w-5 h-5 text-zinc-300" />}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-zinc-800 text-sm leading-tight">{p.nombre}</p>
                    <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${p.tipo === 'esencia' ? 'bg-purple-100 text-purple-700' : p.tipo === 'alcohol' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {p.tipo}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-zinc-50 rounded-lg p-2.5 border border-zinc-100">
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase font-bold">Stock Actual</span>
                  <span className={`font-bold text-sm ${p.stock <= p.stock_minimo ? 'text-red-600' : 'text-zinc-800'}`}>
                    {p.stock} <span className="text-xs font-normal text-zinc-500">{p.unidad_medida}</span>
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase font-bold">Costo Unit.</span>
                  <span className="font-bold text-zinc-800 text-sm">{formatCurrency(p.costo_unitario)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => { setViewItem(p); setActiveSlide(0); }} className="flex-1 py-2 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors">
                  <Eye size={14} className="mr-1.5" /> Detalles
                </button>
                <button onClick={() => openAjuste(p.id)} className="flex-1 py-2 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors">
                  <Package size={14} className="mr-1.5" /> Ajustar
                </button>
                <button onClick={() => openEdit(p)} className="flex-1 py-2 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors">
                  <Pencil size={14} className="mr-1.5" /> Editar
                </button>
                <button onClick={() => handleDelete(p.id)} className="px-3.5 py-2 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Nombre</th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Stock</th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Unidad</th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Costo Ref.</th>
                <th className="px-3 sm:px-4 py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.tipo === 'esencia' ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                          {p.imagen ? (
                            <AutoSlider images={p.imagen.split(',')} alt={p.nombre} />
                          ) : (
                            <Droplet className="w-5 h-5 text-purple-300" />
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                          {p.tipo === 'alcohol' ? <Beaker className="w-5 h-5 text-blue-300" /> : <Package className="w-5 h-5 text-zinc-300" />}
                        </div>
                      )}
                      <span className="font-medium text-zinc-800">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 capitalize hidden md:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${p.tipo === 'esencia' ? 'bg-purple-100 text-purple-700 border border-purple-200' : p.tipo === 'alcohol' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}`}>
                      {p.tipo}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className={`font-bold text-xs sm:text-sm ${p.stock <= p.stock_minimo ? 'text-red-600' : 'text-zinc-800'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-zinc-500 hidden sm:table-cell text-xs">{p.unidad_medida}</td>
                  <td className="px-3 sm:px-4 py-3 font-semibold text-zinc-800 hidden sm:table-cell text-xs sm:text-sm">{formatCurrency(p.costo_unitario)}</td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setViewItem(p); setActiveSlide(0); }} className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors cursor-pointer" title="Ver detalles">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openAjuste(p.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer" title="Ajustar Stock">
                        <Package size={16} />
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-amber-600 transition-colors cursor-pointer" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No se encontraron materias primas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Materia Prima' : 'Nueva Materia Prima'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input required type="text" className={inp} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select className={inp} value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                <option value="esencia">Esencia</option>
                <option value="alcohol">Alcohol</option>
                <option value="fijador">Fijador</option>
                <option value="envase">Envase</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
              <select className={inp} value={form.unidad_medida} onChange={e => setForm({...form, unidad_medida: e.target.value})}>
                <option value="ml">Mililitros (ml)</option>
                <option value="g">Gramos (g)</option>
                <option value="ud">Unidades (ud)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
              <input required type="number" step="any" min="0" className={inp} value={form.stock} onChange={e => setForm({...form, stock: e.target.value === '' ? '' : Number(e.target.value)})} disabled={!!editItem} />
              {editItem && <span className="text-xs text-gray-500">Usa "Ajuste de Stock" para cambiar el stock</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input required type="number" step="any" min="0" className={inp} value={form.stock_minimo} onChange={e => setForm({...form, stock_minimo: e.target.value === '' ? '' : Number(e.target.value)})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo Referencia</label>
            <input required type="text" className={inp} value={formatNumberWithDots(form.costo_unitario)} onChange={e => handlePriceChange('costo_unitario', e.target.value)} />
          </div>
          {form.tipo === 'esencia' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen 1 (Opcional)</label>
                <input type="url" placeholder="https://ejemplo.com/imagen.jpg" className={inp} value={form.imagen || ''} onChange={e => setForm({...form, imagen: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen 2 (Opcional)</label>
                <input type="url" placeholder="https://ejemplo.com/imagen2.jpg" className={inp} value={form.imagen2 || ''} onChange={e => setForm({...form, imagen2: e.target.value})} />
              </div>
              <div className="flex gap-4">
                {form.imagen && (
                  <div className="w-16 h-16 rounded-md overflow-hidden border border-gray-200">
                    <img src={form.imagen} alt="Preview 1" className="w-full h-full object-cover" />
                  </div>
                )}
                {form.imagen2 && (
                  <div className="w-16 h-16 rounded-md overflow-hidden border border-gray-200">
                    <img src={form.imagen2} alt="Preview 2" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={ajusteModalOpen} onClose={() => setAjusteModalOpen(false)} title="Ajuste de Stock de Materia Prima">
        <form onSubmit={handleAjusteSubmit} className="space-y-4">
          {ajusteError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
              {ajusteError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materia Prima</label>
            <select required className="w-full p-2 border rounded-lg" value={ajusteForm.materia_prima_id} onChange={e => setAjusteForm({...ajusteForm, materia_prima_id: e.target.value})}>
              <option value="">Seleccione...</option>
              {materiasPrimas.map(m => (
                <option key={m.id} value={m.id}>{m.nombre} (Stock: {m.stock} {m.unidad_medida})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento</label>
              <select required className="w-full p-2 border rounded-lg" value={ajusteForm.tipo} onChange={e => setAjusteForm({...ajusteForm, tipo: e.target.value as any})}>
                <option value="entrada">Entrada Manual</option>
                <option value="salida">Salida (Gasto/Merma)</option>
                <option value="ajuste_entrada">Ajuste Positivo (+)</option>
                <option value="ajuste_salida">Ajuste Negativo (-)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input required type="number" min="0.1" step="0.1" className="w-full p-2 border rounded-lg" value={ajusteForm.cantidad} onChange={e => setAjusteForm({...ajusteForm, cantidad: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia / Factura</label>
            <input type="text" className="w-full p-2 border rounded-lg" placeholder="Nro Factura o Doc" value={ajusteForm.referencia} onChange={e => setAjusteForm({...ajusteForm, referencia: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea className="w-full p-2 border rounded-lg" rows={2} value={ajusteForm.notas} onChange={e => setAjusteForm({...ajusteForm, notas: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setAjusteModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Movimiento</Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Detalles e Historial de Materia Prima" size="xl">
        {viewItem && (
          <div className="space-y-6">
            {viewItem.imagen && viewItem.tipo === 'esencia' && (
              <div className="flex justify-center relative group pb-4">
                <div className="w-40 h-40 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white p-2 relative">
                  <img src={viewItem.imagen.split(',')[activeSlide] || viewItem.imagen.split(',')[0]} alt={viewItem.nombre} className="w-full h-full object-contain" />
                  {viewItem.imagen.includes(',') && (
                    <>
                      <button onClick={() => setActiveSlide(s => s === 0 ? 1 : 0)} className="absolute left-1 top-1/2 -translate-y-1/2 p-1 bg-white/80 hover:bg-white rounded-full shadow-sm text-zinc-700 transition-all opacity-0 group-hover:opacity-100">
                        <ChevronLeft size={16} />
                      </button>
                      <button onClick={() => setActiveSlide(s => s === 0 ? 1 : 0)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-white/80 hover:bg-white rounded-full shadow-sm text-zinc-700 transition-all opacity-0 group-hover:opacity-100">
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>
                {viewItem.imagen.includes(',') && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {[0, 1].map(i => (
                      <button key={i} onClick={() => setActiveSlide(i)} className={`w-2 h-2 rounded-full transition-all ${activeSlide === i ? 'bg-amber-500 scale-125' : 'bg-gray-300'}`} />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="col-span-2 sm:col-span-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Nombre</p>
                <p className="font-extrabold text-gray-900 text-lg">{viewItem.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tipo</p>
                <p className="font-semibold text-gray-900 capitalize">{viewItem.tipo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Stock Actual</p>
                <div className="flex items-center gap-1">
                  <p className={`font-bold ${viewItem.stock <= viewItem.stock_minimo ? 'text-red-600' : 'text-green-600'}`}>
                    {viewItem.stock}
                  </p>
                  <span className="text-xs font-semibold text-gray-500">{viewItem.unidad_medida}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Stock Mínimo</p>
                <p className="font-semibold text-gray-900">{viewItem.stock_minimo} {viewItem.unidad_medida}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Estado</p>
                <span className={`inline-flex mt-0.5 items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                  viewItem.estado === 'activo' ? 'bg-green-100 text-green-800' :
                  viewItem.estado === 'stock_bajo' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {viewItem.estado === 'stock_bajo' ? 'Stock Bajo' : viewItem.estado === 'inactivo' ? 'Inactivo' : 'Activo'}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Package size={16} className="text-amber-500" /> Historial de Movimientos
              </h4>
              <div className="rounded-lg border border-gray-200 overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-xs min-w-125">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold text-gray-600">Fecha</th>
                      <th className="px-3 py-2.5 text-left font-bold text-gray-600">Tipo</th>
                      <th className="px-3 py-2.5 text-left font-bold text-gray-600">Referencia</th>
                      <th className="px-3 py-2.5 text-center font-bold text-gray-600">Cant.</th>
                      <th className="px-3 py-2.5 text-right font-bold text-gray-600">Stock Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {movimientosMateriasPrimas.filter(m => m.materia_prima_id === viewItem.id).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-gray-500 italic">No hay movimientos registrados para este insumo.</td>
                      </tr>
                    ) : (
                      movimientosMateriasPrimas
                        .filter(m => m.materia_prima_id === viewItem.id)
                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                        .map(m => (
                          <tr key={m.id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{new Date(m.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                m.tipo.includes('entrada') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {m.tipo.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-800 font-semibold truncate max-w-35" title={m.referencia}>{m.referencia || '-'}</td>
                            <td className={`px-3 py-2 text-center font-mono font-bold ${m.tipo.includes('entrada') ? 'text-green-600' : 'text-red-600'}`}>
                              {m.tipo.includes('entrada') ? '+' : '-'}{m.cantidad}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-gray-600">{m.stock_nuevo}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-4 border-t border-zinc-100 mt-6">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="secondary" size="sm" onClick={() => { setViewItem(null); openAjuste(viewItem.id); }} className="w-full sm:w-auto justify-center">Ajuste</Button>
                <Button variant="secondary" size="sm" onClick={() => { setViewItem(null); openEdit(viewItem); }} className="w-full sm:w-auto justify-center">Editar</Button>
                <Button variant="secondary" size="sm" onClick={() => { setViewItem(null); handleDelete(viewItem.id); }} className="w-full sm:w-auto justify-center text-red-600 hover:text-red-700 border-red-200 bg-red-50">Eliminar</Button>
              </div>
              <Button onClick={() => setViewItem(null)} className="w-full sm:w-auto justify-center">Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

    </Layout>
  );
}

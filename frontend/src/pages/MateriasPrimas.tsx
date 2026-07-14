import React, { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Beaker, FileDown, Eye, Droplet, Package } from 'lucide-react';
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
    setForm({ ...p });
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

    if (editItem) {
      updateMateriaPrima(editItem.id, form, user?.name || '', user?.role || '');
    } else {
      addMateriaPrima(form, user?.name || '', user?.role || '');
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

  const inp = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-white transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-medium text-gray-600">Nombre</th>
                <th className="p-4 font-medium text-gray-600 hidden md:table-cell">Tipo</th>
                <th className="p-4 font-medium text-gray-600">Stock</th>
                <th className="p-4 font-medium text-gray-600 hidden sm:table-cell">Unidad</th>
                <th className="p-4 font-medium text-gray-600 hidden sm:table-cell">Costo Ref.</th>
                <th className="p-4 font-medium text-gray-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {p.tipo === 'esencia' ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                          {p.imagen ? (
                            <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <Droplet className="w-5 h-5 text-purple-300" />
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          {p.tipo === 'alcohol' ? <Beaker className="w-5 h-5 text-blue-300" /> : <Package className="w-5 h-5 text-slate-300" />}
                        </div>
                      )}
                      <span className="font-medium text-slate-800">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="p-4 capitalize hidden md:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.tipo === 'esencia' ? 'bg-purple-100 text-purple-700' : p.tipo === 'alcohol' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {p.tipo}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`font-semibold ${p.stock <= p.stock_minimo ? 'text-red-600' : 'text-green-600'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 hidden sm:table-cell">{p.unidad_medida}</td>
                  <td className="p-4 hidden sm:table-cell">{formatCurrency(p.costo_unitario)}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setViewItem(p)} title="Ver detalles">
                        <Eye className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openAjuste(p.id)} title="Ajustar Stock">
                        <Package className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)} title="Editar">
                        <Pencil className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} title="Eliminar">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen (Opcional)</label>
              <input type="url" placeholder="https://ejemplo.com/imagen.jpg" className={inp} value={form.imagen || ''} onChange={e => setForm({...form, imagen: e.target.value})} />
              {form.imagen && (
                <div className="mt-2 w-16 h-16 rounded-md overflow-hidden border border-gray-200">
                  <img src={form.imagen} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
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
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Detalles de Materia Prima">
        {viewItem && (
          <div className="space-y-6">
            {viewItem.imagen && viewItem.tipo === 'esencia' && (
              <div className="flex justify-center">
                <div className="w-40 h-40 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white p-2">
                  <img src={viewItem.imagen} alt={viewItem.nombre} className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium">Nombre</p>
                <p className="font-semibold text-gray-900">{viewItem.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Tipo</p>
                <p className="font-semibold text-gray-900 capitalize">{viewItem.tipo}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 font-medium">Stock Actual</p>
                <div className="flex items-center gap-2">
                  <p className={`font-semibold ${viewItem.stock <= viewItem.stock_minimo ? 'text-red-600' : 'text-green-600'}`}>
                    {viewItem.stock}
                  </p>
                  <span className="text-sm text-gray-500">{viewItem.unidad_medida}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Stock Mínimo</p>
                <p className="font-semibold text-gray-900">{viewItem.stock_minimo} {viewItem.unidad_medida}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium">Costo Referencia</p>
                <p className="font-semibold text-gray-900">{formatCurrency(viewItem.costo_unitario)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Estado</p>
                <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium ${
                  viewItem.estado === 'activo' ? 'bg-green-100 text-green-800' :
                  viewItem.estado === 'stock_bajo' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {viewItem.estado === 'stock_bajo' ? 'Stock Bajo' : viewItem.estado === 'inactivo' ? 'Inactivo' : 'Activo'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button onClick={() => setViewItem(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

    </Layout>
  );
}

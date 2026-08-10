import React, { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Beaker, FileDown, FileUp, Eye, Droplet, Package, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, ArrowUpDown, SlidersHorizontal, Layers, Filter } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { exportToExcel } from '../utils/excelUtils';
import { ExcelImportModal, type ColumnDefinition } from '../components/ui/ExcelImportModal';
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

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [ajusteForm, setAjusteForm] = useState({
    materia_prima_id: '',
    tipo: 'entrada' as 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida',
    cantidad: '',
    referencia: '',
    notas: ''
  });

  // Filtro inteligente de stock y ordenamiento
  const [stockFilterStatus, setStockFilterStatus] = useState<'todos' | 'agotado' | 'stock_bajo' | 'optimo'>('todos');
  const [stockSortBy, setStockSortBy] = useState<'prioridad_reorden' | 'stock_asc' | 'stock_desc' | 'nombre'>('prioridad_reorden');
  const [minStockInput, setMinStockInput] = useState<string>('');
  const [maxStockInput, setMaxStockInput] = useState<string>('');
  const [showCustomStockRange, setShowCustomStockRange] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Estadísticas KPI de Stock
  const kpiTotal = materiasPrimas.length;
  const kpiAgotados = materiasPrimas.filter(m => m.stock <= 0).length;
  const kpiStockBajo = materiasPrimas.filter(m => m.stock > 0 && m.stock <= m.stock_minimo).length;
  const kpiOptimo = materiasPrimas.filter(m => m.stock > m.stock_minimo).length;

  const filtered = useMemo(() => {
    return materiasPrimas
      .filter(p => {
        // Búsqueda por texto
        const matchesSearch = (p.nombre || '').toLowerCase().includes(search.toLowerCase()) || 
                              (p.tipo || '').toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        // Filtro rápido por estado de stock
        if (stockFilterStatus === 'agotado' && p.stock > 0) return false;
        if (stockFilterStatus === 'stock_bajo' && (p.stock <= 0 || p.stock > p.stock_minimo)) return false;
        if (stockFilterStatus === 'optimo' && p.stock <= p.stock_minimo) return false;

        // Filtro por rango numérico de stock
        if (minStockInput !== '') {
          const min = Number(minStockInput);
          if (!isNaN(min) && p.stock < min) return false;
        }
        if (maxStockInput !== '') {
          const max = Number(maxStockInput);
          if (!isNaN(max) && p.stock > max) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (stockSortBy === 'prioridad_reorden') {
          // Prioridad: Menor porcentaje de stock disponible respecto al stock mínimo primero
          const ratioA = a.stock_minimo > 0 ? a.stock / a.stock_minimo : a.stock;
          const ratioB = b.stock_minimo > 0 ? b.stock / b.stock_minimo : b.stock;
          return ratioA - ratioB;
        } else if (stockSortBy === 'stock_asc') {
          return a.stock - b.stock;
        } else if (stockSortBy === 'stock_desc') {
          return b.stock - a.stock;
        } else if (stockSortBy === 'nombre') {
          return (a.nombre || '').localeCompare(b.nombre || '');
        }
        return 0;
      });
  }, [materiasPrimas, search, stockFilterStatus, minStockInput, maxStockInput, stockSortBy]);

  const totalPages = useMemo(() => Math.ceil(filtered.length / itemsPerPage) || 1, [filtered, itemsPerPage]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filtered.length, totalPages, currentPage]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage, stockFilterStatus, minStockInput, maxStockInput, stockSortBy]);

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

  // Configuración de columnas para Excel
  const materiaPrimaExcelColumns: ColumnDefinition[] = [
    { label: 'Nombre', key: 'nombre', example: 'Esencia Chanel N°5', required: true },
    { label: 'Tipo', key: 'tipo', example: 'esencia', required: true },
    { label: 'Unidad Medida', key: 'unidad_medida', example: 'ml', required: true },
    { label: 'Stock Actual', key: 'stock', example: 500 },
    { label: 'Stock Mínimo', key: 'stock_minimo', example: 100 },
    { label: 'Costo Unitario', key: 'costo_unitario', example: 120, required: true },
    { label: 'Estado', key: 'estado', example: 'activo' }
  ];

  const mapMateriaPrimaRawRow = (raw: Record<string, any>) => {
    const errors: string[] = [];
    const nombre = String(raw['Nombre'] || raw['nombre'] || '').trim();
    const tipoRaw = String(raw['Tipo'] || raw['tipo'] || 'esencia').trim().toLowerCase();
    const unidad_medida = String(raw['Unidad Medida'] || raw['unidad_medida'] || raw['Unidad'] || 'ml').trim();
    const stock = Number(raw['Stock Actual'] || raw['stock'] || raw['Stock'] || 0);
    const stock_minimo = Number(raw['Stock Mínimo'] || raw['stock_minimo'] || raw['Stock Minimo'] || 10);
    const costo_unitario = Number(raw['Costo Unitario'] || raw['costo_unitario'] || raw['Costo Ref.'] || 0);
    const estadoRaw = String(raw['Estado'] || raw['estado'] || 'activo').toLowerCase();
    const estado = estadoRaw === 'inactivo' ? 'inactivo' : 'activo';

    if (!nombre) errors.push('El nombre es obligatorio');
    if (isNaN(costo_unitario) || costo_unitario <= 0) errors.push('El costo unitario debe ser un número mayor a 0');
    if (isNaN(stock) || stock < 0) errors.push('El stock no puede ser negativo');

    return {
      data: {
        nombre,
        tipo: tipoRaw || 'esencia',
        unidad_medida,
        stock: isNaN(stock) ? 0 : stock,
        stock_minimo: isNaN(stock_minimo) ? 10 : stock_minimo,
        costo_unitario: isNaN(costo_unitario) ? 0 : costo_unitario,
        estado,
        imagen: ''
      },
      errors
    };
  };

  const handleImportMateriasPrimas = async (validItems: any[]) => {
    let count = 0;
    for (const item of validItems) {
      await addMateriaPrima(item, user?.name || 'Usuario', user?.role || 'admin');
      count++;
    }
    setSuccessToast(`Se importaron ${count} materias primas con éxito.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleExportExcel = () => {
    const headers: Record<string, string> = {
      nombre: 'Nombre',
      tipo: 'Tipo',
      unidad_medida: 'Unidad Medida',
      stock: 'Stock Actual',
      stock_minimo: 'Stock Mínimo',
      costo_unitario: 'Costo Unitario',
      estado: 'Estado'
    };
    exportToExcel(filtered, 'Materias_Primas', headers, 'Materias Primas');
  };

  return (
    <Layout title="Materias Primas" subtitle="Gestión de insumos y control inteligente de stock">
      {/* Tarjetas KPI de Filtrado Rápido de Stock */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setStockFilterStatus('todos')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            stockFilterStatus === 'todos'
              ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-2 ring-zinc-900/20'
              : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 shadow-sm hover:bg-zinc-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Total Insumos</span>
            <Layers size={16} className={stockFilterStatus === 'todos' ? 'text-amber-400' : 'text-zinc-400'} />
          </div>
          <p className="text-xl font-black mt-1 font-mono">{kpiTotal}</p>
        </button>

        <button
          type="button"
          onClick={() => setStockFilterStatus('agotado')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            stockFilterStatus === 'agotado'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-600/20'
              : 'bg-rose-50/40 text-rose-800 border-rose-200/80 hover:border-rose-300 shadow-sm hover:bg-rose-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Sin Stock (Agotados)</span>
            <AlertTriangle size={16} className={stockFilterStatus === 'agotado' ? 'text-white' : 'text-rose-500'} />
          </div>
          <p className="text-xl font-black mt-1 font-mono">{kpiAgotados}</p>
        </button>

        <button
          type="button"
          onClick={() => setStockFilterStatus('stock_bajo')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            stockFilterStatus === 'stock_bajo'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-600/20'
              : 'bg-amber-50/40 text-amber-900 border-amber-200/80 hover:border-amber-300 shadow-sm hover:bg-amber-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Stock Bajo (Reorden)</span>
            <Package size={16} className={stockFilterStatus === 'stock_bajo' ? 'text-white' : 'text-amber-600'} />
          </div>
          <p className="text-xl font-black mt-1 font-mono">{kpiStockBajo}</p>
        </button>

        <button
          type="button"
          onClick={() => setStockFilterStatus('optimo')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            stockFilterStatus === 'optimo'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/20'
              : 'bg-emerald-50/40 text-emerald-900 border-emerald-200/80 hover:border-emerald-300 shadow-sm hover:bg-emerald-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Stock Óptimo</span>
            <CheckCircle2 size={16} className={stockFilterStatus === 'optimo' ? 'text-white' : 'text-emerald-600'} />
          </div>
          <p className="text-xl font-black mt-1 font-mono">{kpiOptimo}</p>
        </button>
      </div>

      {/* Top Controls: Search, Buttons & Stock Filters */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar insumo por nombre o tipo..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 outline-none transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
            <Button onClick={() => setImportModalOpen(true)} variant="secondary" size="sm" icon={<FileUp size={14} />} className="w-full justify-center">
              Importar Excel
            </Button>
            <Button onClick={handleExportExcel} variant="secondary" size="sm" icon={<FileDown size={14} />} className="w-full justify-center">
              Exportar Excel
            </Button>
            <Button onClick={() => openAjuste()} variant="secondary" size="sm" icon={<Package size={14} />} className="w-full justify-center">
              Ajuste
            </Button>
            <Button onClick={openCreate} size="sm" icon={<Plus size={14} />} className="w-full justify-center">
              Nuevo Insumo
            </Button>
          </div>
        </div>

        {/* Toolbar de Filtrado Inteligente y Ordenamiento */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide mr-1 flex items-center gap-1">
              <Filter size={13} /> Filtrar Stock:
            </span>
            {(['todos', 'agotado', 'stock_bajo', 'optimo'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStockFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stockFilterStatus === status
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {status === 'todos' ? 'Todos' : status === 'agotado' ? 'Sin Stock' : status === 'stock_bajo' ? 'Stock Bajo' : 'Óptimo'}
              </button>
            ))}

            <button
              onClick={() => setShowCustomStockRange(!showCustomStockRange)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                showCustomStockRange || minStockInput || maxStockInput
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              <SlidersHorizontal size={13} /> Rango Numérico
            </button>
          </div>

          {/* Selector de Ordenamiento Inteligente */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
              <ArrowUpDown size={13} /> Orden:
            </span>
            <select
              value={stockSortBy}
              onChange={(e) => setStockSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer shadow-sm"
            >
              <option value="prioridad_reorden">⚠️ Prioridad de Reabastecimiento</option>
              <option value="stock_asc">📈 Stock: Menor a Mayor</option>
              <option value="stock_desc">📉 Stock: Mayor a Menor</option>
              <option value="nombre">🔤 Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Panel Desplegable de Rango Personalizado de Stock */}
        {showCustomStockRange && (
          <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 flex flex-wrap items-center gap-3 animate-fade-in">
            <span className="text-xs font-bold text-amber-900">Rango de Stock:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Mínimo"
                value={minStockInput}
                onChange={(e) => setMinStockInput(e.target.value)}
                className="w-24 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <span className="text-amber-700 text-xs">hasta</span>
              <input
                type="number"
                placeholder="Máximo"
                value={maxStockInput}
                onChange={(e) => setMaxStockInput(e.target.value)}
                className="w-24 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            {(minStockInput || maxStockInput) && (
              <button
                onClick={() => { setMinStockInput(''); setMaxStockInput(''); }}
                className="text-xs text-amber-800 underline font-semibold hover:text-amber-950 cursor-pointer"
              >
                Limpiar Rango
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-zinc-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No se encontraron materias primas.
            </div>
          ) : paginated.map(p => {
            const percent = p.stock_minimo > 0 ? Math.min(Math.round((p.stock / p.stock_minimo) * 100), 200) : 100;
            const isAgotado = p.stock <= 0;
            const isBajo = !isAgotado && p.stock <= p.stock_minimo;

            return (
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

                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-zinc-400 uppercase font-bold">Stock Actual</span>
                      <span className={`font-black text-sm font-mono ${isAgotado ? 'text-rose-600' : isBajo ? 'text-amber-600' : 'text-zinc-800'}`}>
                        {p.stock} <span className="text-xs font-normal text-zinc-500">{p.unidad_medida}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-zinc-400 uppercase font-bold">Costo Unit.</span>
                      <span className="font-bold text-zinc-800 text-sm">{formatCurrency(p.costo_unitario)}</span>
                    </div>
                  </div>

                  {/* Estado y Barra Visual de Stock en Móvil */}
                  <div className="space-y-1 pt-1 border-t border-zinc-200/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500 font-mono text-[10px]">Mín: {p.stock_minimo} {p.unidad_medida}</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                        isAgotado ? 'bg-rose-100 text-rose-700' : isBajo ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isAgotado ? 'Agotado (0%)' : isBajo ? `Reorden (${percent}%)` : `Óptimo (${percent}%)`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200/80 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(percent, 100)}%` }}
                        className={`h-full transition-all duration-500 rounded-full ${
                          isAgotado ? 'bg-rose-500' : isBajo ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button onClick={() => { setViewItem(p); setActiveSlide(0); }} className="py-2 px-3 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors">
                    <Eye size={14} className="mr-1.5" /> Detalles
                  </button>
                  <button onClick={() => openAjuste(p.id)} className="py-2 px-3 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors">
                    <Package size={14} className="mr-1.5" /> Ajustar
                  </button>
                  <button onClick={() => openEdit(p)} className="py-2 px-3 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors">
                    <Pencil size={14} className="mr-1.5" /> Editar
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="py-2 px-3 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors">
                    <Trash2 size={14} className="mr-1.5" /> Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Nombre</th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Estado / Cobertura de Stock</th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Unidad</th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Costo Ref.</th>
                <th className="px-3 sm:px-4 py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginated.map(p => {
                const percent = p.stock_minimo > 0 ? Math.min(Math.round((p.stock / p.stock_minimo) * 100), 200) : 100;
                const isAgotado = p.stock <= 0;
                const isBajo = !isAgotado && p.stock <= p.stock_minimo;

                return (
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
                        <div>
                          <span className="font-semibold text-zinc-800 text-sm block leading-tight">{p.nombre}</span>
                          <span className="text-[11px] text-zinc-400 font-mono">Mínimo recomendado: {p.stock_minimo} {p.unidad_medida}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 capitalize hidden md:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${p.tipo === 'esencia' ? 'bg-purple-100 text-purple-700 border border-purple-200' : p.tipo === 'alcohol' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}`}>
                        {p.tipo}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 min-w-44">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-black font-mono ${isAgotado ? 'text-rose-600' : isBajo ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {p.stock} {p.unidad_medida}
                          </span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                            isAgotado ? 'bg-rose-100 text-rose-700' : isBajo ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isAgotado ? 'Agotado (0%)' : isBajo ? `Reorden (${percent}%)` : `Óptimo (${percent}%)`}
                          </span>
                        </div>
                        {/* Barra de estado visual de stock */}
                        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/60">
                          <div
                            style={{ width: `${Math.min(percent, 100)}%` }}
                            className={`h-full transition-all duration-500 rounded-full ${
                              isAgotado ? 'bg-rose-500' : isBajo ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-zinc-500 hidden sm:table-cell text-xs font-mono">{p.unidad_medida}</td>
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
                );
              })}
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

        {/* Paginación Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 font-medium">
          <div className="flex items-center gap-3">
            {filtered.length > 0 ? (
              <span>
                Mostrando <strong className="text-zinc-700">{(currentPage - 1) * itemsPerPage + 1}</strong> al <strong className="text-zinc-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> de <strong className="text-zinc-700">{filtered.length}</strong> materias primas
              </span>
            ) : (
              <span>0 materias primas encontradas</span>
            )}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-zinc-400">Ver:</span>
              <select
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-1 border border-zinc-200 rounded-md bg-white text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
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
              <span className="font-semibold text-zinc-600">
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

      {/* Modal Importar Excel */}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Importar Materias Primas desde Excel"
        columns={materiaPrimaExcelColumns}
        templateFileName="Materias_Primas"
        fieldMapper={mapMateriaPrimaRawRow}
        onImport={handleImportMateriasPrimas}
      />

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

import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Pencil, Trash2, Calendar, FileText, CheckCircle2, 
  XCircle, Download, ShoppingBag, PlusCircle, ArrowRight, ArrowLeft, Package, Eye,
  RotateCcw
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AlertBox } from '../components/ui/AlertBox';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Compra, CompraItem, Producto, Proveedor, MateriaPrimaEstado } from '../types';

type WizardStep = 'proveedor' | 'productos' | 'confirmar';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

// ─── Modal para Nueva Compra (Wizard 3 pasos) ──────────────────────────────────
function NuevaCompraModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { productos, proveedores, addProducto, addMateriaPrima, addCompra, materiasPrimas } = useAppData();
  const { user } = useAuth();

  const [step, setStep] = useState<WizardStep>('proveedor');
  const [tipoItem, setTipoItem] = useState<'producto' | 'materia_prima'>('producto');
  const [proveedorId, setProveedorId] = useState('');
  const [carrito, setCarrito] = useState<CompraItem[]>([]);
  const [searchProd, setSearchProd] = useState('');
  const [searchProv, setSearchProv] = useState('');
  const [notas, setNotas] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para creación rápida/completa de productos desde la compra
  const [quickProductModalOpen, setQuickProductModalOpen] = useState(false);
  const [quickProdForm, setQuickProdForm] = useState<any>({
    codigo: '',
    nombre: '',
    unidad: 'Frasco',
    categoria: 'Fragancias Elegantes',
    proveedor_id: '',
    precio_costo: 0,
    precio_venta: 0,
    stock: 0,
    stock_minimo: 0,
    es_por_encargo: false,
    tipo_producto: 'perfume',
    calidad: 'Original',
    mililitros: 100,
    genero: 'Unisex',
    familia_olfativa: '',
    descripcion: '',
    estado: 'activo',
    imagen: ''
  });
  const [quickProdError, setQuickProdError] = useState<string | null>(null);

  // Estado para creación rápida/completa de materia prima desde la compra
  const [quickMpModalOpen, setQuickMpModalOpen] = useState(false);
  const [quickMpForm, setQuickMpForm] = useState({
    nombre: '',
    tipo: 'esencia',
    unidad_medida: 'ml',
    stock: 0,
    stock_minimo: 0,
    costo_unitario: 0,
    estado: 'activo' as MateriaPrimaEstado,
    imagen: ''
  });
  const [quickMpError, setQuickMpError] = useState<string | null>(null);

  const openQuickProductModal = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setQuickProdForm({
      codigo: `PROD-${randomNum}`,
      nombre: searchProd.trim(),
      unidad: 'Frasco',
      categoria: 'Fragancias Elegantes',
      proveedor_id: proveedorId !== 'sin-proveedor' ? proveedorId : '',
      precio_costo: 0,
      precio_venta: 0,
      stock: 0,
      stock_minimo: 0,
      es_por_encargo: false,
      tipo_producto: 'perfume',
      calidad: 'Original',
      mililitros: 100,
      genero: 'Unisex',
      familia_olfativa: '',
      descripcion: '',
      estado: 'activo',
      imagen: ''
    });
    setQuickProdError(null);
    setQuickProductModalOpen(true);
  };

  const handleQuickProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickProdError(null);

    if (!quickProdForm.nombre.trim()) {
      setQuickProdError('El nombre del producto es obligatorio.');
      return;
    }

    if (!quickProdForm.codigo.trim()) {
      setQuickProdError('El código del producto es obligatorio.');
      return;
    }

    const codExiste = productos.some(p => p.codigo.trim().toLowerCase() === quickProdForm.codigo.trim().toLowerCase());
    if (codExiste) {
      setQuickProdError(`El código "${quickProdForm.codigo}" ya pertenece a otro producto.`);
      return;
    }

    if (Number(quickProdForm.precio_venta) < Number(quickProdForm.precio_costo)) {
      setQuickProdError('El precio de venta no puede ser menor al precio de costo del producto.');
      return;
    }

    const computed = {
      codigo: quickProdForm.codigo.trim(),
      nombre: quickProdForm.nombre.trim(),
      unidad: quickProdForm.unidad.trim() || 'Frasco',
      categoria: quickProdForm.categoria || 'Fragancias Elegantes',
      proveedor_id: quickProdForm.proveedor_id || (proveedorId !== 'sin-proveedor' ? proveedorId : null),
      precio_costo: Number(quickProdForm.precio_costo) || 0,
      precio_venta: Number(quickProdForm.precio_venta) || 0,
      stock: Number(quickProdForm.stock) || 0,
      stock_minimo: Number(quickProdForm.stock_minimo) || 0,
      tipo_producto: quickProdForm.tipo_producto || 'perfume',
      calidad: quickProdForm.calidad || 'Original',
      mililitros: quickProdForm.mililitros ? Number(quickProdForm.mililitros) : null,
      genero: quickProdForm.genero || 'Unisex',
      familia_olfativa: quickProdForm.familia_olfativa?.trim() || '',
      descripcion: quickProdForm.descripcion?.trim() || '',
      imagen: quickProdForm.imagen?.trim() || '',
      estado: quickProdForm.estado || 'activo'
    } as Omit<Producto, 'id'>;

    const userName = user?.name || 'Usuario';
    const userRole = user?.role || 'admin';

    addProducto(computed, userName, userRole);

    // Agregar automáticamente al carrito de la compra actual
    addToCart({
      _id: `temp-${Date.now()}`,
      _nombre: computed.nombre,
      _codigo: computed.codigo,
      _precio_costo: computed.precio_costo,
      _precio_venta: computed.precio_venta,
      _stock: computed.stock
    }, 1, computed.precio_costo);

    setQuickProductModalOpen(false);
  };

  const openQuickMpModal = () => {
    setQuickMpForm({
      nombre: searchProd.trim(),
      tipo: 'esencia',
      unidad_medida: 'ml',
      stock: 0,
      stock_minimo: 0,
      costo_unitario: 0,
      estado: 'activo',
      imagen: ''
    });
    setQuickMpError(null);
    setQuickMpModalOpen(true);
  };

  const handleQuickMpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickMpError(null);

    if (!quickMpForm.nombre.trim()) {
      setQuickMpError('El nombre de la materia prima es obligatorio.');
      return;
    }

    const isDuplicate = materiasPrimas.some(m => m.nombre.trim().toLowerCase() === quickMpForm.nombre.trim().toLowerCase());
    if (isDuplicate) {
      setQuickMpError(`Ya existe una materia prima registrada con el nombre "${quickMpForm.nombre}".`);
      return;
    }

    const payload = {
      nombre: quickMpForm.nombre.trim(),
      tipo: quickMpForm.tipo,
      unidad_medida: quickMpForm.unidad_medida,
      stock: Number(quickMpForm.stock) || 0,
      stock_minimo: Number(quickMpForm.stock_minimo) || 0,
      costo_unitario: Number(quickMpForm.costo_unitario) || 0,
      estado: quickMpForm.estado || 'activo',
      imagen: quickMpForm.imagen?.trim() || ''
    };

    const userName = user?.name || 'Usuario';
    const userRole = user?.role || 'admin';

    const nuevaMp = await addMateriaPrima(payload, userName, userRole);

    if (nuevaMp) {
      // Agregar automáticamente al carrito de la compra actual
      addToCart({
        _id: nuevaMp.id,
        _nombre: nuevaMp.nombre,
        _precio_costo: nuevaMp.costo_unitario,
        _precio_venta: 0,
        _codigo: `MP-${nuevaMp.tipo.toUpperCase()}`,
        _stock: nuevaMp.stock
      }, 1, nuevaMp.costo_unitario, 'materia_prima');
    }

    setQuickMpModalOpen(false);
  };

  const reset = () => {
    setStep('proveedor');
    setProveedorId('');
    setCarrito([]);
    setSearchProd('');
    setSearchProv('');
    setNotas('');
    setSuccess(false);
    setError(null);
  };

  const handleClose = () => {
    onClose();
  };

  const formatNumberWithDots = (value: number | undefined) => {
    if (value === undefined || value === null) return '0';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Filtrado de proveedores en el paso 1
  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter(p => 
      p.estado === 'activo' && (
        p.nombre.toLowerCase().includes(searchProv.toLowerCase()) ||
        p.nit.toLowerCase().includes(searchProv.toLowerCase()) ||
        p.contacto.toLowerCase().includes(searchProv.toLowerCase())
      )
    );
  }, [proveedores, searchProv]);

  const itemsFiltrados = useMemo(() => {
    if (tipoItem === 'producto') {
      return productos.filter(p => 
        p.nombre.toLowerCase().includes(searchProd.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchProd.toLowerCase())
      ).map(p => ({ ...p, _id: p.id, _nombre: p.nombre, _precio_costo: p.precio_costo, _precio_venta: p.precio_venta, _codigo: p.codigo, _stock: p.stock }));
    } else {
      return materiasPrimas.filter(m => 
        m.estado !== 'inactivo' && m.nombre.toLowerCase().includes(searchProd.toLowerCase())
      ).map(m => ({ ...m, _id: m.id, _nombre: m.nombre, _precio_costo: m.costo_unitario || 0, _precio_venta: 0, _codigo: `MP-${m.tipo.toUpperCase()}`, _stock: m.stock }));
    }
  }, [productos, materiasPrimas, searchProd, tipoItem]);

  const getItemId = (item: CompraItem) => item.producto_id || item.materia_prima_id || '';

  // Manejo del carrito
  const addToCart = (item: any, cantidad: number, costo: number, explicitTipoItem?: 'producto' | 'materia_prima') => {
    if (cantidad <= 0) return;
    const targetTipoItem = explicitTipoItem || tipoItem;
    setCarrito(prev => {
      const idx = prev.findIndex(i => getItemId(i) === item._id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].cantidad += cantidad;
        updated[idx].subtotal = updated[idx].cantidad * updated[idx].precio_costo;
        return updated;
      }
      return [...prev, {
        producto_id: targetTipoItem === 'producto' ? item._id : undefined,
        materia_prima_id: targetTipoItem === 'materia_prima' ? item._id : undefined,
        tipo_item: targetTipoItem,
        nombre: item._nombre,
        cantidad,
        precio_costo: costo,
        precio_venta: item._precio_venta || 0,
        subtotal: cantidad * costo
      }];
    });
  };

  const updateCartQty = (id: string, qty: number) => {
    setCarrito(prev =>
      prev.map(item => {
        if (getItemId(item) !== id) return item;
        const newQty = Math.max(1, qty);
        if (item.tipo_item === 'materia_prima') {
           return { ...item, cantidad: newQty, precio_costo: newQty > 0 ? (item.subtotal / newQty) : 0 };
        }
        return { ...item, cantidad: newQty, subtotal: newQty * item.precio_costo };
      })
    );
  };

  const updateCartCost = (id: string, rawCost: string) => {
    const digits = rawCost.replace(/\D/g, '');
    const cost = digits ? parseInt(digits, 10) : 0;
    setCarrito(prev =>
      prev.map(item => {
        if (getItemId(item) !== id) return item;
        return { ...item, precio_costo: cost, subtotal: item.cantidad * cost };
      })
    );
  };

  const updateCartSubtotal = (id: string, rawSubtotal: string) => {
    const digits = rawSubtotal.replace(/\D/g, '');
    const subtotal = digits ? parseInt(digits, 10) : 0;
    setCarrito(prev =>
      prev.map(item => {
        if (getItemId(item) !== id) return item;
        const unitCost = item.cantidad > 0 ? (subtotal / item.cantidad) : 0;
        return { ...item, subtotal: subtotal, precio_costo: unitCost };
      })
    );
  };

  const updateCartSalePrice = (id: string, rawSalePrice: string) => {
    const digits = rawSalePrice.replace(/\D/g, '');
    const salePrice = digits ? parseInt(digits, 10) : 0;
    setCarrito(prev =>
      prev.map(item => {
        if (getItemId(item) !== id) return item;
        return { ...item, precio_venta: salePrice };
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCarrito(prev => prev.filter(item => getItemId(item) !== id));
  };

  const total = carrito.reduce((s, item) => s + item.subtotal, 0);

  const SIN_PROVEEDOR_ID = 'sin-proveedor';
  const proveedorSeleccionado = proveedorId === SIN_PROVEEDOR_ID
    ? { id: SIN_PROVEEDOR_ID, nombre: 'Sin Proveedor Registrado', nit: '—', contacto: '', telefono: '', email: '', ciudad: '', estado: 'activo' as const }
    : proveedores.find(p => p.id === proveedorId);

  const handleConfirm = () => {
    setError(null);
    if (!proveedorId) {
      setError("Por favor selecciona un proveedor válido.");
      return;
    }
    if (carrito.length === 0) {
      setError("El carrito está vacío. Agrega al menos un producto.");
      return;
    }

    const invalidPrice = carrito.find(item => item.precio_costo <= 0);
    if (invalidPrice) {
      setError(`El producto "${invalidPrice.nombre}" debe tener un costo unitario mayor a cero.`);
      return;
    }
    
    const invalidMargin = carrito.find(item => item.tipo_item !== 'materia_prima' && item.precio_costo > (item.precio_venta || 0));
    if (invalidMargin) {
      setError(`El precio de costo de "${invalidMargin.nombre}" no puede ser mayor que su precio de venta sugerido.`);
      return;
    }

    addCompra(
      carrito,
      proveedorId,
      user?.id || 'u1',
      user?.name || 'Admin',
      user?.role || 'admin',
      notas
    );
    setSuccess(true);
  };

  const inp = 'w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors bg-white';
  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="block text-xs font-semibold text-zinc-600 mb-1">{label}</label>
      {children}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Compra a Proveedor" size="xl"
      headerAction={
        <button
          onClick={reset}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Limpiar formulario"
        >
          <RotateCcw size={16} />
        </button>
      }
    >
      {success ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-800">¡Compra Registrada Exitosamente!</h3>
            <p className="text-xs text-zinc-400 mt-1">El stock se ha reabastecido y los costos fueron actualizados.</p>
          </div>
          <Button onClick={handleClose} className="mx-auto">Cerrar</Button>
        </div>
      ) : (
        <>
          {/* Wizard Header Progress */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4 select-none">
            {[
              { key: 'proveedor', label: '1. Proveedor' },
              { key: 'productos', label: '2. Carrito de Compra' },
              { key: 'confirmar', label: '3. Finalizar' }
            ].map(s => (
              <span 
                key={s.key} 
                className={`text-xs font-bold transition-colors ${
                  step === s.key ? 'text-amber-600' : 'text-zinc-400'
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>

          {/* Step 1: Proveedor */}
          {step === 'proveedor' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">Busca y selecciona el proveedor al que le realizarás el reabastecimiento:</p>
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={searchProv}
                    onChange={e => setSearchProv(e.target.value)}
                    placeholder="Buscar proveedor..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-200 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors bg-white"
                  />
                </div>
              </div>

              {/* Sin proveedor option */}
              <div
                onClick={() => setProveedorId(SIN_PROVEEDOR_ID)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:bg-zinc-50 flex flex-col text-left ${
                  proveedorId === SIN_PROVEEDOR_ID
                    ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/10'
                    : 'border-dashed border-zinc-300 hover:border-amber-400 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-zinc-800 truncate pr-2">Sin Proveedor Registrado</span>
                  {proveedorId === SIN_PROVEEDOR_ID && <CheckCircle2 size={16} className="text-amber-600 shrink-0" />}
                </div>
                <span className="text-[10px] text-zinc-400 mt-1">Compra sin proveedor registrado en el sistema</span>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-zinc-400 font-medium">o proveedores registrados</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {proveedoresFiltrados.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-zinc-400">No se encontraron proveedores activos con esa búsqueda.</div>
                ) : proveedoresFiltrados.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setProveedorId(p.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:bg-zinc-50 flex flex-col text-left ${
                      proveedorId === p.id 
                        ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/10' 
                        : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-zinc-800 truncate pr-2">{p.nombre}</span>
                      {proveedorId === p.id && <CheckCircle2 size={16} className="text-amber-600 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono mt-1">NIT: {p.nit}</span>
                    <span className="text-[11px] text-zinc-500 mt-2">Contacto: {p.contacto}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-zinc-100">
                <Button 
                  disabled={!proveedorId} 
                  onClick={() => setStep('productos')}
                >
                  Continuar
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Carrito */}
          {step === 'productos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Catalog Picker */}
                <div className="space-y-3">
                  <div className="flex bg-zinc-100 p-1 rounded-lg">
                    <button 
                      type="button" 
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${tipoItem === 'producto' ? 'bg-white shadow-sm text-zinc-800' : 'text-zinc-500 hover:text-zinc-700'}`}
                      onClick={() => setTipoItem('producto')}
                    >
                      Productos
                    </button>
                    <button 
                      type="button"
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${tipoItem === 'materia_prima' ? 'bg-white shadow-sm text-zinc-800' : 'text-zinc-500 hover:text-zinc-700'}`}
                      onClick={() => setTipoItem('materia_prima')}
                    >
                      Materias Primas
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                      <input
                        placeholder={`Buscar ${tipoItem === 'producto' ? 'producto' : 'materia prima'}...`}
                        value={searchProd}
                        onChange={e => setSearchProd(e.target.value)}
                        className={`${inp} pl-9`}
                      />
                    </div>
                    {tipoItem === 'producto' ? (
                      <button
                        type="button"
                        onClick={openQuickProductModal}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer"
                        title="Abrir formulario completo para registrar un nuevo producto"
                      >
                        <Plus size={14} /> + Producto
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={openQuickMpModal}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer"
                        title="Abrir formulario para registrar una nueva materia prima"
                      >
                        <Plus size={14} /> + Materia Prima
                      </button>
                    )}
                  </div>
                  
                  <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100 max-h-64 overflow-y-auto bg-white">
                    {itemsFiltrados.length === 0 ? (
                      <div className="py-8 text-center space-y-2">
                        <Package size={24} className="mx-auto text-zinc-300 mb-1" />
                        <p className="text-xs text-zinc-400">No se encontraron {tipoItem === 'producto' ? 'productos' : 'materias primas'}</p>
                        {tipoItem === 'producto' ? (
                          <button 
                            type="button" 
                            onClick={openQuickProductModal}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors pt-1"
                          >
                            <PlusCircle size={14} /> Crear "{searchProd || 'Nuevo Producto'}" en el catálogo
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            onClick={openQuickMpModal}
                            className="text-xs font-bold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors pt-1"
                          >
                            <PlusCircle size={14} /> Crear "{searchProd || 'Nueva Materia Prima'}" en el catálogo
                          </button>
                        )}
                      </div>
                    ) : itemsFiltrados.map(p => (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => addToCart(p, 1, p._precio_costo)}
                            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-amber-50 text-left transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-8 h-8 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200/60 shrink-0 flex items-center justify-center">
                                {(p as any).imagen ? (
                                  <img src={(p as any).imagen} alt={p._nombre} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={14} className="text-zinc-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-zinc-700 truncate">{p._nombre}</p>
                                <p className="text-xs text-zinc-400">{p._codigo} · stock: {p._stock}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-amber-600">{formatCurrency(p._precio_venta)}</p>
                              <p className="text-xs text-zinc-300 group-hover:text-amber-400 transition-colors">+ agregar</p>
                            </div>
                          </button>
                        ))}
                      </div>
                </div>

                {/* Cart Preview */}
                <div className="flex flex-col border border-zinc-200 rounded-xl bg-zinc-50/50 p-4">
                  <div className="flex justify-between pb-2 border-b border-zinc-200">
                    <span className="text-xs font-bold text-zinc-700">Artículos a comprar</span>
                    <span className="text-xs font-mono font-bold text-zinc-500">{carrito.length} Items</span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-50 space-y-2 mt-3 pr-1">
                    {carrito.length === 0 ? (
                      <div className="py-12 text-center text-zinc-400 text-xs">
                        El carrito está vacío
                      </div>
                    ) : carrito.map(item => (
                      <div key={getItemId(item)} className="p-3 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-3 text-left relative">
                        {item.tipo_item === 'materia_prima' && (
                          <span className="absolute top-0 right-0 mt-2 mr-8 text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Materia Prima</span>
                        )}
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-zinc-800 truncate pr-2 w-3/4">{item.nombre}</p>
                          <button 
                            onClick={() => removeFromCart(getItemId(item))} 
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-3">
                            <div className="w-24 shrink-0">
                              <span className="block text-[9px] uppercase font-bold text-zinc-400 mb-1">Cant.</span>
                              <input 
                                type="number" 
                                min={1} 
                                value={item.cantidad} 
                                onChange={e => updateCartQty(getItemId(item), +e.target.value)} 
                                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all text-center"
                              />
                            </div>
                            <div className="flex-1">
                              <span className="block text-[9px] uppercase font-bold text-zinc-400 mb-1">
                                {item.tipo_item === 'materia_prima' ? 'Costo Total' : 'Costo Unit.'}
                              </span>
                              <input 
                                value={formatNumberWithDots(item.tipo_item === 'materia_prima' ? item.subtotal : item.precio_costo)} 
                                onChange={e => {
                                  if (item.tipo_item === 'materia_prima') {
                                    updateCartSubtotal(getItemId(item), e.target.value);
                                  } else {
                                    updateCartCost(getItemId(item), e.target.value);
                                  }
                                }} 
                                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                              />
                            </div>
                          </div>
                          {item.tipo_item !== 'materia_prima' && (
                            <div>
                              <span className="block text-[9px] uppercase font-bold text-zinc-400 mb-1">Precio Venta Sugerido</span>
                              <input 
                                value={formatNumberWithDots(item.precio_venta || 0)} 
                                onChange={e => updateCartSalePrice(getItemId(item), e.target.value)} 
                                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-zinc-200 mt-3 flex justify-between font-bold text-zinc-800 text-sm">
                    <span>Total estimado</span>
                    <span className="font-mono text-amber-600">{formatCurrency(total)}</span>
                  </div>
                </div>

              </div>

              <div className="flex justify-between pt-2 border-t border-zinc-100">
                <Button variant="secondary" onClick={() => setStep('proveedor')}>
                  <ArrowLeft size={14} />
                  Atrás
                </Button>
                <Button disabled={carrito.length === 0} onClick={() => setStep('confirmar')}>
                  Continuar
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmar */}
          {step === 'confirmar' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-800 mb-3 text-left">Resumen de Confirmación</h3>
              
              {error && (
                <AlertBox type="critical" title="Error de Validación">
                  {error}
                </AlertBox>
              )}
              
              <AlertBox type="note" title="Registro de Ingreso">
                Al confirmar la transacción, se incrementará el stock del catálogo y se actualizarán los precios de costo de compra unitarios automáticamente.
              </AlertBox>

              <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-4 grid grid-cols-2 gap-4 text-left">
                <div className="text-xs">
                  <span className="block text-zinc-400 uppercase font-bold text-[8px]">Proveedor</span>
                  <span className="font-bold text-zinc-800 block mt-0.5">{proveedorSeleccionado?.nombre}</span>
                  {proveedorId !== SIN_PROVEEDOR_ID && <span className="text-[10px] text-zinc-400 font-mono">NIT: {proveedorSeleccionado?.nit}</span>}
                </div>
                <div className="text-xs">
                  <span className="block text-zinc-400 uppercase font-bold text-[8px]">Comprador Autorizado</span>
                  <span className="font-bold text-zinc-800 block mt-0.5">{user?.name} ({user?.role})</span>
                  <span className="text-[10px] text-zinc-400">Fecha: {new Date().toLocaleDateString('es-CO')}</span>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Producto</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-zinc-500">Cant.</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Costo Unit.</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Nuevo P. Venta</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {carrito.map(item => (
                      <tr key={item.producto_id}>
                        <td className="px-4 py-2.5 text-zinc-700 text-left truncate" title={item.nombre}>{item.nombre}</td>
                        <td className="px-4 py-2.5 text-center text-zinc-600">{item.cantidad}</td>
                        <td className="px-4 py-2.5 text-right text-zinc-600">{formatCurrency(item.precio_costo)}</td>
                        <td className="px-4 py-2.5 text-right text-amber-600 font-semibold">{item.precio_venta ? formatCurrency(item.precio_venta) : 'Sin cambios'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-zinc-800">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-amber-50 border-t border-amber-200">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-bold text-amber-700 uppercase">TOTAL COMPRA</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-700 text-base font-mono">{formatCurrency(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {field('Observaciones o Notas de Compra', (
                <textarea
                  rows={2}
                  className={inp}
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Ej: Factura de proveedor #99881..."
                />
              ))}

              <div className="flex justify-between pt-2 border-t border-zinc-100">
                <Button variant="secondary" onClick={() => setStep('productos')}>
                  <ArrowLeft size={14} />
                  Atrás
                </Button>
                <Button onClick={handleConfirm}>
                  <CheckCircle2 size={15} />
                  Confirmar Compra
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Dedicado para Crear Producto Completo desde Compras */}
      <Modal 
        isOpen={quickProductModalOpen} 
        onClose={() => setQuickProductModalOpen(false)} 
        title="Crear Nuevo Producto" 
        size="lg"
        zIndexClass="z-[70]"
      >
        <form onSubmit={handleQuickProductSubmit} className="space-y-4 text-left">
          {quickProdError && <AlertBox type="warning" title="Atención" className="mb-4">{quickProdError}</AlertBox>}

          {proveedorSeleccionado && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs text-amber-800">
              <div>
                <span className="font-bold">Proveedor Asignado para la Compra:</span> {proveedorSeleccionado.nombre}
              </div>
              <span className="text-[10px] bg-amber-200/60 px-2 py-0.5 rounded-md font-semibold text-amber-900">Se agregará al carrito</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Código', <input required minLength={3} value={quickProdForm.codigo} onChange={e => setQuickProdForm((f: any) => ({ ...f, codigo: e.target.value }))} className={inp} placeholder="PER-001" />)}
            {field('Unidad', <input required value={quickProdForm.unidad} onChange={e => setQuickProdForm((f: any) => ({ ...f, unidad: e.target.value }))} className={inp} placeholder="Frasco, Spray…" />)}
          </div>

          {field('Nombre del Producto', <input required minLength={3} value={quickProdForm.nombre} onChange={e => setQuickProdForm((f: any) => ({ ...f, nombre: e.target.value }))} className={inp} placeholder="Nombre completo" />)}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Categoría', (
              <select required value={quickProdForm.categoria} onChange={e => setQuickProdForm((f: any) => ({ ...f, categoria: e.target.value }))} className={inp}>
                <option value="">— Seleccionar —</option>
                {quickProdForm.tipo_producto !== 'otro' ? (
                  <>
                    <option value="Fragancias Árabes">Fragancias Árabes</option>
                    <option value="Fragancias Casuales">Fragancias Casuales</option>
                    <option value="Fragancias Elegantes">Fragancias Elegantes</option>
                    <option value="Fragancias Premium">Fragancias Premium</option>
                    <option value="Decants / Muestras">Decants / Muestras</option>
                  </>
                ) : (
                  <>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Cuidado Personal">Cuidado Personal</option>
                    <option value="Cosméticos">Cosméticos</option>
                    <option value="Ropa">Ropa</option>
                    <option value="Otros">Otros</option>
                  </>
                )}
              </select>
            ))}
            {field('Proveedor (Asociado)', (
              <select value={quickProdForm.proveedor_id || ''} onChange={e => setQuickProdForm((f: any) => ({ ...f, proveedor_id: e.target.value }))} className={inp}>
                <option value="">— Sin Proveedor —</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Precio Costo (COP)', (
              <input 
                type="text" 
                required 
                value={formatNumberWithDots(quickProdForm.precio_costo)} 
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setQuickProdForm((f: any) => ({ ...f, precio_costo: digits ? parseInt(digits, 10) : 0 }));
                }} 
                className={inp} 
                placeholder="0" 
              />
            ))}
            {field('Precio Venta (COP)', (
              <input 
                type="text" 
                required 
                value={formatNumberWithDots(quickProdForm.precio_venta)} 
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setQuickProdForm((f: any) => ({ ...f, precio_venta: digits ? parseInt(digits, 10) : 0 }));
                }} 
                className={inp} 
                placeholder="0" 
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Stock Actual', <input type="number" step="any" min={0} value={quickProdForm.stock} onChange={e => setQuickProdForm((f: any) => ({ ...f, stock: e.target.value === '' ? 0 : +e.target.value }))} className={inp} />)}
            {field('Stock Mínimo', <input type="number" step="any" min={0} value={quickProdForm.stock_minimo} onChange={e => setQuickProdForm((f: any) => ({ ...f, stock_minimo: e.target.value === '' ? 0 : +e.target.value }))} className={inp} />)}
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
            <input 
              type="checkbox" 
              checked={!!quickProdForm.es_por_encargo} 
              onChange={e => setQuickProdForm((f: any) => ({ ...f, es_por_encargo: e.target.checked }))} 
              className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-700">Producto por Encargo (Bajo Pedido)</span>
              <span className="text-xs text-zinc-500">Permite registrar sin validar stock inicial.</span>
            </div>
          </label>

          {quickProdForm.tipo_producto !== 'otro' && (
            <div className="p-4.5 bg-amber-50/30 rounded-xl border border-amber-100/50 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('Calidad del Perfume', (
                  <select value={quickProdForm.calidad || 'Original'} onChange={e => setQuickProdForm((f: any) => ({ ...f, calidad: e.target.value }))} className={inp}>
                    <option value="Original">Original</option>
                    <option value="1.1 Original">1.1 Original (Alta Similitud)</option>
                    <option value="Replica AAA">Réplica AAA</option>
                    <option value="Tester">Tester / Probador</option>
                    <option value="Decant">Decant (Muestra)</option>
                  </select>
                ))}
                {field('Volumen / Tamaño (Mililitros)', (
                  <div className="relative">
                    <input type="number" step="any" min={1} value={quickProdForm.mililitros || 100} onChange={e => setQuickProdForm((f: any) => ({ ...f, mililitros: e.target.value === '' ? 0 : +e.target.value }))} className={`${inp} pr-8`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">ml</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('Género', (
                  <select value={quickProdForm.genero || 'Unisex'} onChange={e => setQuickProdForm((f: any) => ({ ...f, genero: e.target.value as any }))} className={inp}>
                    <option value="Unisex">Unisex</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                ))}
                {field('Familia Olfativa', <input value={quickProdForm.familia_olfativa || ''} onChange={e => setQuickProdForm((f: any) => ({ ...f, familia_olfativa: e.target.value }))} className={inp} placeholder="Amaderada, Floral, Cítrica…" />)}
              </div>
            </div>
          )}

          {field('Descripción', <textarea rows={2} value={quickProdForm.descripcion || ''} onChange={e => setQuickProdForm((f: any) => ({ ...f, descripcion: e.target.value }))} className={inp} placeholder="Descripción corta del producto…" />)}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Estado del Producto', (
              <select value={quickProdForm.estado} onChange={e => setQuickProdForm((f: any) => ({ ...f, estado: e.target.value as any }))} className={inp}>
                <option value="activo">Activo / Disponible</option>
                <option value="inactivo">Inactivo / Oculto</option>
              </select>
            ))}
            {field('URL de la Imagen', <input value={quickProdForm.imagen || ''} onChange={e => setQuickProdForm((f: any) => ({ ...f, imagen: e.target.value }))} className={inp} placeholder="https://ejemplo.com/perfume.jpg" />)}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button type="button" variant="secondary" onClick={() => setQuickProductModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar e Ingresar al Carrito</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Dedicado para Crear Materia Prima desde Compras */}
      <Modal 
        isOpen={quickMpModalOpen} 
        onClose={() => setQuickMpModalOpen(false)} 
        title="Crear Nueva Materia Prima" 
        size="md"
        zIndexClass="z-[70]"
      >
        <form onSubmit={handleQuickMpSubmit} className="space-y-4 text-left">
          {quickMpError && <AlertBox type="warning" title="Atención" className="mb-4">{quickMpError}</AlertBox>}

          {field('Nombre de la Materia Prima', (
            <input 
              required 
              minLength={3} 
              value={quickMpForm.nombre} 
              onChange={e => setQuickMpForm((f: any) => ({ ...f, nombre: e.target.value }))} 
              className={inp} 
              placeholder="Ej. Esencia Concentrada Dior Sauvage" 
            />
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Tipo de Materia Prima', (
              <select value={quickMpForm.tipo} onChange={e => setQuickMpForm((f: any) => ({ ...f, tipo: e.target.value }))} className={inp}>
                <option value="esencia">Esencia</option>
                <option value="alcohol">Alcohol</option>
                <option value="fijador">Fijador</option>
                <option value="envase">Envase / Frasco</option>
                <option value="otro">Otro Insumo</option>
              </select>
            ))}
            {field('Unidad de Medida', (
              <select value={quickMpForm.unidad_medida} onChange={e => setQuickMpForm((f: any) => ({ ...f, unidad_medida: e.target.value }))} className={inp}>
                <option value="ml">Mililitros (ml)</option>
                <option value="g">Gramos (g)</option>
                <option value="ud">Unidades (ud)</option>
              </select>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Stock Inicial', (
              <input 
                type="number" 
                step="any" 
                min={0} 
                value={quickMpForm.stock} 
                onChange={e => setQuickMpForm((f: any) => ({ ...f, stock: e.target.value === '' ? 0 : +e.target.value }))} 
                className={inp} 
              />
            ))}
            {field('Stock Mínimo', (
              <input 
                type="number" 
                step="any" 
                min={0} 
                value={quickMpForm.stock_minimo} 
                onChange={e => setQuickMpForm((f: any) => ({ ...f, stock_minimo: e.target.value === '' ? 0 : +e.target.value }))} 
                className={inp} 
              />
            ))}
          </div>

          {field('Costo de Referencia (COP)', (
            <input 
              type="text" 
              required 
              value={formatNumberWithDots(quickMpForm.costo_unitario)} 
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, '');
                setQuickMpForm((f: any) => ({ ...f, costo_unitario: digits ? parseInt(digits, 10) : 0 }));
              }} 
              className={inp} 
              placeholder="0" 
            />
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Estado del Insumo', (
              <select value={quickMpForm.estado} onChange={e => setQuickMpForm((f: any) => ({ ...f, estado: e.target.value as any }))} className={inp}>
                <option value="activo">Activo / Disponible</option>
                <option value="inactivo">Inactivo / Oculto</option>
              </select>
            ))}
            {field('URL de Imagen (Opcional)', (
              <input 
                value={quickMpForm.imagen || ''} 
                onChange={e => setQuickMpForm((f: any) => ({ ...f, imagen: e.target.value }))} 
                className={inp} 
                placeholder="https://ejemplo.com/esencia.jpg" 
              />
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button type="button" variant="secondary" onClick={() => setQuickMpModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar e Ingresar al Carrito</Button>
          </div>
        </form>
      </Modal>
    </Modal>
  );
}

// ─── MAIN COMPRAS COMPONENT ───────────────────────────────────────────────────
export function Compras() {
  const { compras, proveedores, anularCompra, configuracion } = useAppData();
  const { isAdmin, user } = useAuth();

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<Compra['estado'] | 'todos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailCompra, setDetailCompra] = useState<Compra | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filtrado de historial de compras
  const filtered = useMemo(() => {
    return compras.filter(c => {
      const matchSearch = c.factura_compra.toLowerCase().includes(search.toLowerCase()) ||
        c.proveedor_nombre.toLowerCase().includes(search.toLowerCase());
      const matchEstado = filterEstado === 'todos' || c.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [compras, search, filterEstado]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleDownloadPDF = async (compra?: Compra) => {
    try {
      const c = compra || detailCompra;
      if (!c) return;

      const prov = proveedores.find(p => p.id === c.proveedor_id);

      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42); // Slate 900
      pdf.text(configuracion.nombre, 14, 22);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // Slate 500
      pdf.text(`NIT: ${configuracion.nit}  -  Tel: ${configuracion.telefono}`, 14, 30);
      pdf.text(configuracion.direccion, 14, 35);

      // Invoice info
      pdf.setFontSize(12);
      pdf.setTextColor(13, 148, 136); // Teal 600
      pdf.text('COMPRA DE MERCANCÍA', pageWidth - 14, 22, { align: 'right' });
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42); // Slate 900
      pdf.text(c.factura_compra, pageWidth - 14, 29, { align: 'right' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // Slate 500
      pdf.text(`Fecha registro: ${c.fecha}`, pageWidth - 14, 35, { align: 'right' });

      // Parties
      pdf.setFillColor(248, 250, 252); // Slate 50
      pdf.setDrawColor(226, 232, 240); // Slate 200
      pdf.rect(14, 45, pageWidth - 28, 25, 'FD');
      
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184); // Slate 400
      pdf.text('PROVEEDOR', 20, 53);
      pdf.text('METADATA COMPRADOR', pageWidth / 2, 53);
      
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59); // Slate 800
      pdf.text(c.proveedor_nombre, 20, 60);
      pdf.text(c.comprador_nombre, pageWidth / 2, 60);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // Slate 500
      pdf.text(`NIT: ${prov?.nit || 'N/A'} · Contacto: ${prov?.contacto || ''}`, 20, 66);
      pdf.text(`Estado de Factura: ${c.estado.toUpperCase()}`, pageWidth / 2, 66);

      // Table
      const tableData = c.items.map(item => [
        item.nombre,
        item.cantidad.toString(),
        formatCurrency(item.precio_costo),
        item.precio_venta ? formatCurrency(item.precio_venta) : 'Sin cambios',
        formatCurrency(item.subtotal)
      ]);

      autoTable(pdf, {
        startY: 75,
        head: [['Ítem / Producto', 'Cantidad', 'Costo Unit.', 'P. Venta', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' }
        },
      });

      let finalY = (pdf as any).lastAutoTable.finalY + 5;

      // Totals
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42); // Slate 900
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL PAGADO:', pageWidth - 60, finalY + 10, { align: 'right' });
      pdf.setTextColor(13, 148, 136); // Teal 600
      pdf.text(formatCurrency(c.total), pageWidth - 14, finalY + 10, { align: 'right' });

      finalY += 25;

      if (c.notas) {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(14, finalY, pageWidth - 28, 25, 'FD');
        pdf.setFontSize(9);
        pdf.setTextColor(148, 163, 184);
        pdf.setFont('helvetica', 'bold');
        pdf.text('NOTAS ADMINISTRATIVAS', 20, finalY + 8);
        pdf.setFontSize(10);
        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        pdf.text(c.notas, 20, finalY + 15);
        finalY += 35;
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Comprobante oficial generado por el sistema administrativo de inventarios de ${configuracion.nombre}.`, pageWidth / 2, finalY + 15, { align: 'center' });

      pdf.save(`Comprobante-${c.factura_compra}.pdf`);
    } catch (err: any) {
      console.error('Error al generar PDF de compra:', err);
      alert('Error al generar PDF: ' + (err.message || err.toString()));
    }
  };

  const handleAnular = () => {
    if (detailCompra) {
      anularCompra(detailCompra.id, user?.name || 'Usuario', user?.id || '', user?.role || 'admin');
      setDetailCompra(null);
    }
  };

  const inp = 'px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white';

  return (
    <Layout
      title="Compras a Proveedores"
      subtitle="Registro de adquisiciones y abastecimiento de mercaderías"
    >
      {/* Printable Invoice Container (CSS media print will target this) */}
      {detailCompra && (
        <div id="printable-invoice" className="hidden print:block p-8 bg-white text-zinc-800 text-xs font-sans leading-relaxed text-left">
          <div className="flex justify-between items-start border-b-2 border-zinc-200 pb-5 mb-5">
            <div>
              <h1 className="text-xl font-bold text-zinc-900 uppercase tracking-tight">{configuracion.nombre}</h1>
              <p className="text-[10px] text-zinc-400 mt-1">NIT: {configuracion.nit} · Tel: {configuracion.telefono}</p>
              <p className="text-[10px] text-zinc-400">{configuracion.direccion}</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-amber-600">COMPRA DE MERCANCÍA</h2>
              <p className="text-sm font-mono font-bold mt-1">{detailCompra.factura_compra}</p>
              <p className="text-[9px] text-zinc-400">Fecha registro: {detailCompra.fecha}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="p-3 bg-zinc-50 rounded-lg">
              <span className="block text-[8px] font-bold text-zinc-400 uppercase">PROVEEDOR</span>
              <p className="font-bold text-zinc-800 mt-0.5">{detailCompra.proveedor_nombre}</p>
              <p className="text-[10px] text-zinc-400 mt-1">Asociado en base de datos</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg">
              <span className="block text-[8px] font-bold text-zinc-400 uppercase">METADATA COMPRADOR</span>
              <p className="font-bold text-zinc-800 mt-0.5">{detailCompra.comprador_nombre}</p>
              <p className="text-[10px] text-zinc-400 mt-1">Estado de Factura: <strong className="uppercase">{detailCompra.estado}</strong></p>
            </div>
          </div>

          <table className="w-full text-xs mb-6">
            <colgroup>
              <col className="w-[36%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-zinc-300 bg-zinc-100 font-bold text-zinc-700">
                <th className="py-2 px-3 text-left">Ítem / Producto</th>
                <th className="py-2 px-3 text-center">Cantidad</th>
                <th className="py-2 px-3 text-right">Costo Unit.</th>
                <th className="py-2 px-3 text-right">P. Venta</th>
                <th className="py-2 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {detailCompra.items.map(item => (
                <tr key={item.producto_id}>
                  <td className="py-2.5 px-3 text-zinc-800 text-left">{item.nombre}</td>
                  <td className="py-2.5 px-3 text-center text-zinc-600">{item.cantidad}</td>
                  <td className="py-2.5 px-3 text-right text-zinc-600">{formatCurrency(item.precio_costo)}</td>
                  <td className="py-2.5 px-3 text-right text-zinc-600">{item.precio_venta ? formatCurrency(item.precio_venta) : 'Sin cambios'}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-zinc-800">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-300 font-bold text-zinc-900 text-sm">
                <td colSpan={4} className="py-3 px-3 text-right uppercase">TOTAL PAGADO</td>
                <td className="py-3 px-3 text-right font-mono text-amber-600">{formatCurrency(detailCompra.total)}</td>
              </tr>
            </tfoot>
          </table>

          {detailCompra.notas && (
            <div className="p-3 border border-zinc-200 rounded-lg">
              <span className="block text-[8px] font-bold text-zinc-400 uppercase mb-1">Notas Administrativas</span>
              <p className="text-zinc-600 font-medium">{detailCompra.notas}</p>
            </div>
          )}

          <div className="mt-12 text-center text-[10px] text-zinc-400 border-t border-zinc-100 pt-6">
            Comprobante oficial generado por el sistema administrativo de inventarios de {configuracion.nombre}.
          </div>
        </div>
      )}

      {/* Screen view content */}
      <div className="print:hidden space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
              <input
                placeholder="Buscar factura o proveedor..."
                className={`${inp} pl-9 w-64`}
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <select
              value={filterEstado}
              onChange={e => { setFilterEstado(e.target.value as any); setCurrentPage(1); }}
              className={inp}
            >
              <option value="todos">Todos los Estados</option>
              <option value="completada">Completadas</option>
              <option value="anulada">Anuladas</option>
            </select>
          </div>

          {isAdmin && (
            <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Registrar Compra
            </Button>
          )}
        </div>

        {/* History Table */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-zinc-100">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <ShoppingBag size={32} className="mx-auto text-zinc-300 mb-3" />
              <p className="text-zinc-400 text-sm">No se encontraron facturas de compras</p>
            </div>
          ) : paginated.map(c => (
            <div key={c.id} className="p-4 space-y-3 hover:bg-zinc-50/60 transition-colors">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-bold text-zinc-800 text-sm leading-tight">{c.proveedor_nombre}</p>
                  <p className="text-xs text-amber-600 font-mono font-semibold mt-0.5">{c.factura_compra} <span className="text-zinc-400 font-sans font-normal">· {c.fecha}</span></p>
                </div>
                <Badge variant={c.estado} />
              </div>

              <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100 text-xs text-zinc-600 flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-[10px] uppercase font-bold">Responsable</p>
                  <p className="font-medium text-zinc-700">{c.comprador_nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-[10px] uppercase font-bold">Total Compra</p>
                  <p className="font-bold text-zinc-800 text-sm">{formatCurrency(c.total)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setDetailCompra(c)}
                  className="flex-1 py-2 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Eye size={14} className="mr-1.5" /> Detalles
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownloadPDF(c); }}
                  className="flex-1 py-2 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download size={14} className="mr-1.5" /> PDF
                </button>
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
                  { label: 'Nro. Factura', className: '' }, 
                  { label: 'Proveedor', className: '' }, 
                  { label: 'Fecha Registro', className: 'hidden sm:table-cell' }, 
                  { label: 'Responsable', className: 'hidden md:table-cell' }, 
                  { label: 'Total Compra', className: '' }, 
                  { label: 'Estado', className: 'hidden md:table-cell' }, 
                  { label: 'Acción', className: 'text-right' }
                ].map(h => (
                  <th key={h.label} className={`px-4 sm:px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap ${h.className}`}>{h.label}</th>
                ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <ShoppingBag size={32} className="mx-auto text-zinc-300 mb-3" />
                      <p className="text-zinc-400 text-sm">No se encontraron facturas de compras</p>
                    </td>
                  </tr>
                ) : paginated.map(c => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-4 sm:px-5 py-4 font-mono text-[10px] sm:text-xs font-bold text-amber-600 whitespace-nowrap">{c.factura_compra}</td>
                    <td className="px-4 sm:px-5 py-4">
                      <span className="font-medium text-zinc-800 text-sm truncate max-w-30 sm:max-w-xs block">{c.proveedor_nombre}</span>
                      <span className="text-[10px] sm:hidden text-zinc-500">{c.fecha}</span>
                    </td>
                    <td className="px-4 sm:px-5 py-4 text-zinc-500 whitespace-nowrap hidden sm:table-cell">{c.fecha}</td>
                    <td className="px-4 sm:px-5 py-4 text-zinc-600 whitespace-nowrap hidden md:table-cell">{c.comprador_nombre}</td>
                    <td className="px-4 sm:px-5 py-4 font-semibold text-zinc-800 whitespace-nowrap font-mono text-sm">{formatCurrency(c.total)}</td>
                    <td className="px-4 sm:px-5 py-4 whitespace-nowrap hidden md:table-cell">
                      <Badge variant={c.estado} />
                    </td>
                    <td className="px-4 sm:px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-amber-600 transition-colors cursor-pointer"
                          title="Ver detalles"
                          onClick={() => setDetailCompra(c)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-amber-600 transition-colors cursor-pointer"
                          title="Descargar comprobante"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(c);
                          }}
                        >
                          <Download size={16} />
                        </button>
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
                  Mostrando <strong className="text-zinc-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> al <strong className="text-zinc-700">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</strong> de <strong className="text-zinc-700">{filtered.length}</strong> compras
                </span>
              ) : (
                <span>0 compras registradas</span>
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

      </div>

      {/* Detail Modal */}
      <Modal 
        isOpen={!!detailCompra} 
        onClose={() => setDetailCompra(null)} 
        title={`Comprobante de Compra — ${detailCompra?.factura_compra}`} 
        size="xl"
      >
        {detailCompra && (() => {
          return (
            <div className="space-y-6">
              {/* Printable Purchase Container */}
              <div id="printable-purchase" className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5 print:border-0 print:p-0 print:shadow-none">
                
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div className="flex items-start gap-4">
                    <img src="/logo.png" alt="Logo" className="w-44 h-44 object-contain print:w-44 print:h-44 scale-125 origin-center rounded-md" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-zinc-800 text-lg leading-tight">{configuracion.nombre}</h3>
                      <p className="text-xs text-zinc-500 font-medium">NIT: {configuracion.nit}</p>
                      <p className="text-xs text-zinc-400">{configuracion.direccion}</p>
                      <p className="text-xs text-zinc-400">Tel: {configuracion.telefono}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right space-y-1 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Factura de Compra</span>
                    <h4 className="text-xl font-mono font-bold text-amber-600">{detailCompra.factura_compra}</h4>
                    <p className="text-xs text-zinc-500">Fecha: {new Date(detailCompra.fecha).toLocaleDateString('es-CO')}</p>
                    <Badge variant={detailCompra.estado} className="mt-1" />
                  </div>
                </div>

                {/* Proveedor / Comprador Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-zinc-50 p-3 rounded-lg border border-zinc-100 print:bg-white print:border-zinc-200">
                  <div>
                    <p className="text-zinc-400 font-bold uppercase tracking-wider">Proveedor</p>
                    <p className="font-bold text-zinc-800 mt-1">{detailCompra.proveedor_nombre}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 font-bold uppercase tracking-wider">Responsable de Registro</p>
                    <p className="font-bold text-zinc-800 mt-1">{detailCompra.comprador_nombre}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="rounded-lg border border-zinc-200 overflow-x-auto print:border-zinc-300">
                  <table className="w-full text-xs min-w-125">
                    <thead className="bg-zinc-50 border-b border-zinc-200 print:bg-zinc-100">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-bold text-zinc-600">Descripción del Producto</th>
                        <th className="px-4 py-2.5 text-center font-bold text-zinc-600">Cant.</th>
                        <th className="px-4 py-2.5 text-right font-bold text-zinc-600">Costo Unit.</th>
                        <th className="px-4 py-2.5 text-right font-bold text-zinc-600">P. Venta</th>
                        <th className="px-4 py-2.5 text-right font-bold text-zinc-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {detailCompra.items.map(item => (
                        <tr key={item.producto_id} className="hover:bg-zinc-50/20">
                          <td className="px-4 py-2.5 text-zinc-700 font-medium truncate max-w-0" title={item.nombre}>{item.nombre}</td>
                          <td className="px-4 py-2.5 text-center text-zinc-600 font-mono">{item.cantidad}</td>
                          <td className="px-4 py-2.5 text-right text-zinc-600 font-mono">{formatCurrency(item.precio_costo)}</td>
                          <td className="px-4 py-2.5 text-right text-zinc-500 font-mono">{item.precio_venta ? formatCurrency(item.precio_venta) : 'Sin cambios'}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-zinc-800 font-mono">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-zinc-200 bg-zinc-50/50 print:bg-zinc-50">
                      <tr className="bg-amber-50/50 border-t border-amber-100 print:bg-amber-50">
                        <td colSpan={4} className="px-4 py-3 text-right font-extrabold text-amber-800 text-sm">TOTAL PAGADO</td>
                        <td className="px-4 py-3 text-right font-extrabold text-amber-800 text-sm font-mono">{formatCurrency(detailCompra.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {detailCompra.notas && (
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl print:bg-white print:border-zinc-300">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Notas Administrativas</span>
                    <p className="text-xs text-zinc-600 leading-relaxed">{detailCompra.notas}</p>
                  </div>
                )}
              </div>

              {/* Detail Buttons (Hidden on Print) */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-zinc-100 print:hidden">
                <Button variant="primary" icon={<Download size={15} />} onClick={() => handleDownloadPDF()} className="w-full sm:w-auto justify-center">
                  Descargar Comprobante
                </Button>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {isAdmin && detailCompra.estado === 'completada' ? (
                    <Button variant="danger" icon={<XCircle size={15} />} onClick={handleAnular} className="w-full sm:w-auto justify-center">
                      Anular Compra
                    </Button>
                  ) : (
                    <div />
                  )}
                  <Button variant="ghost" onClick={() => setDetailCompra(null)} className="w-full sm:w-auto justify-center">
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal for creating a new purchase */}
      <NuevaCompraModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </Layout>
  );
}

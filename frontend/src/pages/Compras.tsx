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
import type { Compra, CompraItem, Producto, Proveedor } from '../types';

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
  const { productos, proveedores, addCompra, materiasPrimas } = useAppData();
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
      ).map(m => ({ ...m, _id: m.id, _nombre: m.nombre, _precio_costo: 0, _precio_venta: 0, _codigo: `MP-${m.tipo.toUpperCase()}`, _stock: m.stock }));
    }
  }, [productos, materiasPrimas, searchProd, tipoItem]);

  const getItemId = (item: CompraItem) => item.producto_id || item.materia_prima_id || '';

  // Manejo del carrito
  const addToCart = (item: any, cantidad: number, costo: number) => {
    if (cantidad <= 0) return;
    setCarrito(prev => {
      const idx = prev.findIndex(i => getItemId(i) === item._id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].cantidad += cantidad;
        updated[idx].subtotal = updated[idx].cantidad * updated[idx].precio_costo;
        return updated;
      }
      return [...prev, {
        producto_id: tipoItem === 'producto' ? item._id : undefined,
        materia_prima_id: tipoItem === 'materia_prima' ? item._id : undefined,
        tipo_item: tipoItem,
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input
                      placeholder={`Buscar ${tipoItem === 'producto' ? 'producto' : 'materia prima'}...`}
                      value={searchProd}
                      onChange={e => setSearchProd(e.target.value)}
                      className={`${inp} pl-9`}
                    />
                  </div>
                  
                  <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100 max-h-64 overflow-y-auto bg-white">
                    {itemsFiltrados.length === 0 ? (
                      <div className="py-8 text-center">
                        <Package size={24} className="mx-auto text-zinc-300 mb-2" />
                        <p className="text-xs text-zinc-400">Sin resultados</p>
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
                      <span className="font-medium text-zinc-800 text-sm truncate max-w-[120px] sm:max-w-xs block">{c.proveedor_nombre}</span>
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
      {detailCompra && (
        <Modal 
          isOpen={!!detailCompra} 
          onClose={() => setDetailCompra(null)} 
          title={`Detalle de Compra: ${detailCompra.factura_compra}`} 
          size="xl"
        >
          <div className="space-y-6 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-xs space-y-1">
                <span className="block text-zinc-400 uppercase font-bold text-[8px]">Proveedor</span>
                <span className="font-bold text-zinc-800 text-sm block">{detailCompra.proveedor_nombre}</span>
                <span className="text-[10px] text-zinc-400">Fecha de compra: {detailCompra.fecha}</span>
              </div>
              <div className="text-xs space-y-1 text-right">
                <span className="block text-zinc-400 uppercase font-bold text-[8px]">Responsable Registro</span>
                <span className="font-bold text-zinc-800 text-sm block">{detailCompra.comprador_nombre}</span>
                <div className="mt-1 flex justify-end">
                  <Badge variant={detailCompra.estado} />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Producto</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-zinc-500">Cantidad</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Costo Unit.</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">P. Venta</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {detailCompra.items.map(item => (
                    <tr key={item.producto_id}>
                      <td className="px-4 py-2.5 text-zinc-700 text-left truncate" title={item.nombre}>{item.nombre}</td>
                      <td className="px-4 py-2.5 text-center text-zinc-600">{item.cantidad}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-600 font-mono">{formatCurrency(item.precio_costo)}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-500 font-mono">{item.precio_venta ? formatCurrency(item.precio_venta) : 'Sin cambios'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-zinc-800 font-mono">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-amber-50 border-t border-amber-200 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3.5 text-right text-amber-700">TOTAL PAGADO</td>
                    <td className="px-4 py-3.5 text-right text-amber-700 text-base font-mono">{formatCurrency(detailCompra.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {detailCompra.notas && (
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="block text-[8px] font-bold text-zinc-400 uppercase mb-1">Notas Administrativas</span>
                <p className="text-xs text-zinc-600 leading-relaxed">{detailCompra.notas}</p>
              </div>
            )}

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-100">
                {isAdmin && detailCompra.estado === 'completada' ? (
                  <Button variant="danger" icon={<XCircle size={15} />} onClick={handleAnular}>
                    Anular Compra
                  </Button>
                ) : (
                  <div />
                )}
                <Button variant="secondary" onClick={() => setDetailCompra(null)}>Cerrar</Button>
              </div>
          </div>
        </Modal>
      )}

      {/* Modal for creating a new purchase */}
      <NuevaCompraModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </Layout>
  );
}

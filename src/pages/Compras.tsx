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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const { productos, proveedores, addCompra } = useAppData();
  const { user } = useAuth();

  const [step, setStep] = useState<WizardStep>('proveedor');
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

  // Filtrado de productos en el selector de compras
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(searchProd.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchProd.toLowerCase())
    );
  }, [productos, searchProd]);

  // Manejo del carrito
  const addToCart = (prod: Producto, cantidad: number, costo: number) => {
    if (cantidad <= 0) return;
    setCarrito(prev => {
      const idx = prev.findIndex(item => item.producto_id === prod.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].cantidad += cantidad;
        updated[idx].subtotal = updated[idx].cantidad * updated[idx].precio_costo;
        return updated;
      }
      return [...prev, {
        producto_id: prod.id,
        nombre: prod.nombre,
        cantidad,
        precio_costo: costo,
        precio_venta: prod.precio_venta,
        subtotal: cantidad * costo
      }];
    });
  };

  const updateCartQty = (prodId: string, qty: number) => {
    setCarrito(prev =>
      prev.map(item => {
        if (item.producto_id !== prodId) return item;
        const newQty = Math.max(1, qty);
        return {
          ...item,
          cantidad: newQty,
          subtotal: newQty * item.precio_costo
        };
      })
    );
  };

  const updateCartCost = (prodId: string, rawCost: string) => {
    const digits = rawCost.replace(/\D/g, '');
    const cost = digits ? parseInt(digits, 10) : 0;
    setCarrito(prev =>
      prev.map(item => {
        if (item.producto_id !== prodId) return item;
        return {
          ...item,
          precio_costo: cost,
          subtotal: item.cantidad * cost
        };
      })
    );
  };

  const updateCartSalePrice = (prodId: string, rawSalePrice: string) => {
    const digits = rawSalePrice.replace(/\D/g, '');
    const salePrice = digits ? parseInt(digits, 10) : 0;
    setCarrito(prev =>
      prev.map(item => {
        if (item.producto_id !== prodId) return item;
        return {
          ...item,
          precio_venta: salePrice
        };
      })
    );
  };

  const removeFromCart = (prodId: string) => {
    setCarrito(prev => prev.filter(item => item.producto_id !== prodId));
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
    
    const invalidMargin = carrito.find(item => item.precio_costo > (item.precio_venta || 0));
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

  const inp = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors bg-white';
  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Compra a Proveedor" size="xl"
      headerAction={
        <button
          onClick={reset}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
            <h3 className="text-base font-bold text-slate-800">¡Compra Registrada Exitosamente!</h3>
            <p className="text-xs text-slate-400 mt-1">El stock se ha reabastecido y los costos fueron actualizados.</p>
          </div>
          <Button onClick={handleClose} className="mx-auto">Cerrar</Button>
        </div>
      ) : (
        <>
          {/* Wizard Header Progress */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 select-none">
            {[
              { key: 'proveedor', label: '1. Proveedor' },
              { key: 'productos', label: '2. Carrito de Compra' },
              { key: 'confirmar', label: '3. Finalizar' }
            ].map(s => (
              <span 
                key={s.key} 
                className={`text-xs font-bold transition-colors ${
                  step === s.key ? 'text-teal-600' : 'text-slate-400'
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
                <p className="text-xs text-slate-500">Busca y selecciona el proveedor al que le realizarás el reabastecimiento:</p>
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchProv}
                    onChange={e => setSearchProv(e.target.value)}
                    placeholder="Buscar proveedor..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors bg-white"
                  />
                </div>
              </div>

              {/* Sin proveedor option */}
              <div
                onClick={() => setProveedorId(SIN_PROVEEDOR_ID)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:bg-slate-50 flex flex-col text-left ${
                  proveedorId === SIN_PROVEEDOR_ID
                    ? 'border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/10'
                    : 'border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-slate-800 truncate pr-2">Sin Proveedor Registrado</span>
                  {proveedorId === SIN_PROVEEDOR_ID && <CheckCircle2 size={16} className="text-teal-600 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Compra sin proveedor registrado en el sistema</span>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-400 font-medium">o proveedores registrados</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {proveedoresFiltrados.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-400">No se encontraron proveedores activos con esa búsqueda.</div>
                ) : proveedoresFiltrados.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setProveedorId(p.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:bg-slate-50 flex flex-col text-left ${
                      proveedorId === p.id 
                        ? 'border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/10' 
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-slate-800 truncate pr-2">{p.nombre}</span>
                      {proveedorId === p.id && <CheckCircle2 size={16} className="text-teal-600 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-1">NIT: {p.nit}</span>
                    <span className="text-[11px] text-slate-500 mt-2">Contacto: {p.contacto}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-slate-100">
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      placeholder="Buscar producto por nombre o código..."
                      value={searchProd}
                      onChange={e => setSearchProd(e.target.value)}
                      className={`${inp} pl-9`}
                    />
                  </div>
                  
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-64 overflow-y-auto bg-white">
                    {productosFiltrados.length === 0 ? (
                      <div className="py-8 text-center">
                        <Package size={24} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400">Sin resultados</p>
                      </div>
                    ) : productosFiltrados.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p, 1, p.precio_costo)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-teal-50 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-100 border border-slate-200/60 shrink-0 flex items-center justify-center">
                            {p.imagen ? (
                              <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={14} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{p.nombre}</p>
                            <p className="text-xs text-slate-400">{p.codigo} · stock: {p.stock}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-teal-600">{formatCurrency(p.precio_venta)}</p>
                          <p className="text-xs text-slate-300 group-hover:text-teal-400 transition-colors">+ agregar</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cart Preview */}
                <div className="flex flex-col border border-slate-200 rounded-xl bg-slate-50/50 p-4">
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Artículos a comprar</span>
                    <span className="text-xs font-mono font-bold text-slate-500">{carrito.length} Items</span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-50 space-y-2 mt-3 pr-1">
                    {carrito.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        El carrito está vacío
                      </div>
                    ) : carrito.map(item => (
                      <div key={item.producto_id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 text-left">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-slate-800 truncate pr-2">{item.nombre}</p>
                          <button 
                            onClick={() => removeFromCart(item.producto_id)} 
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-3">
                            <div className="w-24 shrink-0">
                              <span className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Cant.</span>
                              <input 
                                type="number" 
                                min={1} 
                                value={item.cantidad} 
                                onChange={e => updateCartQty(item.producto_id, +e.target.value)} 
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all text-center"
                              />
                            </div>
                            <div className="flex-1">
                              <span className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Costo Unit.</span>
                              <input 
                                value={formatNumberWithDots(item.precio_costo)} 
                                onChange={e => updateCartCost(item.producto_id, e.target.value)} 
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Precio Venta Sugerido</span>
                            <input 
                              value={formatNumberWithDots(item.precio_venta || 0)} 
                              onChange={e => updateCartSalePrice(item.producto_id, e.target.value)} 
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 mt-3 flex justify-between font-bold text-slate-800 text-sm">
                    <span>Total estimado</span>
                    <span className="font-mono text-teal-600">{formatCurrency(total)}</span>
                  </div>
                </div>

              </div>

              <div className="flex justify-between pt-2 border-t border-slate-100">
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
              <h3 className="text-sm font-bold text-slate-800 mb-3 text-left">Resumen de Confirmación</h3>
              
              {error && (
                <AlertBox type="critical" title="Error de Validación">
                  {error}
                </AlertBox>
              )}
              
              <AlertBox type="note" title="Registro de Ingreso">
                Al confirmar la transacción, se incrementará el stock del catálogo y se actualizarán los precios de costo de compra unitarios automáticamente.
              </AlertBox>

              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 grid grid-cols-2 gap-4 text-left">
                <div className="text-xs">
                  <span className="block text-slate-400 uppercase font-bold text-[8px]">Proveedor</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{proveedorSeleccionado?.nombre}</span>
                  {proveedorId !== SIN_PROVEEDOR_ID && <span className="text-[10px] text-slate-400 font-mono">NIT: {proveedorSeleccionado?.nit}</span>}
                </div>
                <div className="text-xs">
                  <span className="block text-slate-400 uppercase font-bold text-[8px]">Comprador Autorizado</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{user?.name} ({user?.role})</span>
                  <span className="text-[10px] text-slate-400">Fecha: {new Date().toLocaleDateString('es-CO')}</span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Producto</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Cant.</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Costo Unit.</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Nuevo P. Venta</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {carrito.map(item => (
                      <tr key={item.producto_id}>
                        <td className="px-4 py-2.5 text-slate-700 text-left truncate" title={item.nombre}>{item.nombre}</td>
                        <td className="px-4 py-2.5 text-center text-slate-600">{item.cantidad}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">{formatCurrency(item.precio_costo)}</td>
                        <td className="px-4 py-2.5 text-right text-teal-600 font-semibold">{item.precio_venta ? formatCurrency(item.precio_venta) : 'Sin cambios'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-teal-50 border-t border-teal-200">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-bold text-teal-700 uppercase">TOTAL COMPRA</td>
                      <td className="px-4 py-3 text-right font-bold text-teal-700 text-base font-mono">{formatCurrency(total)}</td>
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

              <div className="flex justify-between pt-2 border-t border-slate-100">
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
    const c = compra || detailCompra;
    if (!c) return;

    const prov = proveedores.find(p => p.id === c.proveedor_id);

    const printableHtml = `
      <div style="padding:32px;font-family:sans-serif;font-size:12px;color:#1e293b;max-width:1100px;margin:0 auto;background:#fff;line-height:1.5">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:20px">
          <div>
            <h1 style="font-size:20px;font-weight:bold;text-transform:uppercase;letter-spacing:-0.5px;color:#0f172a;margin:0">${configuracion.nombre}</h1>
            <p style="font-size:10px;color:#94a3b8;margin:4px 0 0">NIT: ${configuracion.nit} · Tel: ${configuracion.telefono}</p>
            <p style="font-size:10px;color:#94a3b8;margin:0">${configuracion.direccion}</p>
          </div>
          <div style="text-align:right">
            <h2 style="font-size:18px;font-weight:bold;color:#0d9488;margin:0">COMPRA DE MERCANCÍA</h2>
            <p style="font-size:14px;font-weight:bold;font-family:monospace;margin:4px 0">${c.factura_compra}</p>
            <p style="font-size:9px;color:#94a3b8;margin:0">Fecha registro: ${c.fecha}</p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
          <div style="padding:12px;background:#f8fafc;border-radius:8px">
            <span style="font-size:8px;font-weight:bold;text-transform:uppercase;color:#94a3b8">PROVEEDOR</span>
            <p style="font-weight:bold;color:#1e293b;margin:2px 0">${c.proveedor_nombre}</p>
            <p style="font-size:10px;color:#94a3b8;margin:4px 0">NIT: ${prov?.nit || 'N/A'} · Contacto: ${prov?.contacto || ''}</p>
          </div>
          <div style="padding:12px;background:#f8fafc;border-radius:8px">
            <span style="font-size:8px;font-weight:bold;text-transform:uppercase;color:#94a3b8">METADATA COMPRADOR</span>
            <p style="font-weight:bold;color:#1e293b;margin:2px 0">${c.comprador_nombre}</p>
            <p style="font-size:10px;color:#94a3b8;margin:4px 0">Estado de Factura: <strong style="text-transform:uppercase">${c.estado}</strong></p>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px">
          <thead>
            <tr style="border-bottom:2px solid #cbd5e1;background:#f1f5f9;font-weight:bold;color:#475569">
              <th style="padding:8px 12px;text-align:left">Ítem / Producto</th>
              <th style="padding:8px 12px;text-align:center">Cantidad</th>
              <th style="padding:8px 12px;text-align:right">Costo Unit.</th>
              <th style="padding:8px 12px;text-align:right">P. Venta</th>
              <th style="padding:8px 12px;text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${c.items.map(item => `
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 12px;color:#1e293b">${item.nombre}</td>
                <td style="padding:10px 12px;text-align:center;color:#64748b">${item.cantidad}</td>
                <td style="padding:10px 12px;text-align:right;color:#64748b">${formatCurrency(item.precio_costo)}</td>
                <td style="padding:10px 12px;text-align:right;color:#64748b">${item.precio_venta ? formatCurrency(item.precio_venta) : 'Sin cambios'}</td>
                <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#1e293b">${formatCurrency(item.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid #cbd5e1;font-weight:bold;color:#0f172a;font-size:14px">
              <td colspan="4" style="padding:12px;text-align:right;text-transform:uppercase">TOTAL PAGADO</td>
              <td style="padding:12px;text-align:right;font-family:monospace;color:#0d9488">${formatCurrency(c.total)}</td>
            </tr>
          </tfoot>
        </table>

        ${c.notas ? `
          <div style="padding:12px;border:1px solid #e2e8f0;border-radius:8px">
            <span style="font-size:8px;font-weight:bold;text-transform:uppercase;color:#94a3b8">Notas Administrativas</span>
            <p style="color:#475569;margin:4px 0">${c.notas}</p>
          </div>
        ` : ''}

        <div style="margin-top:48px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:24px">
          Comprobante oficial generado por el sistema administrativo de inventarios de ${configuracion.nombre}.
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = printableHtml;
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '1100px';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
      pdf.save(`Comprobante-${c.factura_compra}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF de compra:', err);
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleAnular = () => {
    if (detailCompra) {
      anularCompra(detailCompra.id, user?.name || 'Usuario', user?.role || 'admin');
      setDetailCompra(null);
    }
  };

  const inp = 'px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-white';

  return (
    <Layout
      title="Compras a Proveedores"
      subtitle="Registro de adquisiciones y abastecimiento de mercaderías"
    >
      {/* Printable Invoice Container (CSS media print will target this) */}
      {detailCompra && (
        <div id="printable-invoice" className="hidden print:block p-8 bg-white text-slate-800 text-xs font-sans leading-relaxed text-left">
          <div className="flex justify-between items-start border-b-2 border-slate-200 pb-5 mb-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{configuracion.nombre}</h1>
              <p className="text-[10px] text-slate-400 mt-1">NIT: {configuracion.nit} · Tel: {configuracion.telefono}</p>
              <p className="text-[10px] text-slate-400">{configuracion.direccion}</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-teal-600">COMPRA DE MERCANCÍA</h2>
              <p className="text-sm font-mono font-bold mt-1">{detailCompra.factura_compra}</p>
              <p className="text-[9px] text-slate-400">Fecha registro: {detailCompra.fecha}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="block text-[8px] font-bold text-slate-400 uppercase">PROVEEDOR</span>
              <p className="font-bold text-slate-800 mt-0.5">{detailCompra.proveedor_nombre}</p>
              <p className="text-[10px] text-slate-400 mt-1">Asociado en base de datos</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="block text-[8px] font-bold text-slate-400 uppercase">METADATA COMPRADOR</span>
              <p className="font-bold text-slate-800 mt-0.5">{detailCompra.comprador_nombre}</p>
              <p className="text-[10px] text-slate-400 mt-1">Estado de Factura: <strong className="uppercase">{detailCompra.estado}</strong></p>
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
              <tr className="border-b border-slate-300 bg-slate-100 font-bold text-slate-700">
                <th className="py-2 px-3 text-left">Ítem / Producto</th>
                <th className="py-2 px-3 text-center">Cantidad</th>
                <th className="py-2 px-3 text-right">Costo Unit.</th>
                <th className="py-2 px-3 text-right">P. Venta</th>
                <th className="py-2 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detailCompra.items.map(item => (
                <tr key={item.producto_id}>
                  <td className="py-2.5 px-3 text-slate-800 text-left">{item.nombre}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600">{item.cantidad}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(item.precio_costo)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{item.precio_venta ? formatCurrency(item.precio_venta) : 'Sin cambios'}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 font-bold text-slate-900 text-sm">
                <td colSpan={4} className="py-3 px-3 text-right uppercase">TOTAL PAGADO</td>
                <td className="py-3 px-3 text-right font-mono text-teal-600">{formatCurrency(detailCompra.total)}</td>
              </tr>
            </tfoot>
          </table>

          {detailCompra.notas && (
            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Notas Administrativas</span>
              <p className="text-slate-600 font-medium">{detailCompra.notas}</p>
            </div>
          )}

          <div className="mt-12 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-6">
            Comprobante oficial generado por el sistema administrativo de inventarios de {configuracion.nombre}.
          </div>
        </div>
      )}

      {/* Screen view content */}
      <div className="print:hidden space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Nro. Factura', 'Proveedor', 'Fecha Registro', 'Responsable', 'Total Compra', 'Estado', 'Acción'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <ShoppingBag size={32} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-400 text-sm">No se encontraron facturas de compras</p>
                    </td>
                  </tr>
                ) : paginated.map(c => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs font-bold text-teal-600 whitespace-nowrap">{c.factura_compra}</td>
                    <td className="px-5 py-4 font-medium text-slate-800 whitespace-nowrap">{c.proveedor_nombre}</td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{c.fecha}</td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{c.comprador_nombre}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800 whitespace-nowrap font-mono">{formatCurrency(c.total)}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge variant={c.estado} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                          title="Ver detalles"
                          onClick={() => setDetailCompra(c)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                          title="Descargar comprobante"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(c);
                          }}
                        >
                          <Download size={15} />
                        </button>
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
                  Mostrando <strong className="text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> al <strong className="text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</strong> de <strong className="text-slate-700">{filtered.length}</strong> compras
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
            <div className="grid grid-cols-2 gap-4">
              <div className="text-xs space-y-1">
                <span className="block text-slate-400 uppercase font-bold text-[8px]">Proveedor</span>
                <span className="font-bold text-slate-800 text-sm block">{detailCompra.proveedor_nombre}</span>
                <span className="text-[10px] text-slate-400">Fecha de compra: {detailCompra.fecha}</span>
              </div>
              <div className="text-xs space-y-1 text-right">
                <span className="block text-slate-400 uppercase font-bold text-[8px]">Responsable Registro</span>
                <span className="font-bold text-slate-800 text-sm block">{detailCompra.comprador_nombre}</span>
                <div className="mt-1 flex justify-end">
                  <Badge variant={detailCompra.estado} />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Producto</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Cantidad</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Costo Unit.</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">P. Venta</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {detailCompra.items.map(item => (
                    <tr key={item.producto_id}>
                      <td className="px-4 py-2.5 text-slate-700 text-left truncate" title={item.nombre}>{item.nombre}</td>
                      <td className="px-4 py-2.5 text-center text-slate-600">{item.cantidad}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600 font-mono">{formatCurrency(item.precio_costo)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500 font-mono">{item.precio_venta ? formatCurrency(item.precio_venta) : 'Sin cambios'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800 font-mono">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-teal-50 border-t border-teal-200 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3.5 text-right text-teal-700">TOTAL PAGADO</td>
                    <td className="px-4 py-3.5 text-right text-teal-700 text-base font-mono">{formatCurrency(detailCompra.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {detailCompra.notas && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Notas Administrativas</span>
                <p className="text-xs text-slate-600 leading-relaxed">{detailCompra.notas}</p>
              </div>
            )}

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
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

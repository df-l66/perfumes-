import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Search, ShoppingCart, Trash2, XCircle,
  FileText, ChevronRight, CheckCircle2, Package, FileDown, Download,
  RotateCcw
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AlertBox } from '../components/ui/AlertBox';
import { PrepararTripleAaaModal } from '../components/ui/PrepararTripleAaaModal';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToCSV as downloadCSV } from '../utils/exportToCSV';
import type { Venta, VentaItem, Cliente } from '../types';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

// ── Nueva Venta Wizard ────────────────────────────────────────────────────────
type WizardStep = 'cliente' | 'productos' | 'confirmar';

function NuevaVentaModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { clientes, productos, addVenta, configuracion, materiasPrimas } = useAppData();
  const { user } = useAuth();

  const [step, setStep] = useState<WizardStep>('cliente');
  const [clienteId, setClienteId] = useState('');
  const [carrito, setCarrito] = useState<VentaItem[]>([]);
  const [tripleAaaModalOpen, setTripleAaaModalOpen] = useState(false);
  const [searchProd, setSearchProd] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState<'contado' | 'credito'>('contado');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('cliente');
    setClienteId('');
    setCarrito([]);
    setSearchProd('');
    setSearchCliente('');
    setMetodoPago('contado');
    setSuccess(false);
    setError(null);
  };

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen]);

  useEffect(() => {
    if (clienteId === 'walk-in' && metodoPago === 'credito') {
      setMetodoPago('contado');
    }
  }, [clienteId, metodoPago]);

  const productosDisponibles = useMemo(() =>
    productos.filter(p =>
      p.stock > 0 &&
      (p.nombre.toLowerCase().includes(searchProd.toLowerCase()) ||
       p.codigo.toLowerCase().includes(searchProd.toLowerCase()))
    ), [productos, searchProd]
  );

  const agregarProducto = (prod: typeof productos[0]) => {
    setCarrito(prev => {
      const existing = prev.find(i => i.producto_id === prod.id);
      if (existing) {
        return prev.map(i =>
          i.producto_id === prod.id
            ? { ...i, cantidad: Math.min(i.cantidad + 1, prod.stock), subtotal: (i.cantidad + 1) * prod.precio_venta }
            : i
        );
      }
      return [...prev, {
        producto_id: prod.id,
        nombre: prod.nombre,
        cantidad: 1,
        precio_unitario: prod.precio_venta,
        subtotal: prod.precio_venta,
      }];
    });
  };

  const agregarPreparado = (item: VentaItem) => {
    setCarrito(prev => [...prev, item]);
  };

  const cambiarCantidad = (prodId: string, cantidad: number, maxStock: number) => {
    if (cantidad < 1) return;
    const qty = Math.min(cantidad, maxStock);
    setCarrito(prev =>
      prev.map(i => i.producto_id === prodId
        ? { ...i, cantidad: qty, subtotal: qty * i.precio_unitario }
        : i
      )
    );
  };

  const quitarProducto = (prodId: string) =>
    setCarrito(prev => prev.filter(i => i.producto_id !== prodId));

  const total = carrito.reduce((s, i) => s + i.subtotal, 0);

  const WALK_IN_ID = 'walk-in';
  const clienteSeleccionado = clienteId === 'walk-in'
    ? { id: 'walk-in', nombre: 'Consumidor Final', tipo: 'persona' as const, documento: 'N/A', ciudad: 'N/A', email: '', telefono: '', direccion: '', fecha_registro: '', limite_credito: 0, credito_usado: 0 } as Cliente
    : clientes.find(c => c.id === clienteId);

  const handleConfirm = () => {
    if (!user) return;
    setError(null);

    if (!clienteId) {
      setError("Por favor selecciona un cliente para la venta.");
      return;
    }

    if (carrito.length === 0) {
      setError("El carrito está vacío. Debes agregar al menos un producto.");
      return;
    }

    for (const item of carrito) {
      if (item.es_preparado) continue; // No validamos stock de productos para los preparados (se validará materias primas en backend)
      const prod = productos.find(p => p.id === item.producto_id);
      if (prod && item.cantidad > prod.stock) {
        setError(`El producto "${item.nombre}" supera el stock disponible (${prod.stock}).`);
        return;
      }
    }

    if (metodoPago === 'credito' && clienteSeleccionado && clienteSeleccionado.id !== 'walk-in') {
      const limite = clienteSeleccionado.limite_credito || 0;
      const deuda = clienteSeleccionado.credito_usado || 0;
      if (deuda + total > limite && limite > 0) {
        setError(`El cliente no tiene suficiente límite de crédito disponible. (Límite: ${formatCurrency(limite)}, Deuda actual: ${formatCurrency(deuda)})`);
        return;
      }
    }

    addVenta(carrito, clienteId, user.id, user.name, user.role, metodoPago);
    setSuccess(true);
  };

  const clientesFiltrados = useMemo(() => {
    if (!searchCliente) return clientes;
    const q = searchCliente.toLowerCase();
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.documento.toLowerCase().includes(q) ||
      c.ciudad.toLowerCase().includes(q)
    );
  }, [clientes, searchCliente]);

  const stepLabels: Record<WizardStep, string> = {
    cliente: '1. Cliente',
    productos: '2. Productos',
    confirmar: '3. Confirmar',
  };
  const steps: WizardStep[] = ['cliente', 'productos', 'confirmar'];
  const currentIdx = steps.indexOf(step);

  return (
    <>
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva Venta" size="xl"
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
        <div className="flex flex-col items-center py-8 gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">¡Venta registrada!</p>
            <p className="text-sm text-slate-500 mt-1">El stock ha sido descontado correctamente.</p>
          </div>
          <Button onClick={reset} className="mt-4">Nueva Venta</Button>
        </div>
      ) : (
        <>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${i <= currentIdx ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                  {stepLabels[s]}
                </div>
                {i < steps.length - 1 && <ChevronRight size={14} className="text-slate-300" />}
              </React.Fragment>
            ))}
          </div>

          {/* Step: Cliente */}
          {step === 'cliente' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">Selecciona el cliente para esta venta:</p>
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchCliente}
                    onChange={e => setSearchCliente(e.target.value)}
                    placeholder="Buscar cliente por nombre, doc. o ciudad..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors bg-white"
                  />
                </div>
              </div>

              {/* Walk-in option */}
              <button
                onClick={() => setClienteId(WALK_IN_ID)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  clienteId === WALK_IN_ID
                    ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/10'
                    : 'border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${clienteId === WALK_IN_ID ? 'bg-teal-500' : 'bg-slate-100'}`}>
                  <span className={`text-xs font-bold ${clienteId === WALK_IN_ID ? 'text-white' : 'text-slate-500'}`}>
                    <ShoppingCart size={14} />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${clienteId === WALK_IN_ID ? 'text-teal-700' : 'text-slate-700'}`}>Cliente No Registrado</p>
                  <p className="text-xs text-slate-400">Venta sin identificación de cliente · No afecta cartera</p>
                </div>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-400 font-medium">o clientes registrados</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                {clientesFiltrados.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No se encontraron clientes con esa búsqueda.</p>
                ) : clientesFiltrados.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setClienteId(c.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      clienteId === c.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${clienteId === c.id ? 'bg-teal-500' : 'bg-slate-100'}`}>
                      <span className={`text-xs font-bold ${clienteId === c.id ? 'text-white' : 'text-slate-500'}`}>
                        {c.nombre[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${clienteId === c.id ? 'text-teal-700' : 'text-slate-700'}`}>{c.nombre}</p>
                      <p className="text-xs text-slate-400">{c.tipo === 'empresa' ? 'NIT' : 'CC'}: {c.documento} · {c.ciudad}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button disabled={!clienteId} onClick={() => setStep('productos')}>
                  Siguiente <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Productos */}
          {step === 'productos' && (
            <div className="space-y-4">
              <div className="flex justify-end mb-2">
                 <Button type="button" onClick={() => setTripleAaaModalOpen(true)} variant="secondary" size="sm" className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100">
                   Preparar Triple AAA
                 </Button>
              </div>
              <div className="flex gap-4">
                {/* Product picker */}
                <div className="flex-1 min-w-0">
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchProd}
                      onChange={e => setSearchProd(e.target.value)}
                      placeholder="Buscar producto…"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                    />
                  </div>
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {productosDisponibles.length === 0 ? (
                      <div className="py-6 text-center">
                        <Package size={24} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400">Sin resultados</p>
                      </div>
                    ) : productosDisponibles.map(p => (
                      <button
                        key={p.id}
                        onClick={() => agregarProducto(p)}
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
                            <p className="text-xs text-slate-400">{p.codigo} · stock: {p.stock} {p.mililitros ? `· ${p.mililitros}ml` : ''}</p>
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

                {/* Cart */}
                <div className="w-64 shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart size={14} className="text-slate-500" />
                    <span className="text-sm font-semibold text-slate-600">Carrito ({carrito.length})</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 min-h-32 max-h-64 overflow-y-auto">
                    {carrito.length === 0 ? (
                      <div className="py-8 text-center">
                        <ShoppingCart size={20} className="mx-auto text-slate-300 mb-1" />
                        <p className="text-xs text-slate-400">Carrito vacío</p>
                      </div>
                    ) : carrito.map(item => {
                      const prod = productos.find(p => p.id === item.producto_id)!;
                      return (
                        <div key={item.producto_id} className="p-2.5">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs font-medium text-slate-700 leading-tight">{item.nombre} {prod?.mililitros ? `(${prod.mililitros}ml)` : ''}</p>
                            <button onClick={() => quitarProducto(item.producto_id)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1, prod?.stock ?? 99)}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                              >−</button>
                              <span className="text-xs font-semibold text-slate-700 w-5 text-center">{item.cantidad}</span>
                              <button
                                onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1, prod?.stock ?? 99)}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                              >+</button>
                            </div>
                            <span className="text-xs font-bold text-teal-600">{formatCurrency(item.subtotal)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {carrito.length > 0 && (
                    <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Total</span>
                        <span className="text-base font-bold text-teal-600">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setStep('cliente')}>Atrás</Button>
                <Button disabled={carrito.length === 0} onClick={() => setStep('confirmar')}>
                  Revisar <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Confirmar */}
          {step === 'confirmar' && (
            <div className="space-y-4">
              <AlertBox type="note" title="Revisa antes de confirmar">
                Al confirmar se descuenta el stock de cada producto automáticamente.
              </AlertBox>

              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Cliente</span>
                  <span className="font-semibold text-slate-800">{clienteSeleccionado?.nombre}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Vendedor</span>
                  <span className="font-semibold text-slate-800">{user?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Fecha</span>
                  <span className="font-semibold text-slate-800">{new Date().toLocaleDateString('es-CO')}</span>
                </div>
              </div>

              {/* Método de Pago */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Método de Pago</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="metodoPago" 
                      value="contado" 
                      checked={metodoPago === 'contado'} 
                      onChange={() => setMetodoPago('contado')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-700">De Contado</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="metodoPago" 
                      value="credito" 
                      disabled={clienteId === 'walk-in'}
                      checked={metodoPago === 'credito'} 
                      onChange={() => setMetodoPago('credito')}
                      className="text-teal-600 focus:ring-teal-500 disabled:opacity-50"
                    />
                    <span className={`text-sm ${clienteId === 'walk-in' ? 'text-slate-400' : 'text-slate-700'}`}>A Crédito</span>
                  </label>
                </div>
                
                {metodoPago === 'credito' && clienteId === 'walk-in' && (
                  <p className="text-xs text-red-600 mt-1 font-medium">Debe seleccionar un cliente registrado para usar crédito.</p>
                )}
                
                {metodoPago === 'credito' && clienteId !== 'walk-in' && clienteSeleccionado && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-700 font-medium">Cupo Disponible:</span>
                      <span className="text-blue-700 font-bold">
                        {formatCurrency((clienteSeleccionado.limite_credito || 0) - (clienteSeleccionado.credito_usado || 0))}
                      </span>
                    </div>
                    {total > ((clienteSeleccionado.limite_credito || 0) - (clienteSeleccionado.credito_usado || 0)) && (
                      <p className="text-xs text-red-600 mt-2 font-medium">El cliente no tiene suficiente cupo para esta compra.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Producto</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Cant.</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">P. Unit.</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {carrito.map(item => (
                      <tr key={item.producto_id}>
                        <td className="px-4 py-2.5 text-slate-700 truncate max-w-0" title={item.nombre}>{item.nombre}</td>
                        <td className="px-4 py-2.5 text-center text-slate-600">{item.cantidad}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">{formatCurrency(item.precio_unitario)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr className="bg-teal-50 border-t-2 border-teal-200">
                      <td colSpan={3} className="px-4 py-2.5 text-right font-bold text-teal-700">TOTAL NETO</td>
                      <td className="px-4 py-2.5 text-right font-bold text-teal-700 text-base font-mono">{formatCurrency(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setStep('productos')}>Atrás</Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={
                    (metodoPago === 'credito' && clienteId === 'walk-in') || 
                    (metodoPago === 'credito' && clienteSeleccionado && total > ((clienteSeleccionado.limite_credito || 0) - (clienteSeleccionado.credito_usado || 0)))
                  }
                >
                  <CheckCircle2 size={15} />
                  Confirmar Venta
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      </Modal>
      <PrepararTripleAaaModal 
        isOpen={tripleAaaModalOpen} 
        onClose={() => setTripleAaaModalOpen(false)} 
        onAdd={agregarPreparado} 
      />
    </>
  );
}

// ── Main Ventas Page ──────────────────────────────────────────────────────────
export function Ventas() {
  const { ventas, anularVenta, configuracion } = useAppData();
  const { isAdmin, user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<Venta['estado'] | 'todos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailVenta, setDetailVenta] = useState<Venta | null>(null);
  const [anularConfirm, setAnularConfirm] = useState<Venta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filtered = useMemo(() => ventas.filter(v => {
    const matchSearch = v.factura.toLowerCase().includes(search.toLowerCase()) ||
      v.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
      v.vendedor_nombre.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'todos' || v.estado === filterEstado;
    return matchSearch && matchEstado;
  }), [ventas, search, filterEstado]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalVisibles = filtered.filter(v => v.estado === 'completada').reduce((s, v) => s + v.total, 0);

  const exportToCSV = () => {
    const headers = {
      factura: 'Factura',
      cliente_nombre: 'Cliente',
      vendedor_nombre: 'Vendedor',
      fecha: 'Fecha',
      total: 'Total Venta',
      estado: 'Estado',
      items_count: 'Cantidad Items'
    };

    const dataToExport = filtered.map(v => ({
      ...v,
      items_count: v.items.length
    }));

    downloadCSV(dataToExport, `Registro_Ventas_${new Date().toISOString().slice(0, 10)}`, headers);
  };

  const handleDownloadPDF = async (venta?: Venta) => {
    try {
      const v = venta || detailVenta;
      if (!v) return;

      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Header
      try {
        const response = await fetch('/logo.jpg');
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          pdf.addImage(base64, 'JPEG', 14, 12, 20, 20);
        }
      } catch (e) {
        console.warn('Could not load logo for PDF', e);
      }

      pdf.setFontSize(20);
      pdf.setTextColor(13, 148, 136); // Teal 600
      pdf.text(configuracion.nombre, 38, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // Slate 500
      pdf.text(`NIT: ${configuracion.nit}`, 38, 26);
      pdf.text(configuracion.direccion, 38, 31);
      pdf.text(`Tel: ${configuracion.telefono}`, 38, 36);

      // Invoice info
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42); // Slate 900
      pdf.text('FACTURA DE VENTA', pageWidth - 14, 22, { align: 'right' });
      pdf.setFontSize(14);
      pdf.setTextColor(13, 148, 136); // Teal 600
      pdf.text(v.factura, pageWidth - 14, 29, { align: 'right' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // Slate 500
      pdf.text(`Fecha: ${new Date(v.fecha).toLocaleDateString('es-CO')}`, pageWidth - 14, 35, { align: 'right' });
      pdf.text(`Estado: ${v.estado.toUpperCase()}`, pageWidth - 14, 40, { align: 'right' });
      pdf.setTextColor(17, 94, 89);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`MÉTODO DE PAGO: ${v.metodo_pago ? v.metodo_pago.toUpperCase() : 'CONTADO'}`, pageWidth - 14, 46, { align: 'right' });
      pdf.setFont('helvetica', 'normal');

      // Parties
      pdf.setFillColor(248, 250, 252); // Slate 50
      pdf.setDrawColor(226, 232, 240); // Slate 200
      pdf.rect(14, 52, pageWidth - 28, 20, 'FD');
      
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184); // Slate 400
      pdf.text('ADQUIRIENTE', 20, 59);
      pdf.text('CAJERO / VENDEDOR', pageWidth / 2, 59);
      
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59); // Slate 800
      pdf.text(v.cliente_nombre, 20, 66);
      pdf.text(v.vendedor_nombre, pageWidth / 2, 66);

      // Table
      const ivaFactor = 1 + (configuracion.iva_porcentaje / 100);
      const subtotalSinIva = v.total / ivaFactor;
      const ivaCalculado = v.total - subtotalSinIva;

      const tableData = v.items.map(item => [
        item.nombre,
        item.cantidad.toString(),
        formatCurrency(item.precio_unitario),
        formatCurrency(item.subtotal)
      ]);

      autoTable(pdf, {
        startY: 75,
        head: [['Descripción del Producto', 'Cant.', 'P. Unit.', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right', fontStyle: 'bold' }
        },
      });

      const finalY = (pdf as any).lastAutoTable.finalY + 10;

      // Totals
      pdf.setFontSize(12);
      pdf.setTextColor(17, 94, 89); // Teal 800
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL NETO:', pageWidth - 60, finalY + 5, { align: 'right' });
      pdf.text(formatCurrency(v.total), pageWidth - 14, finalY + 5, { align: 'right' });

      // Footer
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Detalle DIAN:', 14, finalY + 30);
      pdf.text(configuracion.resolucion, 14, finalY + 35);
      
      pdf.setFontSize(8);
      pdf.text(`Comprobante oficial generado por el sistema administrativo de inventarios de ${configuracion.nombre}.`, pageWidth / 2, finalY + 45, { align: 'center' });

      pdf.save(`Factura-${v.factura}.pdf`);
    } catch (err: any) {
      console.error('Error al generar PDF de venta:', err);
      alert('Error al generar PDF: ' + (err.message || err.toString()));
    }
  };

  return (
    <Layout
      title="Ventas"
      subtitle="Historial y gestión de ventas"
      action={<Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Nueva Venta</Button>}
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Buscar por factura, cliente o vendedor…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {(['todos', 'completada', 'pendiente', 'anulada'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setFilterEstado(s); setCurrentPage(1); }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                filterEstado === s
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <Button variant="secondary" size="sm" icon={<FileDown size={14} />} onClick={exportToCSV}>
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="mb-4 text-sm text-slate-500">
          Total completadas en filtro: <span className="font-bold text-teal-600">{formatCurrency(totalVisibles)}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Factura', 'Cliente', 'Vendedor', 'Fecha', 'Ítems', 'Total', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <ShoppingCart size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-400 text-sm">No se encontraron ventas</p>
                  </td>
                </tr>
              ) : paginated.map(v => (
                <tr key={v.id} className={`hover:bg-slate-50/60 transition-colors ${v.estado === 'anulada' ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-3.5 font-mono text-xs text-teal-600 font-semibold">{v.factura}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{v.cliente_nombre}</td>
                  <td className="px-5 py-3.5 text-slate-600">{v.vendedor_nombre}</td>
                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{new Date(v.fecha).toLocaleDateString('es-CO')}</td>
                  <td className="px-5 py-3.5 text-slate-500">{v.items.length} ítem(s)</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{formatCurrency(v.total)}</td>
                  <td className="px-5 py-3.5"><Badge variant={v.estado} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailVenta(v)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                        title="Ver detalle"
                      >
                        <FileText size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(v);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                        title="Descargar comprobante"
                      >
                        <Download size={14} />
                      </button>
                      {isAdmin && v.estado !== 'anulada' && (
                        <button
                          onClick={() => setAnularConfirm(v)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Anular venta"
                        >
                          <XCircle size={14} />
                        </button>
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
                Mostrando <strong className="text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> al <strong className="text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</strong> de <strong className="text-slate-700">{filtered.length}</strong> ventas
              </span>
            ) : (
              <span>0 ventas registradas</span>
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

      {/* Nueva Venta Modal */}
      <NuevaVentaModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Detail Modal */}
      <Modal isOpen={!!detailVenta} onClose={() => setDetailVenta(null)} title={`Factura — ${detailVenta?.factura}`} size="xl">
        {detailVenta && (() => {
          const ivaFactor = 1 + (configuracion.iva_porcentaje / 100);
          const subtotalSinIva = detailVenta.total / ivaFactor;
          const ivaCalculado = detailVenta.total - subtotalSinIva;

          return (
            <div className="space-y-6">
              {/* Printable Invoice Container */}
              <div id="printable-invoice" className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 print:border-0 print:p-0 print:shadow-none">
                
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-4">
                    <img src="/logo.jpg" alt="Logo" className="w-16 h-16 object-contain print:w-16 print:h-16 rounded-md" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-800 text-lg leading-tight">{configuracion.nombre}</h3>
                      <p className="text-xs text-slate-500 font-medium">NIT: {configuracion.nit}</p>
                      <p className="text-xs text-slate-400">{configuracion.direccion}</p>
                      <p className="text-xs text-slate-400">Tel: {configuracion.telefono}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right space-y-1 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Factura de Venta</span>
                    <h4 className="text-xl font-mono font-bold text-teal-600">{detailVenta.factura}</h4>
                    <p className="text-xs text-slate-500">Fecha: {new Date(detailVenta.fecha).toLocaleDateString('es-CO')}</p>
                    <Badge variant={detailVenta.estado} className="mt-1" />
                  </div>
                </div>

                {/* Cliente / Vendedor Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 print:bg-white print:border-slate-200">
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-wider">Adquiriente</p>
                    <p className="font-bold text-slate-800 mt-1">{detailVenta.cliente_nombre}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-wider">Cajero / Vendedor</p>
                    <p className="font-bold text-slate-800 mt-1">{detailVenta.vendedor_nombre}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="rounded-lg border border-slate-200 overflow-hidden print:border-slate-300">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-bold text-slate-600">Descripción del Producto</th>
                        <th className="px-4 py-2.5 text-center font-bold text-slate-600">Cant.</th>
                        <th className="px-4 py-2.5 text-right font-bold text-slate-600">P. Unit.</th>
                        <th className="px-4 py-2.5 text-right font-bold text-slate-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailVenta.items.map(item => (
                        <tr key={item.producto_id} className="hover:bg-slate-50/20">
                          <td className="px-4 py-2.5 text-slate-700 font-medium truncate max-w-0" title={item.nombre}>{item.nombre}</td>
                          <td className="px-4 py-2.5 text-center text-slate-600 font-mono">{item.cantidad}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600 font-mono">{formatCurrency(item.precio_unitario)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-800 font-mono">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50/50 print:bg-slate-50">

                      <tr className="bg-teal-50/50 border-t border-teal-100 print:bg-teal-50">
                        <td colSpan={3} className="px-4 py-3 text-right font-extrabold text-teal-800 text-sm">TOTAL NETO</td>
                        <td className="px-4 py-3 text-right font-extrabold text-teal-800 text-sm font-mono">{formatCurrency(detailVenta.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Resolution Footnote */}
                <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 leading-normal">
                  <p className="font-medium">Detalle DIAN:</p>
                  <p className="mt-0.5">{configuracion.resolucion}</p>
                </div>
              </div>

              {/* Detail Buttons (Hidden on Print) */}
              <div className="flex justify-between items-center gap-3 pt-2 border-t border-slate-100 print:hidden">
                <Button variant="primary" icon={<Download size={15} />} onClick={() => handleDownloadPDF()}>
                  Descargar Comprobante
                </Button>
                <Button variant="ghost" onClick={() => setDetailVenta(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Anular Confirm */}
      <Modal isOpen={!!anularConfirm} onClose={() => setAnularConfirm(null)} title="Anular Venta" size="sm">
        <AlertBox type="warning" title="Anular venta">
          ¿Anular la venta <strong>{anularConfirm?.factura}</strong> de {formatCurrency(anularConfirm?.total ?? 0)}?
          Esta acción no restaura el stock automáticamente.
        </AlertBox>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setAnularConfirm(null)}>Cancelar</Button>
          <Button variant="warning" onClick={() => { anularVenta(anularConfirm!.id, user?.name || 'Usuario', user?.id || '', user?.role || 'admin'); setAnularConfirm(null); }}>
            Sí, Anular Venta
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}

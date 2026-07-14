import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Package, Users, AlertTriangle, ShoppingCart, Activity,
  DollarSign, Award, Wallet, FileDown
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { AlertBox } from '../components/ui/AlertBox';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { exportToCSV as downloadCSV } from '../utils/exportToCSV';

function KpiCard({ title, value, subtitle, icon, trend, color, delayClass = '' }: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  color: string;
  delayClass?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-teal-100 transition-all duration-300 group cursor-pointer ${delayClass}`}>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full">
            <Activity size={10} className="animate-pulse" />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-5">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-teal-500 transition-colors" />
          {subtitle}
        </p>
      </div>
    </div>
  );
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-xs font-semibold text-slate-600 mb-1">{label}</p>
        <p className="text-sm font-bold text-teal-600">{formatCurrency(payload[0].value)}</p>
        <p className="text-xs text-slate-400">{payload[1]?.value ?? 0} venta(s)</p>
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const { productos, ventas, clientes, logs, compras, gastos, materiasPrimas } = useAppData();
  const { user } = useAuth();

  const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [startDate, setStartDate] = useState(getLocalDate());
  const [endDate, setEndDate] = useState(getLocalDate());

  // Convierte fecha UTC a YYYY-MM-DD en la zona horaria local
  const getLocalIsoDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const productosStockBajo = productos.filter(p => p.estado === 'stock_bajo' || p.stock <= p.stock_minimo);
  
  // Rango de fechas
  const isBetweenDates = (dateStr: string) => {
    const dateOnly = getLocalIsoDate(dateStr);
    return dateOnly >= startDate && dateOnly <= endDate;
  };

  const ventasCompletadas = ventas.filter(v => (v.estado === 'completada' || (v.estado === 'pendiente' && v.metodo_pago !== 'credito')) && isBetweenDates(v.fecha));
  const comprasFiltradas = compras.filter(c => c.estado === 'completada' && isBetweenDates(c.fecha));
  const gastosFiltrados = gastos.filter(g => isBetweenDates(g.fecha));
  
  // El crédito pendiente es global y refleja la deuda total actual de los clientes
  const clientesConDeuda = clientes.filter(c => c.credito_usado && c.credito_usado > 0);
  const totalCreditoPendiente = clientes.reduce((sum, c) => sum + (c.credito_usado || 0), 0);

  // ── CÁLCULOS FINANCIEROS Y DE NEGOCIO REAL ─────────────────────────────────
  const totalVentas = ventasCompletadas.reduce((s, v) => s + v.total, 0);

  // Costo de Ventas Real (COGS - Cost of Goods Sold)
  const costoVentas = ventasCompletadas.reduce((sum, v) => {
    return sum + v.items.reduce((itemSum, item) => {
      if (item.es_preparado && item.receta) {
        return itemSum + item.receta.reduce((rSum, r) => {
          const mp = materiasPrimas.find(m => m.id === r.materia_prima_id);
          return rSum + (r.cantidad * (mp?.costo_unitario || 0));
        }, 0);
      }
      const p = productos.find(prod => prod.id === item.producto_id);
      return itemSum + (item.cantidad * (p?.precio_costo || 0));
    }, 0);
  }, 0);

  // Pagado a proveedores (Compras de inventario - Flujo de Caja)
  const costoTotalCompras = comprasFiltradas.reduce((sum, c) => sum + c.total, 0);

  // Gastos Operativos y de Caja
  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + g.monto, 0);

  // Ganancias (Margen Neto Real de la Operación)
  const gananciaTotal = totalVentas - costoVentas - totalGastos;

  // ── CHART DATA (Dinámico basado en el rango) ──────────────────────────────
  const chartDataMap: Record<string, { fecha: string; total: number; cantidad: number }> = {};
  
  const curDate = new Date(`${startDate}T12:00:00`);
  const enDate = new Date(`${endDate}T12:00:00`);
  let daysCount = 0;
  
  // Fill range with 0s (max 31 days to avoid memory issues)
  while (curDate <= enDate && daysCount <= 31) {
    const isoDate = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}-${String(curDate.getDate()).padStart(2, '0')}`;
    const shortDate = curDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    chartDataMap[isoDate] = { fecha: shortDate, total: 0, cantidad: 0 };
    curDate.setDate(curDate.getDate() + 1);
    daysCount++;
  }

  ventasCompletadas.forEach(v => {
    const isoDate = getLocalIsoDate(v.fecha);
    if (chartDataMap[isoDate]) {
      chartDataMap[isoDate].total += v.total;
      chartDataMap[isoDate].cantidad += 1;
    } else {
      const d = new Date(`${isoDate}T12:00:00`);
      chartDataMap[isoDate] = { 
        fecha: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }), 
        total: v.total, 
        cantidad: 1 
      };
    }
  });

  const chartData = Object.keys(chartDataMap).sort().map(k => chartDataMap[k]);

  // Producto más vendido
  const ventasPorProducto: Record<string, { nombre: string; cantidad: number; codigo: string }> = {};
  ventasCompletadas.forEach(v => {
    v.items.forEach(item => {
      const prod = productos.find(p => p.id === item.producto_id);
      const codigo = prod ? prod.codigo : 'N/A';
      if (!ventasPorProducto[item.producto_id]) {
        ventasPorProducto[item.producto_id] = { nombre: item.nombre, cantidad: 0, codigo };
      }
      ventasPorProducto[item.producto_id].cantidad += item.cantidad;
    });
  });
  let productoMasVendido = { nombre: 'Ninguno', cantidad: 0, codigo: 'N/A' };
  Object.values(ventasPorProducto).forEach(p => {
    if (p.cantidad > productoMasVendido.cantidad) {
      productoMasVendido = p;
    }
  });

  // Vendedor estrella (más ventas en COP)
  const ventasPorVendedor: Record<string, { nombre: string; total: number; cantidad: number }> = {};
  ventasCompletadas.forEach(v => {
    if (!ventasPorVendedor[v.vendedor_id]) {
      ventasPorVendedor[v.vendedor_id] = { nombre: v.vendedor_nombre, total: 0, cantidad: 0 };
    }
    ventasPorVendedor[v.vendedor_id].total += v.total;
    ventasPorVendedor[v.vendedor_id].cantidad += 1;
  });
  let vendedorEstrella = { nombre: 'Ninguno', total: 0, cantidad: 0 };
  Object.values(ventasPorVendedor).forEach(v => {
    if (v.total > vendedorEstrella.total) {
      vendedorEstrella = v;
    }
  });

  const exportReporte = () => {
    const headers = {
      rango: 'Rango de Fechas',
      ingresos: 'Ingresos Totales (Ventas)',
      costos_ventas: 'Costo de Ventas (Mercancía Entregada)',
      inversion_inventario: 'Inversión en Inventario (Compras)',
      gastos: 'Gastos Operativos',
      ganancia: 'Ganancia Neta Operativa'
    };

    const data = [{
      rango: `${startDate} al ${endDate}`,
      ingresos: totalVentas,
      costos_ventas: costoVentas,
      inversion_inventario: costoTotalCompras,
      gastos: totalGastos,
      ganancia: gananciaTotal
    }];

    downloadCSV(data, `Reporte_Financiero_${startDate}_al_${endDate}`, headers);
  };

  return (
    <Layout
      title="Panel de Control"
      subtitle={`Bienvenido — Mostrando datos desde ${startDate} hasta ${endDate}`}
      action={
        <Button variant="secondary" onClick={exportReporte} icon={<FileDown size={14} />}>
          Exportar Excel
        </Button>
      }
    >
      {/* Date Filter */}
      <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-xl border border-slate-200 w-max shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Desde</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border-none bg-slate-50 px-2 py-1 rounded outline-none focus:ring-2 focus:ring-teal-500/50" />
        </div>
        <div className="text-slate-300">-</div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Hasta</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border-none bg-slate-50 px-2 py-1 rounded outline-none focus:ring-2 focus:ring-teal-500/50" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
        <KpiCard
          title="Ventas Reales (Pagadas)"
          value={formatCurrency(totalVentas)}
          subtitle={`${ventasCompletadas.length} transacciones concretadas`}
          icon={<TrendingUp size={22} className="text-teal-600 animate-pulse" />}
          trend="+12% mes"
          color="bg-teal-50"
          delayClass="animate-fade-in-up"
        />
        <KpiCard
          title="Por Cobrar (Crédito)"
          value={formatCurrency(totalCreditoPendiente)}
          subtitle={`${clientesConDeuda.length} cliente(s) con deuda pendiente`}
          icon={<Wallet size={22} className="text-indigo-600" />}
          color="bg-indigo-50"
          delayClass="animate-fade-in-up animation-delay-75"
        />
        <KpiCard
          title="Costo de Ventas"
          value={formatCurrency(costoVentas)}
          subtitle="Costo real de los productos vendidos"
          icon={<ShoppingCart size={22} className="text-amber-600" />}
          color="bg-amber-50"
          delayClass="animate-fade-in-up animation-delay-100"
        />
        <KpiCard
          title="Ganancia Neta Operativa"
          value={formatCurrency(gananciaTotal)}
          subtitle={gananciaTotal < 0 ? 'Pérdidas operativas' : 'Beneficio real (Ventas - Costos - Gastos)'}
          icon={<Award size={22} className={gananciaTotal < 0 ? 'text-red-600' : 'text-emerald-600'} />}
          color={gananciaTotal < 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50'}
          delayClass="animate-fade-in-up animation-delay-200"
        />
        <KpiCard
          title="Inversión en Inventario"
          value={formatCurrency(costoTotalCompras)}
          subtitle="Dinero gastado comprando a proveedores"
          icon={<DollarSign size={22} className="text-blue-600" />}
          color="bg-blue-50"
          delayClass="animate-fade-in-up animation-delay-300"
        />
        <KpiCard
          title="Stock Crítico"
          value={productosStockBajo.length}
          subtitle={productosStockBajo.length > 0 ? "¡Requiere reabastecimiento!" : "Inventario óptimo"}
          icon={
            <div className="relative">
              <AlertTriangle size={22} className={productosStockBajo.length > 0 ? "text-red-600" : "text-amber-600"} />
              {productosStockBajo.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </div>
          }
          color={productosStockBajo.length > 0 ? "bg-red-50/80 border border-red-100" : "bg-amber-50"}
          delayClass="animate-fade-in-up animation-delay-300"
        />
      </div>

      {/* Sales Chart + Recent Sales */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Ventas Diarias</h2>
              <p className="text-xs text-slate-400 mt-0.5">Últimos 14 días</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-xs text-slate-500">Ingresos (COP)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={v => v === 0 ? '' : `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={2.5} fill="url(#salesGrad)" dot={{ r: 4, fill: '#0d9488', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#0d9488' }} />
              <Area type="monotone" dataKey="cantidad" stroke="transparent" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right Sidebar: Performance Leaders & Recent Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col space-y-6">
          
          {/* Section 1: Performance Leaders */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Award size={16} className="text-teal-600 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-800">Líderes de Desempeño</h2>
            </div>
            
            <div className="space-y-3">
              {/* Top Seller */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  ★
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Vendedor Estrella</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{vendedorEstrella.nombre}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Facturado: {formatCurrency(vendedorEstrella.total)} · {vendedorEstrella.cantidad} ventas</p>
                </div>
              </div>

              {/* Most Sold Product */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Producto Más Vendido</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{productoMasVendido.nombre}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{productoMasVendido.codigo} · {productoMasVendido.cantidad} unidades vendidas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Recent Sales */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart size={15} className="text-slate-400" />
                <h2 className="text-sm font-bold text-slate-800">Ventas Recientes</h2>
              </div>
            </div>
            <div className="space-y-2.5">
              {ventas.slice(0, 4).map(v => (
                <div key={v.id} className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{v.cliente_nombre}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{v.factura} · {v.fecha}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-800">{formatCurrency(v.total)}</p>
                    <Badge variant={v.estado} className="scale-90 mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom panels: Low Stock & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Low Stock Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle size={15} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Alertas de Inventario</h2>
                <p className="text-[10px] text-slate-400">Productos críticos bajo el mínimo</p>
              </div>
            </div>
            {productosStockBajo.length > 0 && (
              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {productosStockBajo.length} producto(s)
              </span>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-75 pr-1">
            {productosStockBajo.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <p className="font-medium text-emerald-600">✓ Todos los stocks están en niveles óptimos</p>
              </div>
            ) : productosStockBajo.map(p => {
              const porcentaje = p.stock_minimo > 0 ? Math.min((p.stock / p.stock_minimo) * 100, 100) : 100;
              const esCritico = p.stock === 0;

              return (
                <div key={p.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all duration-200">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="font-semibold text-slate-800 text-xs truncate max-w-42.5">{p.nombre}</span>
                    <Badge variant={esCritico ? 'inactivo' : 'stock_bajo'} className="scale-90" />
                  </div>
                  <div className="space-y-1.5 text-[10px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Stock: <strong>{p.stock}</strong> / Mínimo: {p.stock_minimo}</span>
                      <span>{porcentaje.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${porcentaje}%` }}
                        className={`h-full rounded-full ${esCritico ? 'bg-red-500' : 'bg-amber-500'}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Log Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Activity size={15} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Bitácora de Auditoría</h2>
                <p className="text-[10px] text-slate-400">Historial reciente de actividades</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-75 pr-1">
            {logs.slice(0, 6).map(log => (
              <div key={log.id} className="p-3 rounded-lg bg-slate-50/50 border border-slate-100 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-700 truncate">{log.usuario_nombre} ({log.rol})</span>
                    <span className="text-[9px] text-slate-400 shrink-0">{log.fecha}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">{log.accion}</p>
                  <span className="inline-block text-[9px] font-semibold text-teal-600 bg-teal-50 border border-teal-100/50 px-1.5 py-0.2 rounded-md mt-1 uppercase tracking-wider">
                    {log.modulo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}

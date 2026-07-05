import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Producto, Proveedor, Cliente, Venta, VentaItem, ActivityLog, CompanyConfig, Compra, CompraItem } from '../types';
import {
  mockProductos,
  mockProveedores,
  mockClientes,
  mockVentas,
  mockCompras
} from '../data/mockData';

interface AppDataContextType {
  // Productos
  productos: Producto[];
  addProducto: (p: Omit<Producto, 'id'>, autorNombre: string, autorRol: string) => void;
  updateProducto: (p: Producto, autorNombre: string, autorRol: string) => void;
  deleteProducto: (id: string, autorNombre: string, autorRol: string) => void;
  // Proveedores
  proveedores: Proveedor[];
  addProveedor: (p: Omit<Proveedor, 'id'>, autorNombre: string, autorRol: string) => void;
  updateProveedor: (p: Proveedor, autorNombre: string, autorRol: string) => void;
  deleteProveedor: (id: string, autorNombre: string, autorRol: string) => void;
  // Clientes
  clientes: Cliente[];
  addCliente: (c: Omit<Cliente, 'id'>, autorNombre: string, autorRol: string) => void;
  updateCliente: (c: Cliente, autorNombre: string, autorRol: string) => void;
  deleteCliente: (id: string, autorNombre: string, autorRol: string) => void;
  // Ventas
  ventas: Venta[];
  addVenta: (items: VentaItem[], clienteId: string, vendedorId: string, vendedorNombre: string, vendedorRol: string) => void;
  anularVenta: (id: string, autorNombre: string, autorRol: string) => void;
  // Compras
  compras: Compra[];
  addCompra: (items: CompraItem[], proveedorId: string, compradorId: string, compradorNombre: string, compradorRol: string, notas?: string) => void;
  anularCompra: (id: string, autorNombre: string, autorRol: string) => void;
  // Logs de Auditoría
  logs: ActivityLog[];
  addLog: (accion: string, modulo: ActivityLog['modulo'], autorNombre: string, autorRol: string) => void;
  // Configuración de la Empresa
  configuracion: CompanyConfig;
  updateConfiguracion: (config: CompanyConfig, autorNombre: string, autorRol: string) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

let nextId = 100;
const genId = (prefix: string) => `${prefix}${++nextId}`;

const initialLogs: ActivityLog[] = [
  { id: 'l1', usuario_nombre: 'Admin Sistema', rol: 'admin', accion: 'Sistema inicializado correctamente', fecha: '2025-06-30 08:00', modulo: 'configuracion' },
  { id: 'l2', usuario_nombre: 'Laura Gómez', rol: 'vendedor', accion: 'Registró venta FAC-2024-0015', fecha: '2025-06-30 17:35', modulo: 'ventas' },
  { id: 'l3', usuario_nombre: 'Admin Sistema', rol: 'admin', accion: 'Actualizó stock mínimo de Bleu de Chanel EDP', fecha: '2025-07-01 10:12', modulo: 'productos' },
  { id: 'l4', usuario_nombre: 'Laura Gómez', rol: 'vendedor', accion: 'Registró nuevo cliente Importadora Perfumes S.A.', fecha: '2025-07-01 11:45', modulo: 'clientes' },
  { id: 'l5', usuario_nombre: 'Admin Sistema', rol: 'admin', accion: 'Modificó datos del proveedor Fragancias del Mundo S.A.S.', fecha: '2025-07-02 14:22', modulo: 'proveedores' },
];

const initialConfig: CompanyConfig = {
  nombre: 'La Maison du Parfum S.A.S.',
  nit: '901.456.789-2',
  direccion: 'Av. Cra 15 # 82-35, Bogotá, Colombia',
  telefono: '+57 (601) 520-4000',
  iva_porcentaje: 19,
  resolucion: 'Resolución DIAN No. 18764000012345 de 2025-01-10 autoriza rango FAC-2025-0001 al FAC-2025-9999',
  giro: 'perfumeria',
};

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>(mockProductos);
  const [proveedores, setProveedores] = useState<Proveedor[]>(mockProveedores);
  const [clientes, setClientes] = useState<Cliente[]>(mockClientes);
  const [ventas, setVentas] = useState<Venta[]>(mockVentas);
  const [compras, setCompras] = useState<Compra[]>(mockCompras);
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [configuracion, setConfiguracion] = useState<CompanyConfig>(initialConfig);

  // Helper para insertar logs de auditoría
  const addLog = (accion: string, modulo: ActivityLog['modulo'], autorNombre: string, autorRol: string) => {
    const nuevoLog: ActivityLog = {
      id: genId('l'),
      usuario_nombre: autorNombre,
      rol: autorRol,
      accion,
      fecha: new Date().toISOString().slice(0, 16).replace('T', ' '),
      modulo,
    };
    setLogs(prev => [nuevoLog, ...prev]);
  };

  // ── Productos ──────────────────────────────────────────────────────────────
  const addProducto = (p: Omit<Producto, 'id'>, autorNombre: string, autorRol: string) => {
    const id = genId('p');
    setProductos(prev => [...prev, { ...p, id }]);
    addLog(`Creó el producto "${p.nombre}" con código ${p.codigo}`, 'productos', autorNombre, autorRol);
  };
  const updateProducto = (p: Producto, autorNombre: string, autorRol: string) => {
    setProductos(prev => prev.map(x => x.id === p.id ? p : x));
    addLog(`Modificó el producto "${p.nombre}" (${p.codigo})`, 'productos', autorNombre, autorRol);
  };
  const deleteProducto = (id: string, autorNombre: string, autorRol: string) => {
    const prod = productos.find(x => x.id === id);
    setProductos(prev => prev.filter(x => x.id !== id));
    if (prod) addLog(`Eliminó el producto "${prod.nombre}" (${prod.codigo})`, 'productos', autorNombre, autorRol);
  };
  const addCompra = (
    items: CompraItem[],
    proveedorId: string,
    compradorId: string,
    compradorNombre: string,
    compradorRol: string,
    notas?: string
  ) => {
    const prov = proveedores.find(p => p.id === proveedorId);
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    const facturaNum = `COM-2025-${String(compras.length + 1).padStart(4, '0')}`;

    const newCompra: Compra = {
      id: genId('com'),
      factura_compra: facturaNum,
      proveedor_id: proveedorId,
      proveedor_nombre: prov?.nombre ?? 'Desconocido',
      fecha: new Date().toISOString().slice(0, 10),
      items,
      total,
      estado: 'completada',
      comprador_id: compradorId,
      comprador_nombre: compradorNombre,
      notas
    };

    setCompras(prev => [newCompra, ...prev]);

    // Incrementar stock y actualizar precio de costo de productos
    setProductos(prev =>
      prev.map(p => {
        const item = items.find(i => i.producto_id === p.id);
        if (!item) return p;
        const nuevoStock = p.stock + item.cantidad;
        return {
          ...p,
          stock: nuevoStock,
          precio_costo: item.precio_costo,
          precio_venta: item.precio_venta !== undefined && item.precio_venta > 0 ? item.precio_venta : p.precio_venta,
          estado: nuevoStock === 0 ? 'inactivo' : nuevoStock <= p.stock_minimo ? 'stock_bajo' : 'activo'
        };
      })
    );

    addLog(
      `Registró compra ${facturaNum} al proveedor "${prov?.nombre || 'Desconocido'}" por total de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total)}`,
      'compras',
      compradorNombre,
      compradorRol
    );
  };

  const anularCompra = (id: string, autorNombre: string, autorRol: string) => {
    const cmp = compras.find(x => x.id === id);
    if (!cmp) return;

    setCompras(prev =>
      prev.map(c => c.id === id ? { ...c, estado: 'anulada' } : c)
    );

    // Revertir el stock (restar los productos que habían ingresado)
    setProductos(prev =>
      prev.map(p => {
        const item = cmp.items.find(i => i.producto_id === p.id);
        if (!item) return p;
        const nuevoStock = Math.max(0, p.stock - item.cantidad);
        return {
          ...p,
          stock: nuevoStock,
          estado: nuevoStock === 0 ? 'inactivo' : nuevoStock <= p.stock_minimo ? 'stock_bajo' : 'activo'
        };
      })
    );

    addLog(`Anuló la compra de la factura ${cmp.factura_compra}`, 'compras', autorNombre, autorRol);
  };

  // ── Proveedores ───────────────────────────────────────────────────────────
  const addProveedor = (p: Omit<Proveedor, 'id'>, autorNombre: string, autorRol: string) => {
    setProveedores(prev => [...prev, { ...p, id: genId('pv') }]);
    addLog(`Registró al proveedor "${p.nombre}" con NIT ${p.nit}`, 'proveedores', autorNombre, autorRol);
  };
  const updateProveedor = (p: Proveedor, autorNombre: string, autorRol: string) => {
    setProveedores(prev => prev.map(x => x.id === p.id ? p : x));
    addLog(`Actualizó datos del proveedor "${p.nombre}"`, 'proveedores', autorNombre, autorRol);
  };
  const deleteProveedor = (id: string, autorNombre: string, autorRol: string) => {
    const prov = proveedores.find(x => x.id === id);
    setProveedores(prev => prev.filter(x => x.id !== id));
    if (prov) addLog(`Eliminó al proveedor "${prov.nombre}"`, 'proveedores', autorNombre, autorRol);
  };

  // ── Clientes ──────────────────────────────────────────────────────────────
  const addCliente = (c: Omit<Cliente, 'id'>, autorNombre: string, autorRol: string) => {
    setClientes(prev => [...prev, { ...c, id: genId('c') }]);
    addLog(`Registró al cliente "${c.nombre}"`, 'clientes', autorNombre, autorRol);
  };
  const updateCliente = (c: Cliente, autorNombre: string, autorRol: string) => {
    setClientes(prev => prev.map(x => x.id === c.id ? c : x));
    addLog(`Actualizó datos del cliente "${c.nombre}"`, 'clientes', autorNombre, autorRol);
  };
  const deleteCliente = (id: string, autorNombre: string, autorRol: string) => {
    const cl = clientes.find(x => x.id === id);
    setClientes(prev => prev.filter(x => x.id !== id));
    if (cl) addLog(`Eliminó al cliente "${cl.nombre}"`, 'clientes', autorNombre, autorRol);
  };

  // ── Ventas ────────────────────────────────────────────────────────────────
  const addVenta = (
    items: VentaItem[],
    clienteId: string,
    vendedorId: string,
    vendedorNombre: string,
    vendedorRol: string
  ) => {
    const cliente = clientes.find(c => c.id === clienteId);
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    const facturaNum = `FAC-2025-${String(ventas.length + 1).padStart(4, '0')}`;
    
    const newVenta: Venta = {
      id: genId('v'),
      factura: facturaNum,
      cliente_id: clienteId,
      cliente_nombre: cliente?.nombre ?? 'Desconocido',
      vendedor_id: vendedorId,
      vendedor_nombre: vendedorNombre,
      fecha: new Date().toISOString().slice(0, 10),
      items,
      total,
      estado: 'completada',
    };
    
    setVentas(prev => [newVenta, ...prev]);
    
    // Descontar stock
    setProductos(prev =>
      prev.map(p => {
        const item = items.find(i => i.producto_id === p.id);
        if (!item) return p;
        const newStock = Math.max(0, p.stock - item.cantidad);
        return {
          ...p,
          stock: newStock,
          estado: newStock === 0 ? 'inactivo' : newStock <= p.stock_minimo ? 'stock_bajo' : p.estado,
        };
      })
    );

    addLog(`Registró la venta ${facturaNum} por un total de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total)}`, 'ventas', vendedorNombre, vendedorRol);
  };

  const anularVenta = (id: string, autorNombre: string, autorRol: string) => {
    const vnt = ventas.find(x => x.id === id);
    setVentas(prev =>
      prev.map(v => v.id === id ? { ...v, estado: 'anulada' } : v)
    );
    if (vnt) addLog(`Anuló la venta de la factura ${vnt.factura}`, 'ventas', autorNombre, autorRol);
  };

  // ── Configuración de la Empresa ───────────────────────────────────────────
  const updateConfiguracion = (config: CompanyConfig, autorNombre: string, autorRol: string) => {
    setConfiguracion(config);
    addLog('Actualizó los datos y parámetros tributarios de la empresa', 'configuracion', autorNombre, autorRol);
  };

  return (
    <AppDataContext.Provider value={{
      productos, addProducto, updateProducto, deleteProducto,
      proveedores, addProveedor, updateProveedor, deleteProveedor,
      clientes, addCliente, updateCliente, deleteCliente,
      ventas, addVenta, anularVenta,
      compras, addCompra, anularCompra,
      logs, addLog,
      configuracion, updateConfiguracion
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}

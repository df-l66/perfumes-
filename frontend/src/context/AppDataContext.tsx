import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Producto, Proveedor, Cliente, Venta, VentaItem, ActivityLog, CompanyConfig, Compra, CompraItem, Abono, Gasto, MovimientoKardex, MovimientoTipo, MateriaPrima, MovimientoMateriaPrima } from '../types';
import {
  mockVentas,
  mockCompras
} from '../data/mockData';
import { fetchProductos, fetchCreateProducto, fetchUpdateProducto, fetchDeleteProducto } from '../api/productos';
import { fetchProveedores, fetchCreateProveedor, fetchUpdateProveedor, fetchDeleteProveedor } from '../api/proveedores';
import { fetchClientes, fetchCreateCliente, fetchUpdateCliente, fetchDeleteCliente } from '../api/clientes';
import { fetchVentas, fetchCreateVenta, fetchAnularVenta } from '../api/ventas';
import { fetchCompras, fetchCreateCompra, fetchAnularCompra } from '../api/compras';
import { fetchKardex, fetchRegistrarAjusteKardex } from '../api/kardex';
import { fetchGastos, fetchCreateGasto } from '../api/gastos';
import { fetchAbonos, fetchCreateAbono } from '../api/abonos';
import { fetchConfig, fetchUpdateConfig } from '../api/config';
import { fetchCreateUser, fetchUsers, fetchUpdateUser } from '../api/auth';
import { fetchLogs, fetchCreateLog } from '../api/logs';
import { fetchMateriasPrimas, fetchCreateMateriaPrima, fetchUpdateMateriaPrima, fetchDeleteMateriaPrima, fetchMovimientosMateriasPrimas, fetchRegistrarMovimientoMateriaPrima } from '../api/materiasPrimas';
import { useAuth } from './AuthContext';

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
  // Abonos
  abonos: Abono[];
  addAbono: (a: Omit<Abono, 'id'>, autorNombre: string, autorId: string, autorRol: string) => void;
  // Ventas
  ventas: Venta[];
  addVenta: (items: VentaItem[], clienteId: string, vendedorId: string, vendedorNombre: string, vendedorRol: string, metodoPago?: 'contado' | 'credito') => void;
  anularVenta: (id: string, autorNombre: string, autorId: string, autorRol: string) => void;
  // Compras
  compras: Compra[];
  addCompra: (items: CompraItem[], proveedorId: string, compradorId: string, compradorNombre: string, compradorRol: string, notas?: string) => void;
  anularCompra: (id: string, autorNombre: string, autorId: string, autorRol: string) => void;
  // Logs de Auditoría
  logs: ActivityLog[];
  addLog: (accion: string, modulo: ActivityLog['modulo'], autorNombre: string, autorRol: string) => void;
  // Configuración de la Empresa
  configuracion: CompanyConfig;
  updateConfiguracion: (config: CompanyConfig, autorNombre: string, autorRol: string) => void;
  // Auth
  users: any[];
  loadUsers: () => Promise<void>;
  createUser: (userData: any, autorNombre: string, autorRol: string) => Promise<void>;
  updateUserContext: (id: string, userData: any, autorNombre: string, autorRol: string) => Promise<void>;
  // Finanzas
  gastos: Gasto[];
  addGasto: (g: Omit<Gasto, 'id'>, autorNombre: string, autorRol: string) => void;

  // Kardex
  kardex: MovimientoKardex[];
  registrarAjusteKardex: (producto_id: string, tipo: 'ajuste_entrada' | 'ajuste_salida', cantidad: number, notas: string, autorNombre: string, autorId: string, autorRol: string) => void;

  // Materias Primas
  materiasPrimas: MateriaPrima[];
  movimientosMateriasPrimas: MovimientoMateriaPrima[];
  addMateriaPrima: (mp: Omit<MateriaPrima, 'id'>, autorNombre: string, autorRol: string) => void;
  updateMateriaPrima: (id: string, mp: Partial<MateriaPrima>, autorNombre: string, autorRol: string) => void;
  deleteMateriaPrima: (id: string, autorNombre: string, autorRol: string) => void;
  registrarMovimientoMateriaPrima: (materia_prima_id: string, tipo: 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida', cantidad: number, referencia: string, notas: string, autorId: string, autorNombre: string, autorRol: string) => void;
}

export const getLocalTimestamp = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

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
  nombre: 'Mi Empresa',
  nit: '000000000-0',
  direccion: 'Ciudad',
  telefono: '0000000',
  iva_porcentaje: 19,
  resolucion: 'PENDIENTE',
  giro: 'general'
};

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [kardex, setKardex] = useState<MovimientoKardex[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [configuracion, setConfiguracion] = useState<CompanyConfig>(initialConfig);
  const [users, setUsers] = useState<any[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [movimientosMateriasPrimas, setMovimientosMateriasPrimas] = useState<MovimientoMateriaPrima[]>([]);
  const { user } = useAuth();

  const refrescarProductos = () => fetchProductos().then(setProductos).catch(console.error);
  const refrescarClientes = () => fetchClientes().then(setClientes).catch(console.error);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) return; // No intentar descargar si no hay sesión iniciada

    refrescarProductos();
    refrescarClientes();
    fetchProveedores().then(setProveedores).catch(console.error);
    fetchVentas().then(setVentas).catch(console.error);
    fetchCompras().then(setCompras).catch(console.error);
    fetchKardex().then(setKardex).catch(console.error);
    fetchGastos().then(setGastos).catch(console.error);
    fetchAbonos().then(setAbonos).catch(console.error);
    fetchLogs().then(setLogs).catch(console.error);
    fetchConfig().then(setConfiguracion).catch(console.error);
    fetchMateriasPrimas().then(setMateriasPrimas).catch(console.error);
    fetchMovimientosMateriasPrimas().then(setMovimientosMateriasPrimas).catch(console.error);
    loadUsers();
  }, [user]);
  
  // Helper para insertar logs de auditoría
  const addLog = async (accion: string, modulo: ActivityLog['modulo'], autorNombre: string, autorRol: string) => {
    try {
      const nuevoLog = await fetchCreateLog({
        usuario_nombre: autorNombre,
        rol: autorRol,
        accion,
        modulo
      });
      setLogs(prev => [nuevoLog, ...prev].slice(0, 100)); // Mantener los últimos 100
    } catch (e) {
      console.error('Error guardando log', e);
    }
  };

  // ── Productos ──────────────────────────────────────────────────────────────
  const addProducto = async (p: Omit<Producto, 'id'>, autorNombre: string, autorRol: string) => {
    try {
      const nuevo = await fetchCreateProducto(p);
      setProductos(prev => [nuevo, ...prev]);
      addLog(`Creó el producto "${nuevo.nombre}" con código ${nuevo.codigo}`, 'productos', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Hubo un error al crear el producto');
    }
  };

  const updateProducto = async (p: Producto, autorNombre: string, autorRol: string) => {
    try {
      const oldProd = productos.find(x => x.id === p.id);
      const actualizado = await fetchUpdateProducto(p.id, p);
      setProductos(prev => prev.map(x => x.id === p.id ? actualizado : x));
      
      if (oldProd && oldProd.stock !== p.stock) {
        const diff = p.stock - oldProd.stock;
        const tipo = diff > 0 ? 'ajuste_entrada' : 'ajuste_salida';
        setKardex(kPrev => [{
          id: genId('kx'),
          producto_id: p.id,
          producto_nombre: p.nombre,
          fecha: getLocalTimestamp(),
          tipo,
          cantidad: Math.abs(diff),
          stock_anterior: oldProd.stock,
          stock_nuevo: p.stock,
          referencia: 'Ajuste manual de stock (Edición)',
          registrado_por: autorNombre
        }, ...kPrev]);
      }
      addLog(`Actualizó el producto "${p.nombre}"`, 'productos', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Hubo un error al actualizar el producto');
    }
  };

  const deleteProducto = async (id: string, autorNombre: string, autorRol: string) => {
    try {
      const prod = productos.find(x => x.id === id);
      await fetchDeleteProducto(id);
      setProductos(prev => prev.filter(x => x.id !== id));
      if (prod) {
        addLog(`Eliminó el producto "${prod.nombre}"`, 'productos', autorNombre, autorRol);
      }
    } catch (e) {
      console.error(e);
      alert('Hubo un error al eliminar el producto');
    }
  };

  const addCompra = async (
    items: CompraItem[],
    proveedorId: string,
    compradorId: string,
    compradorNombre: string,
    compradorRol: string,
    notas?: string
  ) => {
    const prov = proveedores.find(p => p.id === proveedorId);
    const provNombre = proveedorId === 'sin-proveedor' ? 'Sin Proveedor Registrado' : (prov?.nombre ?? 'Desconocido');
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    const facturaNum = `COM-2025-${String(compras.length + 1).padStart(4, '0')}`;

    const payload = {
      factura_compra: facturaNum,
      proveedor_id: proveedorId === 'sin-proveedor' ? null : proveedorId,
      proveedor_nombre: provNombre,
      comprador_id: compradorId,
      comprador_nombre: compradorNombre,
      total,
      estado: 'completada' as const,
      notas,
      items
    };

    try {
      const nuevaCompra = await fetchCreateCompra(payload);
      setCompras(prev => [nuevaCompra, ...prev]);
      refrescarProductos();

      addLog(`Registró compra ${facturaNum} al proveedor "${provNombre}" por ${total}`, 'compras', compradorNombre, compradorRol);
    } catch (e) {
      console.error(e);
      alert('Error al registrar la compra');
    }
  };

  const anularCompra = async (id: string, autorNombre: string, autorId: string, autorRol: string) => {
    const cmp = compras.find(x => x.id === id);
    if (!cmp || cmp.estado === 'anulada') return;

    try {
      await fetchAnularCompra(id, autorNombre, autorId);
      setCompras(prev => prev.map(c => c.id === id ? { ...c, estado: 'anulada' } : c));
      refrescarProductos();

      addLog(`Anuló la compra de la factura ${cmp.factura_compra}`, 'compras', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Error al anular la compra');
    }
  };

  // ── Proveedores ───────────────────────────────────────────────────────────
  const addProveedor = async (p: Omit<Proveedor, 'id'>, autorNombre: string, autorRol: string) => {
    try {
      const nuevo = await fetchCreateProveedor(p);
      setProveedores(prev => [nuevo, ...prev]);
      addLog(`Registró al proveedor "${nuevo.nombre}" con NIT ${nuevo.nit}`, 'proveedores', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Hubo un error al registrar el proveedor');
    }
  };
  const updateProveedor = async (p: Proveedor, autorNombre: string, autorRol: string) => {
    try {
      const actualizado = await fetchUpdateProveedor(p.id, p);
      setProveedores(prev => prev.map(x => x.id === p.id ? actualizado : x));
      addLog(`Actualizó datos del proveedor "${p.nombre}"`, 'proveedores', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Hubo un error al actualizar el proveedor');
    }
  };
  const deleteProveedor = async (id: string, autorNombre: string, autorRol: string) => {
    try {
      const prov = proveedores.find(x => x.id === id);
      await fetchDeleteProveedor(id);
      setProveedores(prev => prev.filter(x => x.id !== id));
      if (prov) addLog(`Eliminó al proveedor "${prov.nombre}"`, 'proveedores', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Hubo un error al eliminar el proveedor');
    }
  };

  // ── Clientes ──────────────────────────────────────────────────────────────
  const addCliente = async (c: Omit<Cliente, 'id'>, autorNombre: string, autorRol: string) => {
    try {
      const nuevo = await fetchCreateCliente(c);
      setClientes(prev => [nuevo, ...prev]);
      addLog(`Registró al cliente "${nuevo.nombre}"`, 'clientes', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Hubo un error al registrar el cliente');
    }
  };
  const updateCliente = async (c: Cliente, autorNombre: string, autorRol: string) => {
    try {
      const actualizado = await fetchUpdateCliente(c.id, c);
      setClientes(prev => prev.map(x => x.id === c.id ? actualizado : x));
      addLog(`Actualizó datos del cliente "${c.nombre}"`, 'clientes', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Hubo un error al actualizar el cliente');
    }
  };
  const deleteCliente = async (id: string, autorNombre: string, autorRol: string) => {
    try {
      const cl = clientes.find(x => x.id === id);
      await fetchDeleteCliente(id);
      setClientes(prev => prev.filter(x => x.id !== id));
      if (cl) addLog(`Eliminó al cliente "${cl.nombre}"`, 'clientes', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Hubo un error al eliminar el cliente');
    }
  };

  // ── Ventas ────────────────────────────────────────────────────────────────
  const addVenta = async (
    items: VentaItem[],
    clienteId: string,
    vendedorId: string,
    vendedorNombre: string,
    vendedorRol: string,
    metodoPago: 'contado' | 'credito' = 'contado'
  ) => {
    const cliente = clientes.find(c => c.id === clienteId);
    const clienteNombre = clienteId === 'walk-in' ? 'Cliente No Registrado' : (cliente?.nombre ?? 'Desconocido');
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    const facturaNum = `FAC-${String((ventas?.length || 0) + 1).padStart(3, '0')}`;
    
    const payload = {
      factura: facturaNum,
      cliente_id: clienteId === 'walk-in' ? null : clienteId,
      cliente_nombre: clienteNombre,
      vendedor_id: vendedorId,
      vendedor_nombre: vendedorNombre,
      subtotal: total,
      descuento: 0,
      impuestos: 0,
      total,
      metodo_pago: metodoPago,
      monto_pagado: total,
      cambio: 0,
      items
    };

    try {
      const nuevaVenta = await fetchCreateVenta(payload);
      setVentas(prev => [nuevaVenta, ...prev]);
      refrescarProductos();
      if (metodoPago === 'credito') refrescarClientes(); // Sincronizar stock

      if (metodoPago === 'credito' && clienteId !== 'walk-in') {
        setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, credito_usado: (c.credito_usado || 0) + total } : c));
      }

      addLog(`Registró la venta ${facturaNum} por ${total}`, 'ventas', vendedorNombre, vendedorRol);
    } catch (e) {
      console.error(e);
      alert('Error al procesar la venta');
    }
  };

  const anularVenta = async (id: string, autorNombre: string, autorId: string, autorRol: string) => {
    const vnt = ventas.find(x => x.id === id);
    if (!vnt || vnt.estado === 'anulada') return;

    try {
      await fetchAnularVenta(id, autorNombre, autorId);
      setVentas(prev => prev.map(v => v.id === id ? { ...v, estado: 'anulada' } : v));
      refrescarProductos();
      if (vnt.metodo_pago === 'credito') refrescarClientes(); // Sincronizar stock restaurado

      if (vnt.metodo_pago === 'credito' && vnt.cliente_id) {
        setClientes(prev => prev.map(c => c.id === vnt.cliente_id ? { ...c, credito_usado: Math.max(0, (c.credito_usado || 0) - vnt.total) } : c));
      }

      addLog(`Anuló la venta de la factura ${vnt.factura}`, 'ventas', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Error al anular la venta');
    }
  };

  // ── Configuración de la Empresa ───────────────────────────────────────────
  // ─── Abonos ───
  const addAbono = async (a: Omit<Abono, 'id'>, autorNombre: string, autorId: string, autorRol: string) => {
    try {
      const payload: any = { ...a, registrado_por: autorId };
      const nuevoAbono = await fetchCreateAbono(payload);
      setAbonos(prev => [nuevoAbono, ...prev]);
      
      // Actualizar cliente localmente (el backend ya actualizó la BD)
      setClientes(prev => prev.map(c => {
        if (c.id === a.cliente_id) {
          return {
            ...c,
            credito_usado: Math.max(0, (c.credito_usado || 0) - a.monto)
          };
        }
        return c;
      }));

      const clientName = clientes.find(c => c.id === a.cliente_id)?.nombre || 'Desconocido';
      addLog(`Registró un abono de $${a.monto} para el cliente "${clientName}"`, 'clientes', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Error al registrar abono');
    }
  };

  // ─── Finanzas (Gastos y Caja) ───
  const addGasto = async (g: Omit<Gasto, 'id'>, autorNombre: string, autorRol: string) => {
    try {
      const nuevo = await fetchCreateGasto(g);
      setGastos(prev => [nuevo, ...prev]);
      addLog(`Registró un gasto operativo por $${g.monto} (${g.categoria})`, 'configuracion', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Error al registrar el gasto');
    }
  };



  const updateConfiguracion = async (config: CompanyConfig, autorNombre: string, autorRol: string) => {
    try {
      const nuevaConfig = await fetchUpdateConfig(config);
      setConfiguracion(nuevaConfig);
      addLog('Actualizó los datos y parámetros tributarios de la empresa', 'configuracion', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Error al actualizar configuración');
    }
  };

  const createUser = async (userData: any, autorNombre: string, autorRol: string) => {
    try {
      await fetchCreateUser(userData);
      addLog(`Creó un nuevo usuario: ${userData.nombre} (${userData.rol})`, 'configuracion', autorNombre, autorRol);
      await loadUsers(); // Refrescar la tabla
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message || 'Error al crear usuario');
    }
  };

  const updateUserContext = async (id: string, userData: any, autorNombre: string, autorRol: string) => {
    try {
      await fetchUpdateUser(id, userData);
      addLog(`Actualizó datos del usuario: ${userData.nombre}`, 'configuracion', autorNombre, autorRol);
      await loadUsers(); // Refrescar la tabla
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message || 'Error al actualizar usuario');
    }
  };

  const registrarAjusteKardex = async (producto_id: string, tipo: 'ajuste_entrada' | 'ajuste_salida', cantidad: number, notas: string, autorNombre: string, autorId: string, autorRol: string) => {
    try {
      const payload = { producto_id, tipo, cantidad, notas, autorNombre, autorId };
      const nuevoMovimiento = await fetchRegistrarAjusteKardex(payload);
      setKardex(prev => [nuevoMovimiento, ...prev]);
      refrescarProductos();

      const logMsg = tipo === 'ajuste_entrada' 
        ? `Ajuste positivo de +${cantidad} unidades al producto "${nuevoMovimiento.producto_nombre}"` 
        : `Ajuste negativo de -${cantidad} unidades al producto "${nuevoMovimiento.producto_nombre}"`;
      addLog(logMsg, 'productos', autorNombre, autorRol);
    } catch (e) {
      console.error(e);
      alert('Error al registrar ajuste en el kardex');
    }
  };

  const addMateriaPrima = async (mp: Omit<MateriaPrima, 'id'>, autorNombre: string, autorRol: string) => {
    try {
      const nueva = await fetchCreateMateriaPrima(mp);
      setMateriasPrimas(prev => [nueva, ...prev]);
      addLog(`Creó nueva materia prima: ${mp.nombre}`, 'productos', autorNombre, autorRol);
    } catch(e) { console.error(e); alert('Error al crear materia prima'); }
  };

  const updateMateriaPrima = async (id: string, mp: Partial<MateriaPrima>, autorNombre: string, autorRol: string) => {
    try {
      const updated = await fetchUpdateMateriaPrima(id, mp);
      setMateriasPrimas(prev => prev.map(m => m.id === id ? updated : m));
      addLog(`Actualizó materia prima: ${updated.nombre}`, 'productos', autorNombre, autorRol);
    } catch(e) { console.error(e); alert('Error al actualizar materia prima'); }
  };

  const deleteMateriaPrima = async (id: string, autorNombre: string, autorRol: string) => {
    try {
      const mp = materiasPrimas.find(m => m.id === id);
      await fetchDeleteMateriaPrima(id);
      setMateriasPrimas(prev => prev.filter(m => m.id !== id));
      if (mp) addLog(`Eliminó materia prima: ${mp.nombre}`, 'productos', autorNombre, autorRol);
    } catch(e) { console.error(e); alert('Error al eliminar materia prima. Asegúrate que no tenga movimientos'); }
  };

  const registrarMovimientoMateriaPrima = async (materia_prima_id: string, tipo: 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida', cantidad: number, referencia: string, notas: string, autorId: string, autorNombre: string, autorRol: string) => {
    try {
      const nuevoMov = await fetchRegistrarMovimientoMateriaPrima(materia_prima_id, tipo, cantidad, referencia, notas, autorId, autorNombre);
      setMovimientosMateriasPrimas(prev => [nuevoMov, ...prev]);
      const mpActualizada = await fetchMateriasPrimas();
      setMateriasPrimas(mpActualizada);
      addLog(`Movimiento de materia prima (${tipo}) registrado: ${nuevoMov.materia_prima_nombre}`, 'productos', autorNombre, autorRol);
    } catch(e) { console.error(e); alert('Error al registrar movimiento'); }
  };


  return (
    <AppDataContext.Provider value={{
      productos, addProducto, updateProducto, deleteProducto,
      proveedores, addProveedor, updateProveedor, deleteProveedor,
      clientes, addCliente, updateCliente, deleteCliente,
      abonos, addAbono,
      gastos, addGasto,

      ventas, addVenta, anularVenta,
      compras, addCompra, anularCompra,
      logs, addLog,
      configuracion, updateConfiguracion,
      users, loadUsers, createUser, updateUserContext,
      kardex, registrarAjusteKardex,
      materiasPrimas, movimientosMateriasPrimas, addMateriaPrima, updateMateriaPrima, deleteMateriaPrima, registrarMovimientoMateriaPrima
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

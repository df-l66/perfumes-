import type { Venta, Abono } from '../types';

export interface SaldoVenta {
  abonado: number;
  saldo: number;
}

/**
 * Reparte los abonos de cada cliente entre sus ventas a crédito, de la más antigua a la
 * más reciente. Replica el algoritmo del backend (abonos.controller.ts), que es el que
 * decide cuándo una venta pasa a 'completada'; si allí cambia la regla, cambiarla aquí.
 */
export function calcularSaldosCredito(ventas: Venta[], abonos: Abono[]): Map<string, SaldoVenta> {
  const abonadoPorCliente = new Map<string, number>();
  for (const a of abonos) {
    if (!a.cliente_id) continue;
    abonadoPorCliente.set(a.cliente_id, (abonadoPorCliente.get(a.cliente_id) || 0) + (Number(a.monto) || 0));
  }

  const ventasPorCliente = new Map<string, Venta[]>();
  for (const v of ventas) {
    if (v.metodo_pago !== 'credito' || v.estado === 'anulada' || !v.cliente_id) continue;
    if (!ventasPorCliente.has(v.cliente_id)) ventasPorCliente.set(v.cliente_id, []);
    ventasPorCliente.get(v.cliente_id)!.push(v);
  }

  const saldos = new Map<string, SaldoVenta>();
  for (const [clienteId, lista] of ventasPorCliente) {
    let disponible = abonadoPorCliente.get(clienteId) || 0;
    const ordenadas = [...lista].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    for (const v of ordenadas) {
      const total = Number(v.total) || 0;
      const abonado = Math.min(disponible, total);
      disponible -= abonado;
      saldos.set(v.id, { abonado, saldo: total - abonado });
    }
  }
  return saldos;
}

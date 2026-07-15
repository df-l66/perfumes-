import React from 'react';
import type { ProductStatus, VentaEstado, ProveedorEstado } from '../../types';

type BadgeVariant = 'activo' | 'inactivo' | 'stock_bajo' | 'completada' | 'pendiente' | 'anulada' | 'empresa' | 'persona';

const variants: Record<BadgeVariant, string> = {
  activo:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
  inactivo:   'bg-zinc-100 text-zinc-500 border border-zinc-200',
  stock_bajo: 'bg-amber-100 text-amber-700 border border-amber-200',
  completada: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  pendiente:  'bg-amber-100 text-amber-700 border border-amber-200',
  anulada:    'bg-red-100 text-red-600 border border-red-200',
  empresa:    'bg-blue-100 text-blue-700 border border-blue-200',
  persona:    'bg-purple-100 text-purple-700 border border-purple-200',
};

const labels: Record<BadgeVariant, string> = {
  activo:     'Activo',
  inactivo:   'Inactivo',
  stock_bajo: 'Stock Bajo',
  completada: 'Completada',
  pendiente:  'Pendiente',
  anulada:    'Anulada',
  empresa:    'Empresa',
  persona:    'Persona',
};

interface BadgeProps {
  variant: BadgeVariant | ProductStatus | VentaEstado | ProveedorEstado;
  className?: string;
}

export function Badge({ variant, className = '' }: BadgeProps) {
  const v = variant as BadgeVariant;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[v] ?? 'bg-zinc-100 text-zinc-600'} ${className}`}>
      {labels[v] ?? variant}
    </span>
  );
}

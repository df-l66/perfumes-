import { fetchWithAuth } from './apiClient';
import type { MovimientoKardex } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/kardex`;

export const fetchKardex = async (): Promise<MovimientoKardex[]> => {
  const response = await fetchWithAuth(API_URL);
  
  return response.json();
};

export const fetchRegistrarAjusteKardex = async (payload: {
  producto_id: string;
  tipo: 'ajuste_entrada' | 'ajuste_salida';
  cantidad: number;
  notas: string;
  autorNombre: string;
}): Promise<MovimientoKardex> => {
  const response = await fetchWithAuth(`${API_URL}/ajuste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  return response.json();
};

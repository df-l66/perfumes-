import { fetchWithAuth } from './apiClient';
import type { MateriaPrima, MovimientoMateriaPrima } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/materias-primas`;

export const fetchMateriasPrimas = async (): Promise<MateriaPrima[]> => {
  const response = await fetchWithAuth(API_URL);
  return response.json();
};

export const fetchCreateMateriaPrima = async (mp: Omit<MateriaPrima, 'id'>): Promise<MateriaPrima> => {
  const response = await fetchWithAuth(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mp),
  });
  return response.json();
};

export const fetchUpdateMateriaPrima = async (id: string, mp: Partial<MateriaPrima>): Promise<MateriaPrima> => {
  const response = await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mp),
  });
  return response.json();
};

export const fetchDeleteMateriaPrima = async (id: string): Promise<void> => {
  await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
};

export const fetchRegistrarMovimientoMateriaPrima = async (
  materia_prima_id: string,
  tipo: 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida',
  cantidad: number,
  referencia: string,
  notas: string,
  autorId: string,
  autorNombre: string
): Promise<MovimientoMateriaPrima> => {
  const response = await fetchWithAuth(`${API_URL}/movimientos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materia_prima_id, tipo, cantidad, referencia, notas, autorId, autorNombre }),
  });
  return response.json();
};

export const fetchMovimientosMateriasPrimas = async (): Promise<MovimientoMateriaPrima[]> => {
  const response = await fetchWithAuth(`${API_URL}/movimientos/historial`);
  return response.json();
};

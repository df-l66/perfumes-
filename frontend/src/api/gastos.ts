import { fetchWithAuth } from './apiClient';
import type { Gasto } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/gastos`;

export const fetchGastos = async (): Promise<Gasto[]> => {
  const response = await fetchWithAuth(API_URL);
  
  return response.json();
};

export const fetchCreateGasto = async (gasto: Omit<Gasto, 'id'>): Promise<Gasto> => {
  const response = await fetchWithAuth(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gasto),
  });
  
  return response.json();
};

export const fetchDeleteGasto = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  
};

import { fetchWithAuth } from './apiClient';
import type { Compra, CompraItem } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/compras`;

export const fetchCompras = async (): Promise<Compra[]> => {
  const response = await fetchWithAuth(API_URL);
  
  return response.json();
};

export const fetchCreateCompra = async (compra: any): Promise<Compra> => {
  const response = await fetchWithAuth(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(compra),
  });
  
  return response.json();
};

export const fetchAnularCompra = async (id: string, autorNombre: string): Promise<void> => {
  const response = await fetchWithAuth(`${API_URL}/${id}/anular`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autorNombre }),
  });
  
};

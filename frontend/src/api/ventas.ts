import { fetchWithAuth } from './apiClient';
import type { Venta, VentaItem } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/ventas`;

export const fetchVentas = async (): Promise<Venta[]> => {
  const response = await fetchWithAuth(API_URL);
  
  return response.json();
};

export const fetchCreateVenta = async (venta: any): Promise<Venta> => {
  const response = await fetchWithAuth(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(venta),
  });
  
  return response.json();
};

export const fetchAnularVenta = async (id: string, autorNombre: string, autorId: string): Promise<void> => {
  const response = await fetchWithAuth(`${API_URL}/${id}/anular`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autorNombre, autorId }),
  });
  
};

import { fetchWithAuth } from './apiClient';
import type { Producto } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/productos`;

export const fetchProductos = async (): Promise<Producto[]> => {
  const response = await fetchWithAuth(API_URL);
  
  return response.json();
};

export const fetchCreateProducto = async (producto: Omit<Producto, 'id'>): Promise<Producto> => {
  const response = await fetchWithAuth(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  });
  
  return response.json();
};

export const fetchUpdateProducto = async (id: string, producto: Partial<Producto>): Promise<Producto> => {
  const response = await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  });
  
  return response.json();
};

export const fetchDeleteProducto = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  
};

import { fetchWithAuth } from './apiClient';
import type { Proveedor } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/proveedores`;

export const fetchProveedores = async (): Promise<Proveedor[]> => {
  const response = await fetchWithAuth(API_URL);
  
  return response.json();
};

export const fetchCreateProveedor = async (proveedor: Omit<Proveedor, 'id'>): Promise<Proveedor> => {
  const response = await fetchWithAuth(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proveedor),
  });
  
  return response.json();
};

export const fetchUpdateProveedor = async (id: string, proveedor: Partial<Proveedor>): Promise<Proveedor> => {
  const response = await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proveedor),
  });
  
  return response.json();
};

export const fetchDeleteProveedor = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  
};

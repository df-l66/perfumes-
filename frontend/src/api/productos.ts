import { fetchWithAuth } from './apiClient';
import type { Producto } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/productos`;

const decodeProducto = (p: Producto): Producto => {
  if (p.descripcion && p.descripcion.includes('[POR_ENCARGO]')) {
    p.es_por_encargo = true;
    p.descripcion = p.descripcion.replace('\\n[POR_ENCARGO]', '').replace('[POR_ENCARGO]', '');
  } else {
    p.es_por_encargo = false;
  }
  return p;
};

export const fetchProductos = async (): Promise<Producto[]> => {
  const response = await fetchWithAuth(API_URL);
  const data = await response.json();
  return data.map(decodeProducto);
};

export const fetchCreateProducto = async (producto: Omit<Producto, 'id'>): Promise<Producto> => {
  const response = await fetchWithAuth(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  });
  const data = await response.json();
  return decodeProducto(data);
};

export const fetchUpdateProducto = async (id: string, producto: Partial<Producto>): Promise<Producto> => {
  const payload = { ...producto };
  
  if (payload.es_por_encargo) {
    if (!payload.descripcion?.includes('[POR_ENCARGO]')) {
      payload.descripcion = (payload.descripcion || '') + '\\n[POR_ENCARGO]';
    }
  } else if (payload.es_por_encargo === false && payload.descripcion) {
    payload.descripcion = payload.descripcion.replace('\\n[POR_ENCARGO]', '').replace('[POR_ENCARGO]', '');
  }
  delete (payload as any).es_por_encargo;

  const response = await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  const data = await response.json();
  return decodeProducto(data);
};

export const fetchDeleteProducto = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  
};

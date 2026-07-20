import { fetchWithAuth } from './apiClient';
import type { Cliente } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/clientes`;

export const fetchClientes = async (): Promise<Cliente[]> => {
  const response = await fetchWithAuth(API_URL);
  
  return response.json();
};

export const fetchCreateCliente = async (cliente: Omit<Cliente, 'id'>): Promise<Cliente> => {
  const response = await fetchWithAuth(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cliente),
  });
  
  return response.json();
};

export const fetchCreateClientePublico = async (cliente: Omit<Cliente, 'id'>): Promise<Cliente> => {
  const publicApiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/public/registro-cliente`;
  const response = await fetch(publicApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cliente),
  });
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al registrar cliente');
  }
  
  return response.json();
};

export const fetchUpdateCliente = async (id: string, cliente: Partial<Cliente>): Promise<Cliente> => {
  const response = await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cliente),
  });
  
  return response.json();
};

export const fetchDeleteCliente = async (id: string): Promise<void> => {
  const response = await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  
};

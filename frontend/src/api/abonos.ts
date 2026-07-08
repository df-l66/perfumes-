import { fetchWithAuth } from './apiClient';
import type { Abono } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/abonos`;

export const fetchAbonos = async (): Promise<Abono[]> => {
  const response = await fetchWithAuth(API_URL);
  
  return response.json();
};

export const fetchCreateAbono = async (abono: Omit<Abono, 'id' | 'fecha'>): Promise<Abono> => {
  const response = await fetchWithAuth(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(abono),
  });
  
  return response.json();
};

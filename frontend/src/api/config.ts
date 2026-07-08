import { fetchWithAuth } from './apiClient';
import type { CompanyConfig } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/config`;

export const fetchConfig = async (): Promise<CompanyConfig> => {
  const response = await fetchWithAuth(API_URL);
  
  return response.json();
};

export const fetchUpdateConfig = async (config: CompanyConfig): Promise<CompanyConfig> => {
  const response = await fetchWithAuth(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  
  return response.json();
};

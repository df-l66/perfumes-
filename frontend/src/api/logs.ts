import { fetchWithAuth } from './apiClient';
import type { ActivityLog } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/logs`;

export const fetchLogs = async (): Promise<ActivityLog[]> => {
  const response = await fetchWithAuth(API_URL);
  
  return response.json();
};

export const fetchCreateLog = async (log: Omit<ActivityLog, 'id' | 'fecha'>): Promise<ActivityLog> => {
  const response = await fetchWithAuth(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  
  return response.json();
};

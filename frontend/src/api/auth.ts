import { fetchWithAuth } from './apiClient';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth`;

export const fetchCreateUser = async (userData: any): Promise<any> => {
  const response = await fetchWithAuth(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  return response.json();
};

export const fetchUsers = async (): Promise<any[]> => {
  const response = await fetchWithAuth(API_URL);
  return response.json();
};

export const fetchUpdateUser = async (id: string, userData: any): Promise<any> => {
  const response = await fetchWithAuth(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  return response.json();
};

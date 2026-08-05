import { supabase } from '../config/supabase';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let token: string | undefined;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch (e) {
    console.error('Error fetching Supabase session token:', e);
  }

  if (!token) {
    try {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('sb-zoojbnvxnnsymmdvmaqj-auth-token');
      if (storedToken) {
        try {
          const parsed = JSON.parse(storedToken);
          token = parsed?.access_token || parsed?.token || storedToken;
        } catch {
          token = storedToken;
        }
      }
    } catch {
      // Ignorar errores de localStorage
    }
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message ? `${errorData.message} (${errorData.error || ''})` : 'Error en la petición al servidor');
  }

  return response;
}

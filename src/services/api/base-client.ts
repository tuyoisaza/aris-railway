const API_URL = '/api';

let cachedToken: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 30000;

let onUnauthorized: (() => void) | null = () => {
  console.warn('401 Unauthorized detected, but no callback registered.');
};

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorized = callback;
};

export const getHeaders = async () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const now = Date.now();

  if (cachedToken && now - cacheTime < CACHE_TTL) {
    headers['Authorization'] = `Bearer ${cachedToken}`;
    return headers;
  }

  const token = localStorage.getItem('aris_token');
  if (token) {
    cachedToken = token;
    cacheTime = now;
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    cachedToken = null;
    cacheTime = 0;
  }

  return headers;
};

export const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    console.warn('API returned 401. Triggering logout.');
    if (onUnauthorized) onUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res;
};

export const clearTokenCache = () => {
  cachedToken = null;
  cacheTime = 0;
};

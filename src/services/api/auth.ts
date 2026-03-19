import { API_URL, clearTokenCache } from './base-client';

export const signup = async (email: string, password: string, name?: string) => {
  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();

    if (data.session?.access_token) {
      localStorage.setItem('aris_token', data.session.access_token);
    }
    if (data.user) {
      localStorage.setItem('aris_user', JSON.stringify(data.user));
    }
    return data;
  } catch (e: any) {
    return { error: e.message };
  }
};

export const login = async (email: string, password: string) => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.session?.access_token) {
      localStorage.setItem('aris_token', data.session.access_token);
    }
    if (data.user) {
      localStorage.setItem('aris_user', JSON.stringify(data.user));
    }
    return data;
  } catch (e: any) {
    return { error: e.message };
  }
};

export const requestPasswordReset = async (email: string) => {
  try {
    const res = await fetch(`${API_URL}/auth/reset-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (e: any) {
    return { error: e.message };
  }
};

export const updatePassword = async (_newPassword: string) => {
  return { error: 'Password update coming soon' };
};

export const logout = async () => {
  localStorage.removeItem('aris_token');
  localStorage.removeItem('aris_user');
  clearTokenCache();
};

export const initiateGoogleLogin = async () => {
  try {
    const res = await fetch(`${API_URL}/auth/google`);
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to initiate Google login');
    }
    return await res.json();
  } catch (e: any) {
    return { error: e.message };
  }
};

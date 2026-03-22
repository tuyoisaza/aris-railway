import { API_URL, clearTokenCache } from './base-client';

const authCallbacks: Array<(event: string, session: any) => void> = [];

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
    authCallbacks.push(callback);
    const token = localStorage.getItem('aris_token');
    const userStr = localStorage.getItem('aris_user');
    callback('INITIAL_SESSION', token ? { user: userStr ? JSON.parse(userStr) : null } : null);
    return { 
        data: { 
            unsubscribe: () => {
                const idx = authCallbacks.indexOf(callback);
                if (idx > -1) authCallbacks.splice(idx, 1);
            }
        }
    };
};

export const getSession = () => {
    const token = localStorage.getItem('aris_token');
    const userStr = localStorage.getItem('aris_user');
    if (token) {
        return {
            data: {
                session: { access_token: token },
                user: userStr ? JSON.parse(userStr) : null
            }
        };
    }
    return { data: { session: null, user: null } };
};

const notifyAuthChange = (event: string, session: any) => {
    authCallbacks.forEach(cb => cb(event, session));
};

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
      notifyAuthChange('SIGNED_IN', { user: data.user });
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
      notifyAuthChange('SIGNED_IN', { user: data.user });
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
  notifyAuthChange('SIGNED_OUT', null);
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

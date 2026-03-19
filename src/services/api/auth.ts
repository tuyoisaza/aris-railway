import { API_URL, clearTokenCache } from './base-client';
import { supabase } from '../supabase';

export const signup = async (email: string, password: string, name?: string) => {
  try {
    // 1. Supabase Auth Signup
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || 'User' } },
    });

    if (authError) throw authError;

    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();

    if (data.session) {
      // IMPORTANT: Tell Supabase Client we have a session
      const { error: setSessionError } = await supabase.auth.setSession(data.session);
      if (setSessionError) console.error('Error setting session:', setSessionError);
    }
    return data;
  } catch (e: any) {
    return { error: e.message };
  }
};

export const login = async (email: string, password: string) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const apiData = await res.json();

    if (apiData.session) {
      await supabase.auth.setSession(apiData.session);
    }
    return apiData;
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
  return { error: 'Handle via Supabase Client directly' };
};

export const logout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('access_token');
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
    console.error('Google Login Error:', e);
    return { error: e.message };
  }
};

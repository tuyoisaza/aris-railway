import { API_URL, getHeaders, handleResponse } from './base-client';

export const updatePreferences = async (preferences: any) => {
  try {
    const res = await fetch(`${API_URL}/user/preferences`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ preferences }),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const updateAvatar = async (avatarUrl: string) => {
  try {
    const res = await fetch(`${API_URL}/user/avatar`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ avatar: avatarUrl }),
    });
    if (!res.ok) throw new Error('Failed to update avatar');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const getUser = async (userId: string) => {
  try {
    const res = await fetch(`${API_URL}/user`, { headers: await getHeaders() });
    await handleResponse(res);
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const updateUser = async (userId: string, updates: any) => {
  try {
    const res = await fetch(`${API_URL}/user`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

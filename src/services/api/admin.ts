import { API_URL, getHeaders, handleResponse } from './base-client';

export const getPrompts = async () => {
  const res = await fetch(`${API_URL}/admin/prompts`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const updatePrompt = async (
  agentId: string,
  data: { promptText?: string; model?: string; temperature?: number; name?: string; active?: boolean }
) => {
  const res = await fetch(`${API_URL}/admin/prompts/${agentId}`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });
  await handleResponse(res);
  return await res.json();
};

export const getServices = async () => {
  const res = await fetch(`${API_URL}/admin/services`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getLogs = async () => {
  const res = await fetch(`${API_URL}/admin/logs`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getLogLevel = async () => {
  const res = await fetch(`${API_URL}/admin/loglevel`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const setLogLevel = async (level: number) => {
  const res = await fetch(`${API_URL}/admin/loglevel`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify({ level }),
  });
  await handleResponse(res);
  return await res.json();
};

export const restart = async () => {
  const res = await fetch(`${API_URL}/admin/restart`, {
    method: 'POST',
    headers: await getHeaders(),
  });
  await handleResponse(res);
  return await res.json();
};

export const chatTest = async (agentId: string, message: string, history: any[]) => {
  const res = await fetch(`${API_URL}/admin/chat_test`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ agentId, message, history }),
  });
  await handleResponse(res);
  return await res.json();
};

export const getBadges = async () => {
  const res = await fetch(`${API_URL}/admin/badges`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const createBadge = async (badge: any) => {
  const res = await fetch(`${API_URL}/admin/badges`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(badge),
  });
  await handleResponse(res);
  return await res.json();
};

export const updateBadge = async (id: string, updates: any) => {
  const res = await fetch(`${API_URL}/admin/badges/${id}`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify(updates),
  });
  await handleResponse(res);
  return await res.json();
};

export const deleteBadge = async (id: string) => {
  const res = await fetch(`${API_URL}/admin/badges/${id}`, {
    method: 'DELETE',
    headers: await getHeaders(),
  });
  await handleResponse(res);
  return await res.json();
};

export const getDebugSettings = async () => {
  const res = await fetch(`${API_URL}/admin/settings/debug`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const setDebugMode = async (enabled: boolean) => {
  const res = await fetch(`${API_URL}/admin/settings/debug`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify({ enabled }),
  });
  await handleResponse(res);
  return await res.json();
};

export const getSystemLogs = async () => {
  const res = await fetch(`${API_URL}/admin/system_logs`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getUsers = async () => {
  const res = await fetch(`${API_URL}/admin/users`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const createUser = async (user: any) => {
  const res = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(user),
  });
  await handleResponse(res);
  return await res.json();
};

export const updateUser = async (id: string, updates: any) => {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify(updates),
  });
  await handleResponse(res);
  return await res.json();
};

export const deleteUser = async (id: string) => {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'DELETE',
    headers: await getHeaders(),
  });
  await handleResponse(res);
  return await res.json();
};

export const resetUserPassword = async (id: string) => {
  const res = await fetch(`${API_URL}/admin/users/${id}/reset-password`, {
    method: 'POST',
    headers: await getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to reset password');
  return await res.json();
};

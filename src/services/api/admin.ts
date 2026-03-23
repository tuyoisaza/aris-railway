import { API_URL, getHeaders, handleResponse } from './base-client';

export const getPrompts = async () => {
  const res = await fetch(`${API_URL}/admin/agents`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const updatePrompt = async (
  agentId: string,
  data: { promptText?: string; model?: string; temperature?: number; name?: string; active?: boolean }
) => {
  const res = await fetch(`${API_URL}/admin/agents/${agentId}`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });
  await handleResponse(res);
  return await res.json();
};

export const chatTest = async (agentId: string, message: string, history: any[]) => {
  const res = await fetch(`${API_URL}/admin/agents/chat`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ agentId, message, history }),
  });
  await handleResponse(res);
  return await res.json();
};

export const getServices = async () => {
  const res = await fetch(`${API_URL}/admin/systemstatus/services`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getLogs = async () => {
  const res = await fetch(`${API_URL}/admin/systemstatus/logs`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getLogLevel = async () => {
  const res = await fetch(`${API_URL}/admin/systemstatus/loglevel`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const setLogLevel = async (level: number) => {
  const res = await fetch(`${API_URL}/admin/systemstatus/loglevel`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify({ level }),
  });
  await handleResponse(res);
  return await res.json();
};

export const getRestartStatus = async () => {
  const res = await fetch(`${API_URL}/admin/systemstatus/restart`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getDatabaseDump = async () => {
  const res = await fetch(`${API_URL}/admin/systemstatus/dump`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getActions = async () => {
  const res = await fetch(`${API_URL}/admin/actions`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getActivity = async () => {
  const res = await fetch(`${API_URL}/admin/actions/activity`, { headers: await getHeaders() });
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
  const res = await fetch(`${API_URL}/admin/debug`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const setDebugMode = async (enabled: boolean) => {
  const res = await fetch(`${API_URL}/admin/debug`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify({ enabled }),
  });
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

export const getGuidedActions = async () => {
  const res = await fetch(`${API_URL}/admin/guidedactions`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

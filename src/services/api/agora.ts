import { API_URL, getHeaders, handleResponse } from './base-client';

export const getMemory = async () => {
  const res = await fetch(`${API_URL}/agora/memory`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const correctMemory = async (traitKey: string, correction: { corrected_value?: string; delete?: boolean }) => {
  const res = await fetch(`${API_URL}/agora/memory/${traitKey}`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify(correction),
  });
  await handleResponse(res);
  return await res.json();
};

export const getAuditHistory = async (limit: number = 50) => {
  const res = await fetch(`${API_URL}/agora/audit?limit=${limit}`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getProfile = async () => {
  const res = await fetch(`${API_URL}/agora/profile`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getSnapshot = async () => {
  const res = await fetch(`${API_URL}/agora/snapshot`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getActions = async () => {
  const res = await fetch(`${API_URL}/agora/actions`, { headers: await getHeaders() });
  await handleResponse(res);
  const data = await res.json();
  return data.actions || [];
};

export const executeAction = async (type: string, payload: any, intent: string) => {
  const res = await fetch(`${API_URL}/agora/action`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ type, payload, intent }),
  });
  await handleResponse(res);
  return await res.json();
};

export const createAction = async (action: any) => {
  const res = await fetch(`${API_URL}/agora/actions/admin`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(action),
  });
  await handleResponse(res);
  return await res.json();
};

export const updateAction = async (slug: string, updates: any) => {
  const res = await fetch(`${API_URL}/agora/actions/admin/${slug}`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify(updates),
  });
  await handleResponse(res);
  return await res.json();
};

export const deleteAction = async (slug: string) => {
  const res = await fetch(`${API_URL}/agora/actions/admin/${slug}`, {
    method: 'DELETE',
    headers: await getHeaders(),
  });
  await handleResponse(res);
  return await res.json();
};

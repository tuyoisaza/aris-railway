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

export const activateDebug = async (scope: string = 'ADMIN', durationMinutes: number = 15, reason?: string) => {
  const res = await fetch(`${API_URL}/admin/debug`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ scope, durationMinutes, reason }),
  });
  await handleResponse(res);
  return await res.json();
};

export const deactivateDebug = async (sessionId?: string) => {
  const res = await fetch(`${API_URL}/admin/debug`, {
    method: 'DELETE',
    headers: await getHeaders(),
    body: JSON.stringify({ sessionId }),
  });
  await handleResponse(res);
  return await res.json();
};

export const getDebugSessions = async () => {
  const res = await fetch(`${API_URL}/admin/debug/sessions`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const deleteDebugSession = async (sessionId: string) => {
  const res = await fetch(`${API_URL}/admin/debug/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: await getHeaders(),
  });
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

export const getFeatureFlags = async (scope?: string) => {
  const url = scope ? `${API_URL}/admin/featureflags?scope=${scope}` : `${API_URL}/admin/featureflags`;
  const res = await fetch(url, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const createFeatureFlag = async (flag: any) => {
  const res = await fetch(`${API_URL}/admin/featureflags`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(flag),
  });
  await handleResponse(res);
  return await res.json();
};

export const updateFeatureFlag = async (id: string, updates: any) => {
  const res = await fetch(`${API_URL}/admin/featureflags/${id}`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify(updates),
  });
  await handleResponse(res);
  return await res.json();
};

export const deleteFeatureFlag = async (id: string) => {
  const res = await fetch(`${API_URL}/admin/featureflags/${id}`, {
    method: 'DELETE',
    headers: await getHeaders(),
  });
  await handleResponse(res);
  return await res.json();
};

export const checkFeatureFlag = async (name: string) => {
  const res = await fetch(`${API_URL}/admin/featureflags/check/${name}`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getAuditLogs = async (params?: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.userId) searchParams.set('userId', params.userId);
  if (params?.action) searchParams.set('action', params.action);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  
  const url = `${API_URL}/admin/audit${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const res = await fetch(url, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getAuditActions = async () => {
  const res = await fetch(`${API_URL}/admin/audit/actions`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

export const getAuditLog = async (id: string) => {
  const res = await fetch(`${API_URL}/admin/audit/${id}`, { headers: await getHeaders() });
  await handleResponse(res);
  return await res.json();
};

import { API_URL, getHeaders, handleResponse } from './base-client';

const unwrapResponse = async (res: Response) => {
  const payload = await res.json();
  return payload?.data ?? payload;
};

export const getConversations = async (userId: string) => {
  try {
    const res = await fetch(`${API_URL}/chat/folders/${userId}`, { headers: await getHeaders() });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[API] getConversations failed: ${res.status} ${text}`);
      return [];
    }
    const data = await unwrapResponse(res);
    return Array.isArray(data) ? data : [];
  } catch (e: any) {
    console.error('[API] getConversations error:', e);
    return [];
  }
};

export const createConversation = async (
  userId: string,
  title: string,
  topicId: string | null,
  language: string,
  brief: string | null = null,
  initialContext: any = null
) => {
  try {
    const res = await fetch(`${API_URL}/chat/conversation`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ userId, title, topicId, language, brief, initialContext }),
    });
    await handleResponse(res);
    return await unwrapResponse(res);
  } catch (e: any) {
    console.error('[API] createConversation error:', e);
    return { error: e.message || 'Failed to create conversation' };
  }
};

export const deleteConversation = async (conversationId: string) => {
  try {
    const res = await fetch(`${API_URL}/chat/conversation/${conversationId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    const data = await unwrapResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to delete');
    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

export const updateConversation = async (conversationId: string, updates: any) => {
  try {
    const res = await fetch(`${API_URL}/chat/conversation/${conversationId}`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await unwrapResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to update conversation');
    return data;
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

export const renameConversation = async (conversationId: string, title: string) => {
  return updateConversation(conversationId, { title });
};

export const getFolders = async () => {
  try {
    const res = await fetch(`${API_URL}/folders`, { headers: await getHeaders() });
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.data ?? payload;
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const createFolder = async (title: string) => {
  try {
    const res = await fetch(`${API_URL}/folders`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ title }),
    });
    const payload = await res.json();
    return payload?.data ?? payload;
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const renameFolder = async (folderId: string, title: string) => {
  try {
    const res = await fetch(`${API_URL}/folders/${folderId}`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to rename folder');
    return data;
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

export const deleteFolder = async (folderId: string) => {
  try {
    const res = await fetch(`${API_URL}/folders/${folderId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

export const moveConversationToFolder = async (conversationId: string, folderId: string) => {
  try {
    const res = await fetch(`${API_URL}/chat/conversation/${conversationId}/move`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ folderId }),
    });
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const generateSummary = async (conversationIds: string[]) => {
  try {
    const res = await fetch(`${API_URL}/chat/summary`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ conversationIds }),
    });
    const data = await unwrapResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to generate summary');
    return data;
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

export const createMessage = async (conversationId: string, role: string, content: string) => {
  try {
    const res = await fetch(`${API_URL}/chat/message`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ conversationId, role, content }),
    });
    await handleResponse(res);
    return await unwrapResponse(res);
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

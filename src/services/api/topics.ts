import { API_URL, getHeaders } from './base-client';

export const getTopics = async (userId?: string) => {
  try {
    const query = userId ? `?userId=${userId}` : '';
    const res = await fetch(`${API_URL}/topics${query}`, { headers: await getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const getTopicGraph = async () => {
  try {
    const res = await fetch(`${API_URL}/topics/graph`, { headers: await getHeaders() });
    if (!res.ok) return { nodes: [], links: [] };
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return { nodes: [], links: [] };
  }
};

export const getTopic = async (topicId: string) => {
  try {
    const res = await fetch(`${API_URL}/topics/${topicId}`, { headers: await getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch topic');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const getTopicProgress = async (topicId: string, userId?: string) => {
  try {
    const query = userId ? `?userId=${userId}` : '';
    const res = await fetch(`${API_URL}/topics/${topicId}/progress${query}`, { headers: await getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch progress');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const updateTopicProgress = async (topicId: string, data: any) => {
  try {
    const res = await fetch(`${API_URL}/topics/${topicId}/progress`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update progress');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const deleteTopic = async (topicId: string) => {
  try {
    const res = await fetch(`${API_URL}/topics/${topicId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete topic');
    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message };
  }
};

export const createTopic = async (data: any) => {
  try {
    const res = await fetch(`${API_URL}/topics`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create topic');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const remapTopics = async () => {
  try {
    const res = await fetch(`${API_URL}/topics/remap`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!res.ok) throw new Error('Remap failed');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

export const mergeTopics = async (topicIds: string[]) => {
  try {
    const res = await fetch(`${API_URL}/topics/merge`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ topicIds }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Merge failed');
    }
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

export const enrichTopic = async (topicId: string) => {
  try {
    const res = await fetch(`${API_URL}/topics/${topicId}/enrich`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Enrich failed');
    }
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

export const startTopicConversation = async (topicId: string) => {
  try {
    const res = await fetch(`${API_URL}/topics/${topicId}/conversation`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start conversation');
    }
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

export const startSkillLevelConversation = async (skillId: string, level: number) => {
  try {
    const res = await fetch(`${API_URL}/skills/${skillId}/levels/${level}/conversation`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start conversation');
    }
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

export const generateSkillCurriculum = async (skillId: string) => {
  try {
    const res = await fetch(`${API_URL}/skills/${skillId}/generate`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate curriculum');
    }
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return { error: e.message };
  }
};

export const getResources = async (topicId: string) => {
  try {
    const res = await fetch(`${API_URL}/resources/${topicId}`, { headers: await getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

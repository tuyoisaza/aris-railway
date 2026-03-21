import { API_URL, getHeaders, handleResponse } from './base-client';

export async function getSkills() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/skills`, { headers });
    await handleResponse(res);
    return await res.json();
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getAllSkills() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/skills/all`, { headers });
    await handleResponse(res);
    return await res.json();
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function createSkill(data: { title: string; category?: string; description?: string }) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/skills`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    await handleResponse(res);
    return await res.json();
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteSkill(id: string) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/skills/${id}`, {
      method: 'DELETE',
      headers,
    });
    await handleResponse(res);
    return await res.json();
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteSkills(ids: string[]) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/skills`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ ids }),
    });
    await handleResponse(res);
    return await res.json();
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getSkillNotifications() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/skills/notifications`, { headers });
    await handleResponse(res);
    return await res.json();
  } catch (e: any) {
    return { error: e.message };
  }
}

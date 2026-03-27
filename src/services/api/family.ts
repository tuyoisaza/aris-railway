import { API_URL, getHeaders, handleResponse } from './base-client';

const unwrapResponse = async (res: Response) => {
  const payload = await res.json();
  return payload?.data ?? payload;
};

export const createFamily = async (userId: string, name: string) => {
  try {
    const res = await fetch(`${API_URL}/families`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ userId, name }),
    });
    await handleResponse(res);
    return await unwrapResponse(res);
  } catch (e: any) {
    console.error('Create Family API Error:', e);
    return { error: e.message };
  }
};

export const getFamily = async (userId: string) => {
  try {
    const res = await fetch(`${API_URL}/families/${userId}`, { headers: await getHeaders() });
    if (!res.ok) return null;
    return await unwrapResponse(res);
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const getFamilyActivity = async (familyId: string) => {
  try {
    const res = await fetch(`${API_URL}/families/${familyId}/activity`, { headers: await getHeaders() });
    if (!res.ok) return { family: null, members: [], recentEvents: [], stats: {} };
    return await unwrapResponse(res);
  } catch (e: any) {
    console.error(e);
    return { family: null, members: [], recentEvents: [], stats: {} };
  }
};

export const getFamilyMembers = async (familyId: string) => {
  try {
    const res = await fetch(`${API_URL}/families/${familyId}/members`, { headers: await getHeaders() });
    if (!res.ok) return [];
    return await unwrapResponse(res);
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const inviteMember = async (familyId: string, email: string, userId: string) => {
  try {
    const res = await fetch(`${API_URL}/invites`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ familyId, email, userId }),
    });
    return await unwrapResponse(res);
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const updatePin = async (familyId: string, pin: string) => {
  try {
    const res = await fetch(`${API_URL}/settings/pin`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ familyId, pin }),
    });
    return await unwrapResponse(res);
  } catch (e: any) {
    console.error(e);
    return false;
  }
};

export const deleteFamilyMember = async (memberId: string) => {
  try {
    const res = await fetch(`${API_URL}/families/members/${memberId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return res.ok;
  } catch (e: any) {
    console.error(e);
    return false;
  }
};

export const deleteInvite = async (inviteId: string) => {
  try {
    const res = await fetch(`${API_URL}/invites/${inviteId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete');
    }
    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message };
  }
};

export const getInvites = async (familyId: string) => {
  try {
    const res = await fetch(`${API_URL}/invites/${familyId}`, { headers: await getHeaders() });
    if (!res.ok) return [];
    return await unwrapResponse(res);
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const acceptInvite = async (token: string, userId: string) => {
  try {
    const res = await fetch(`${API_URL}/invites/${token}/accept`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ token, userId }),
    });
    return await unwrapResponse(res);
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message };
  }
};

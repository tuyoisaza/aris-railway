import { API_URL, getHeaders } from './base-client';

export const createFamily = async (userId: string, name: string) => {
  try {
    const res = await fetch(`${API_URL}/family`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ userId, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server Error: ${res.status}`);
    }
    return await res.json();
  } catch (e: any) {
    console.error('Create Family API Error:', e);
    return { error: e.message };
  }
};

export const getFamily = async (userId: string) => {
  try {
    const res = await fetch(`${API_URL}/family/${userId}`, { headers: await getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch family');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const getFamilyActivity = async (familyId: string) => {
  try {
    const res = await fetch(`${API_URL}/family/${familyId}/activity`, { headers: await getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const inviteMember = async (familyId: string, email: string, userId: string) => {
  try {
    const res = await fetch(`${API_URL}/invite`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ familyId, email, userId }),
    });
    return await res.json();
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
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return false;
  }
};

export const deleteFamilyMember = async (memberId: string) => {
  try {
    const res = await fetch(`${API_URL}/family/${memberId}`, {
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
    console.log('[API] Deleting invite:', inviteId);
    const res = await fetch(`${API_URL}/invite/${inviteId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    const data = await res.json();
    console.log('[API] Delete response:', data);
    if (!res.ok) throw new Error(data.error || 'Failed to delete');
    return { success: true };
  } catch (e: any) {
    console.error('[API] Delete invite error:', e);
    return { success: false, error: e.message };
  }
};

export const getInvites = async (familyId: string) => {
  try {
    const res = await fetch(`${API_URL}/invites/${familyId}`, { headers: await getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const acceptInvite = async (token: string, userId: string) => {
  try {
    console.log('[API] Accepting invite:', token?.substring(0, 8) + '...');
    const res = await fetch(`${API_URL}/invite/accept`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ token, userId }),
    });
    const data = await res.json();
    console.log('[API] Accept invite response:', data);
    return data;
  } catch (e: any) {
    console.error('[API] Accept invite error:', e);
    return { success: false, error: e.message };
  }
};

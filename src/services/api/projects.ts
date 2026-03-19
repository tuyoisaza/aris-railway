import { API_URL, getHeaders, handleResponse } from './base-client';

export const getProjects = async (userId: string) => {
  try {
    const res = await fetch(`${API_URL}/projects/${userId}`, { headers: await getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const createProjectFromSkill = async (data: any) => {
  try {
    const res = await fetch(`${API_URL}/projects/from-skill`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Architecting failed');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const createProject = async (projectData: any) => {
  try {
    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(projectData),
    });
    if (!res.ok) throw new Error('Create failed');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const updateProject = async (projectId: string, updates: any) => {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ projectId, ...updates }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error('Update failed:', res.status, errBody);
      throw new Error(`Update failed: ${res.status} ${errBody}`);
    }
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return res.ok;
  } catch (e: any) {
    console.error(e);
    return false;
  }
};

export const architectProject = async (projectId: string) => {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}/architect`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    await handleResponse(res);
    return await res.json();
  } catch (e: any) {
    console.error('Error architecting project:', e);
    throw e;
  }
};

export const startProjectConversation = async (projectId: string) => {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}/conversation`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to start conversation');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const getProjectArtifacts = async (projectId: string) => {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}/artifacts`, { headers: await getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const addProjectArtifact = async (projectId: string, artifact: any) => {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}/artifacts`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(artifact),
    });
    if (!res.ok) throw new Error('Failed to add artifact');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

export const deleteProjectArtifact = async (artifactId: string) => {
  try {
    const res = await fetch(`${API_URL}/projects/artifacts/${artifactId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return res.ok;
  } catch (e: any) {
    console.error(e);
    return false;
  }
};

export const getProjectReflections = async (projectId: string) => {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}/reflections`, { headers: await getHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const addProjectReflection = async (projectId: string, content: string) => {
  try {
    const res = await fetch(`${API_URL}/projects/${projectId}/reflections`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to add reflection');
    return await res.json();
  } catch (e: any) {
    console.error(e);
    return null;
  }
};

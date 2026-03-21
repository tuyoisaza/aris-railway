import { get, post, del } from './base-client';

export async function getSkills() {
    return get('/api/skills');
}

export async function getAllSkills() {
    return get('/api/skills/all');
}

export async function createSkill(data: { title: string; category?: string; description?: string }) {
    return post('/api/skills', data);
}

export async function deleteSkill(id: string) {
    return del(`/api/skills/${id}`);
}

export async function deleteSkills(ids: string[]) {
    return del('/api/skills', { ids });
}

export async function getSkillNotifications() {
    return get('/api/skills/notifications');
}

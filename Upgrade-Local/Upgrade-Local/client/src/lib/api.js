import { supabase } from './supabase';

const API_URL = '/api'; // Vite proxy redirects this to localhost:8080

const getAuthHeaders = async () => {
    // Try real Supabase session first
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };
    }

    // Fallback to mock session for dev mode
    const mockSessionStr = localStorage.getItem('upgrade_mock_session');
    if (mockSessionStr) {
        try {
            const mockSession = JSON.parse(mockSessionStr);
            if (mockSession?.session?.access_token) {
                return {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mockSession.session.access_token}`
                };
            }
        } catch (e) {
            console.warn('Failed to parse mock session');
        }
    }

    throw new Error('No active session');
};

export const api = {
    // User Profile
    getUserProfile: async () => {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/user`, { headers });
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
    },

    // Stripe
    createCheckoutSession: async (plan) => {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/create-checkout-session`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ plan })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Checkout failed');
        }

        return res.json(); // returns { url: string }
    },

    // Save Progress
    saveTestProgress: async (axis, data) => {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/user/progress`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ axis, data })
        });
        if (!res.ok) throw new Error('Failed to save progress');
        return res.json();
    },

    // Translations
    getTranslations: async (lang) => {
        const res = await fetch(`${API_URL}/translations/${lang}`);
        if (!res.ok) throw new Error('Failed to fetch translations');
        return res.json();
    },

    // Courses (localized)
    getCourseContent: async (id, lang) => {
        const res = await fetch(`${API_URL}/courses/${id}/content/${lang}`);
        if (!res.ok) throw new Error('Failed to fetch course content');
        return res.json();
    },

    // Tests (Questions)
    getTests: async () => {
        const res = await fetch(`${API_URL}/tests`);
        if (!res.ok) throw new Error('Failed to fetch tests');
        return res.json();
    },

    // Journal
    saveJournalEntry: async (entry) => {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/user/journal`, {
            method: 'POST',
            headers,
            body: JSON.stringify(entry)
        });
        if (!res.ok) throw new Error('Failed to save journal entry');
        return res.json();
    },

    // Admin
    getAdminQuestions: async (axis) => {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/admin/questions/${axis}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch admin questions');
        return res.json();
    },

    saveQuestion: async (question) => {
        const headers = await getAuthHeaders();
        const method = question.id ? 'PUT' : 'POST';
        const url = question.id ? `${API_URL}/admin/questions/${question.id}` : `${API_URL}/admin/questions`;

        const res = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(question)
        });
        if (!res.ok) throw new Error('Failed to save question');
        return res.json();
    },

    deleteQuestion: async (id) => {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/admin/questions/${id}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error('Failed to delete question');
        return res.json();
    },

    // Admin Settings API
    admin: {
        getStatus: async () => {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API_URL}/admin/status`, { headers });
            if (!res.ok) throw new Error('Failed to fetch status');
            return res.json();
        },
        clearCache: async () => {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API_URL}/admin/cache/clear`, {
                method: 'POST',
                headers
            });
            if (!res.ok) throw new Error('Failed to clear cache');
            return res.json();
        },
        reload: async () => {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API_URL}/admin/reload`, {
                method: 'POST',
                headers
            });
            if (!res.ok) throw new Error('Failed to reload');
            return res.json();
        }
    }
};

// Flatten exports for named imports
export const getUserProfile = api.getUserProfile;
export const createCheckoutSession = api.createCheckoutSession;
export const saveProgress = api.saveTestProgress;
export const getTranslations = api.getTranslations;
export const getCourseContent = api.getCourseContent;
export const getTests = api.getTests;
export const saveJournalEntry = api.saveJournalEntry;
export const getAdminQuestions = api.getAdminQuestions;
export const saveQuestion = api.saveQuestion;
export const deleteQuestion = api.deleteQuestion;

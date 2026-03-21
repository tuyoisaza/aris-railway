const API_BASE = '/api';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;
    private unauthorizedCallbacks: Array<() => void> = [];

    constructor() {
        this.baseUrl = API_BASE;
    }

    private async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
        const url = `${this.baseUrl}${endpoint}`;
        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        const token = localStorage.getItem('aris_token');
        if (token) {
            (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.unauthorizedCallbacks.forEach(cb => cb());
                throw new Error('Unauthorized');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                console.error('API Error:', error);
            }
            throw error;
        }
    }

    setUnauthorizedCallback(callback: () => void) {
        this.unauthorizedCallbacks.push(callback);
    }

    async get(endpoint: string, options: RequestOptions = {}): Promise<any> {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint: string, data?: any, options: RequestOptions = {}): Promise<any> {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        });
    }

    async put(endpoint: string, data: any, options: RequestOptions = {}): Promise<any> {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint: string, options: RequestOptions = {}): Promise<any> {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    // Chat methods
    async createConversation(userId: string, title: string, topicId: string | null, language: string) {
        return this.post('/chat/conversation', { userId, title, topicId, language });
    }

    async getConversations(userId: string) {
        return this.get(`/chat/folders/${userId}`);
    }

    async deleteConversation(conversationId: string) {
        return this.delete(`/chat/conversation/${conversationId}`);
    }

    async updateConversation(conversationId: string, updates: any) {
        return this.put(`/chat/conversation/${conversationId}`, updates);
    }

    async createMessage(conversationId: string, role: string, content: string) {
        return this.post('/chat/message', { conversationId, role, content });
    }

    // Skills methods
    async getSkills() {
        return this.get('/skills');
    }

    async getSkillNotifications() {
        return this.get('/skills/notifications');
    }

    // Auth methods
    async login(email: string, password: string) {
        const response = await this.post('/auth/login', { email, password });
        this.setSession(response.session, response.user);
        return response;
    }

    async signup(email: string, password: string, name?: string) {
        const response = await this.post('/auth/signup', { email, password, name });
        this.setSession(response.session, response.user);
        return response;
    }

    async signOut() {
        localStorage.removeItem('aris_token');
        localStorage.removeItem('aris_user');
        authCallbacks.forEach(cb => cb('SIGNED_OUT', null));
    }

    private setSession(session: any, user: any) {
        if (session?.access_token) {
            localStorage.setItem('aris_token', session.access_token);
        }
        if (user) {
            localStorage.setItem('aris_user', JSON.stringify(user));
        }
        authCallbacks.forEach(cb => cb('SIGNED_IN', { user }));
    }

    getSession() {
        const token = localStorage.getItem('aris_token');
        const userStr = localStorage.getItem('aris_user');
        if (token) {
            return {
                data: {
                    session: { access_token: token },
                    user: userStr ? JSON.parse(userStr) : null
                }
            };
        }
        return { data: { session: null, user: null } };
    }
}

const authCallbacks: Array<(event: string, session: any) => void> = [];

export const api = new ApiClient();

export const auth = {
    login: (email: string, password: string) => api.login(email, password),
    signup: (email: string, password: string, options?: { data?: { name?: string } }) => 
        api.signup(email, password, options?.data?.name),
    signOut: () => api.signOut(),
    getSession: () => api.getSession(),
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
        authCallbacks.push(callback);
        const token = localStorage.getItem('aris_token');
        const userStr = localStorage.getItem('aris_user');
        callback('INITIAL_SESSION', token ? { user: userStr ? JSON.parse(userStr) : null } : null);
        return { data: { unsubscribe: () => {
            const idx = authCallbacks.indexOf(callback);
            if (idx > -1) authCallbacks.splice(idx, 1);
        }}};
    }
};

// Legacy supabase export for backward compatibility
// Use api or auth instead for new code
export const supabase = {
    auth: {
        getSession: () => {
            console.warn('Using legacy supabase.auth.getSession - use auth.getSession instead');
            return api.getSession();
        },
        signInWithPassword: async (credentials: { email: string; password: string }) => {
            console.warn('Using legacy supabase.auth.signInWithPassword - use auth.login instead');
            const result = await api.login(credentials.email, credentials.password);
            return { data: result, error: result.error ? { message: result.error } : null };
        },
        signUp: async (credentials: { email: string; password: string; options?: { data?: { name?: string } } }) => {
            console.warn('Using legacy supabase.auth.signUp - use auth.signup instead');
            const result = await api.signup(credentials.email, credentials.password, credentials.options?.data?.name);
            return { data: result, error: result.error ? { message: result.error } : null };
        },
        signOut: () => {
            console.warn('Using legacy supabase.auth.signOut - use auth.signOut instead');
            return api.signOut();
        },
        onAuthStateChange: (callback: (event: string, session: any) => void) => {
            console.warn('Using legacy supabase.auth.onAuthStateChange - use auth.onAuthStateChange instead');
            return auth.onAuthStateChange(callback);
        }
    },
    from: (table: string) => ({
        select: (columns = '*') => ({
            eq: (column: string, value: any) => ({
                single: async () => {
                    console.warn(`Using legacy supabase.from('${table}').select().eq() - implement API call instead`);
                    return { data: null, error: { message: 'Not implemented without Supabase' } };
                },
                then: async (cb: (result: { data: any; error: any }) => void) => {
                    console.warn(`Using legacy supabase.from('${table}').select().eq() - implement API call instead`);
                    cb({ data: [], error: null });
                },
            }),
            then: async (cb: (result: { data: any; error: any }) => void) => {
                console.warn(`Using legacy supabase.from('${table}').select() - implement API call instead`);
                cb({ data: [], error: null });
            },
        }),
        insert: (data: any) => ({
            then: async (cb: (result: { data: any; error: any }) => void) => {
                console.warn(`Using legacy supabase.from('${table}').insert() - implement API call instead`);
                cb({ data: null, error: null });
            },
        }),
        update: (data: any) => ({
            eq: (column: string, value: any) => ({
                then: async (cb: (result: { data: any; error: any }) => void) => {
                    console.warn(`Using legacy supabase.from('${table}').update().eq() - implement API call instead`);
                    cb({ data: null, error: null });
                },
            }),
        }),
        delete: () => ({
            eq: (column: string, value: any) => ({
                then: async (cb: (result: { data: any; error: any }) => void) => {
                    console.warn(`Using legacy supabase.from('${table}').delete().eq() - implement API call instead`);
                    cb({ data: null, error: null });
                },
            }),
        }),
    }),
    storage: {
        from: (bucket: string) => ({
            upload: (path: string, file: File) => {
                console.warn(`Using legacy supabase.storage - implement API call instead`);
                return Promise.resolve({ data: null, error: { message: 'Storage not implemented' } });
            },
            getPublicUrl: (path: string) => ({ data: { publicUrl: `/storage/${bucket}/${path}` } }),
        }),
    },
};

export default { auth, api, supabase };

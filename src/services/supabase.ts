const API_BASE = '/api';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;

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
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async get(endpoint: string, options: RequestOptions = {}): Promise<any> {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint: string, data: any, options: RequestOptions = {}): Promise<any> {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
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
}

export const api = new ApiClient();

type AuthCallback = (event: string, session: { access_token?: string; user?: any } | null) => void;

class AuthManager {
    private listeners: Set<AuthCallback> = new Set();
    private currentSession: { access_token?: string; user?: any } | null = null;

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        const token = localStorage.getItem('aris_token');
        const userStr = localStorage.getItem('aris_user');
        if (token) {
            this.currentSession = {
                access_token: token,
                user: userStr ? JSON.parse(userStr) : null
            };
        }
    }

    private notifyListeners(event: string, session: typeof this.currentSession) {
        this.listeners.forEach(cb => cb(event, session));
    }

    async login(email: string, password: string): Promise<{ user: any; session: any }> {
        const response = await api.post('/auth/login', { email, password });
        this.setSession(response.session, response.user);
        return response;
    }

    async signup(email: string, password: string, name?: string): Promise<{ user: any; session: any }> {
        const response = await api.post('/auth/signup', { email, password, name });
        this.setSession(response.session, response.user);
        return response;
    }

    private setSession(session: any, user: any) {
        if (session?.access_token) {
            localStorage.setItem('aris_token', session.access_token);
        }
        if (user) {
            localStorage.setItem('aris_user', JSON.stringify(user));
        }
        this.currentSession = {
            access_token: session?.access_token,
            user
        };
        this.notifyListeners('AUTH_STATE_CHANGED', this.currentSession);
    }

    async signOut() {
        localStorage.removeItem('aris_token');
        localStorage.removeItem('aris_user');
        this.currentSession = null;
        this.notifyListeners('SIGNED_OUT', null);
    }

    async getSession(): Promise<{ data: { session: any; user: any } }> {
        if (this.currentSession) {
            return {
                data: {
                    session: this.currentSession,
                    user: this.currentSession.user
                }
            };
        }
        return { data: { session: null, user: null } };
    }

    onAuthStateChange(callback: AuthCallback): { data: { unsubscribe: () => void } } {
        this.listeners.add(callback);
        callback('INITIAL_SESSION', this.currentSession);
        return {
            data: {
                unsubscribe: () => this.listeners.delete(callback)
            }
        };
    }
}

export const authManager = new AuthManager();

export const supabase = {
    auth: {
        login: (email: string, password: string) => authManager.login(email, password),
        signup: (email: string, password: string, options?: { data: { name?: string } }) => 
            authManager.signup(email, password, options?.data?.name),
        signOut: () => authManager.signOut(),
        getSession: () => authManager.getSession(),
        onAuthStateChange: (callback: AuthCallback) => authManager.onAuthStateChange(callback)
    },
    from: (table: string) => ({
        select: (columns = '*') => ({
            eq: (column: string, value: any) => ({
                single: () => api.get(`/${table}?${column}=${value}`),
                then: (cb: (result: { data: any; error: any }) => void) => 
                    api.get(`/${table}?${column}=${value}`).then(r => cb({ data: r, error: null })),
            }),
            then: (cb: (result: { data: any; error: any }) => void) => 
                api.get(`/${table}`).then(r => cb({ data: r, error: null })),
        }),
        insert: (data: any) => ({
            then: (cb: (result: { data: any; error: any }) => void) => 
                api.post(`/${table}`, data).then(r => cb({ data: r, error: null })),
        }),
        update: (data: any) => ({
            eq: (column: string, value: any) => ({
                then: (cb: (result: { data: any; error: any }) => void) => 
                    api.put(`/${table}?${column}=${value}`, data).then(r => cb({ data: r, error: null })),
            }),
        }),
        delete: () => ({
            eq: (column: string, value: any) => ({
                then: (cb: (result: { data: any; error: any }) => void) => 
                    api.delete(`/${table}?${column}=${value}`).then(r => cb({ data: r, error: null })),
            }),
        }),
    }),
    storage: {
        from: (bucket: string) => ({
            upload: (path: string, file: File) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('path', path);
                return api.post(`/storage/${bucket}/upload`, formData, {
                    headers: {}
                });
            },
            getPublicUrl: (path: string) => ({ data: { publicUrl: `/storage/${bucket}/${path}` } }),
        }),
    },
};

export default supabase;

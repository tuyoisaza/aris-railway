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

export const auth = {
    async login(email: string, password: string) {
        return api.post('/auth/login', { email, password });
    },
    
    async signup(email: string, password: string, name: string) {
        return api.post('/auth/signup', { email, password, name });
    },
    
    async getSession() {
        const token = localStorage.getItem('aris_token');
        const userStr = localStorage.getItem('aris_user');
        if (token && userStr) {
            return {
                data: {
                    session: { access_token: token },
                    user: JSON.parse(userStr)
                }
            };
        }
        return { data: { session: null, user: null } };
    },
    
    setSession(session: any, user: any) {
        if (session?.access_token) {
            localStorage.setItem('aris_token', session.access_token);
        }
        if (user) {
            localStorage.setItem('aris_user', JSON.stringify(user));
        }
    },
    
    clearSession() {
        localStorage.removeItem('aris_token');
        localStorage.removeItem('aris_user');
    },
    
    onAuthStateChange(callback: (event: string, session: any) => void) {
        const checkAuth = () => {
            const token = localStorage.getItem('aris_token');
            callback('INITIAL_SESSION', token ? { access_token: token } : null);
        };
        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }
};

export const supabase = {
    auth: auth,
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

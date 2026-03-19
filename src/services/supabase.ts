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

export default { auth, api };

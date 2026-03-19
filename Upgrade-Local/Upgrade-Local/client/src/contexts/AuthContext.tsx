import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    subscription_status: 'free' | 'active' | 'past_due' | 'cancelled';
    is_super_admin?: boolean;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    signInMock: (options?: { plan?: string; isSuperAdmin?: boolean }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check for mock session first
        const storedMock = localStorage.getItem('upgrade_mock_session');
        console.log("AuthContext: Checking storage...", storedMock ? "Found" : "Empty");

        if (storedMock) {
            console.log("AuthContext: Loading mock session");
            try {
                const parsed = JSON.parse(storedMock);
                console.log("AuthContext: Parsed mock user:", parsed.user?.email);
                console.log("AuthContext: Parsed mock user:", parsed.user?.email);
                setSession(parsed.session);
                setUser(parsed.user);
                // Mock profile
                const mockProfile = parsed.profile || {
                    id: parsed.user.id,
                    email: parsed.user.email,
                    full_name: parsed.user.user_metadata.full_name,
                    avatar_url: parsed.user.user_metadata.avatar_url,
                    subscription_status: 'active', // Default mock to active
                    is_super_admin: parsed.user?.isSuperAdmin || false
                };
                setProfile(mockProfile);
                setLoading(false);
                return; // Skip Supabase check if mock is active
            } catch (e) {
                console.error("AuthContext: Failed to parse mock session", e);
                localStorage.removeItem('upgrade_mock_session');
            }
        }

        // 2. Check Supabase session
        console.log("AuthContext: Checking Supabase session");
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("AuthContext: Supabase session result:", session ? "Found" : "Null");
            if (!localStorage.getItem('upgrade_mock_session')) {
                if (session?.user) {
                    // Fetch profile
                    supabase.from('profiles').select('*').eq('id', session.user.id).single()
                        .then(({ data, error }) => {
                            if (!error && data) setProfile(data);
                        });
                }
                setSession(session);
                setUser(session?.user ?? null);
            }
            setLoading(false);
        });

        // 3. Listen for Supabase changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!localStorage.getItem('upgrade_mock_session')) {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    supabase.from('profiles').select('*').eq('id', session.user.id).single()
                        .then(({ data, error }) => {
                            if (!error && data) setProfile(data);
                            else setProfile(null);
                        });
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        // Clear mock session
        localStorage.removeItem('upgrade_mock_session');
        if (session?.user?.email === 'dev@upgrade.local') {
            setSession(null);
            setUser(null);
            setProfile(null);
        }
    };

    const signInMock = (options: { plan?: string; isSuperAdmin?: boolean } = {}) => {
        console.log("AuthContext: signInMock called", options);
        // Default plan is 'active' (paid) if not specified, or we can make it explicit
        const plan = options.plan || 'active';
        const isSuperAdmin = options.isSuperAdmin || false;
        const mockUser = {
            id: 'mock-user-id',
            email: 'dev@upgrade.local',
            user_metadata: {
                full_name: 'Developer Mode',
                avatar_url: 'https://ui-avatars.com/api/?name=Dev+Mode'
            },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
        } as User;

        const mockSession = {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: mockUser
        } as Session;

                const mockProfile: Profile = {
                    id: mockUser.id,
                    email: mockUser.email!,
                    full_name: mockUser.user_metadata.full_name,
                    avatar_url: mockUser.user_metadata.avatar_url,
                    subscription_status: plan as any,
                    is_super_admin: isSuperAdmin
                };

        // Inject isSuperAdmin into user object for local checks
        (mockUser as any).isSuperAdmin = isSuperAdmin;

        console.log("AuthContext: Setting user and session to mock values + Persistence");
        localStorage.setItem('upgrade_mock_session', JSON.stringify({ session: mockSession, user: mockUser, profile: mockProfile }));

        setUser(mockUser);
        setSession(mockSession);
        setProfile(mockProfile);
        setLoading(false);
    };

    const value = {
        user,
        session,
        profile,
        loading,
        signOut,
        signInMock
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

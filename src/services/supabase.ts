import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY; // Note: .env says VITE_SUPABASE_KEY, often it's VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase Environment Variables!', { supabaseUrl, supabaseAnonKey });
}

// Fallback handler to prevent crashes when env vars are missing
const createSafeProxy = () => {
    return new Proxy({}, {
        get: (target, prop) => {
            // Return a function that logs a warning for any method call
            return (...args: any[]) => {
                console.warn(`Supabase client not initialized. Call to "${String(prop)}" ignored.`, args);
                // Return a structure that mimics common Supabase responses to prevent further crashes
                return { data: null, error: { message: 'Supabase not initialized' }, session: null };
            };
        }
    }) as any;
};

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createSafeProxy();

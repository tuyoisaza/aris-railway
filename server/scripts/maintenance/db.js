import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config(); // Rely on root or server folder loading

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[DB] CRITICAL: Missing required environment variables');
    console.error('[DB] Required: SUPABASE_URL, SUPABASE_SERVICE_KEY');
    console.error('[DB] Dashboard: https://supabase.com/dashboard/project/_/settings/api');
    console.warn('[DB] Server will continue to run to allow inspection, but database features will fail.');
}

/**
 * Admin client - Uses service role key
 */
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

/**
 * Anon client - Uses anon key
 */
export const supabaseAnon = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Create a client authenticated with a user's JWT
 */
export const createUserClient = (accessToken) => {
    if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
        throw new Error('Database client not initialized. Check environment variables.');
    }
    if (!accessToken) {
        throw new Error('Access token required for user client');
    }

    return createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

// Default export for backwards compatibility
export default supabaseAdmin;

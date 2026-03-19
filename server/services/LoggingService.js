import { supabaseAdmin } from '../db.js';

export const LoggingService = {
    /**
     * Log a system action
     * @param {string} action - The action name (e.g., 'TEST_LOGIN', 'USER_UPDATE')
     * @param {object} user - The user object performing the action (id, role, etc.)
     * @param {string} result - 'SUCCESS' | 'FAILURE'
     * @param {object} metadata - Additional details
     */
    log: async (action, user, result, metadata = {}) => {
        try {
            // 1. Check Global Debug Switch
            const { data: setting } = await supabaseAdmin
                .from('system_settings')
                .select('value')
                .eq('key', 'global_debug')
                .single();

            const isDebugOn = setting?.value === true || setting?.value === 'true';

            // Only log if Debug is ON
            if (!isDebugOn) return;

            // 2. Write to System Logs
            const { error } = await supabaseAdmin
                .from('system_logs')
                .insert([{
                    action,
                    user_id: user?.id,
                    user_role: user?.is_super_admin ? 'super_admin' : (user?.role || 'user'),
                    result,
                    metadata,
                    timestamp: new Date().toISOString()
                }]);

            if (error) {
                console.error('[LoggingService] Failed to write log:', error.message);
            }

        } catch (err) {
            console.error('[LoggingService] Error:', err);
        }
    },

    /**
     * Set Global Debug Mode
     * @param {boolean} value 
     * @param {string} userId - Who changed it
     */
    setDebugMode: async (value, userId) => {
        try {
            // Attempt to update with user tracking
            const { error } = await supabaseAdmin
                .from('system_settings')
                .upsert({
                    key: 'global_debug',
                    value: !!value, // Ensure boolean
                    updated_at: new Date().toISOString(),
                    // Remove updated_by for now to avoid FK issues during debug
                    // updated_by: userId 
                });

            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('[LoggingService] Failed to set debug mode:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get Global Debug Mode status
     */
    getDebugMode: async () => {
        try {
            const { data } = await supabaseAdmin
                .from('system_settings')
                .select('value')
                .eq('key', 'global_debug')
                .single();

            return data?.value === true || data?.value === 'true';
        } catch (err) {
            return false;
        }
    }
};

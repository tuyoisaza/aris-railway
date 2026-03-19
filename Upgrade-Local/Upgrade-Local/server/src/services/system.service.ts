import { supabase } from '../db';


export interface SystemLog {
    level: 'info' | 'warn' | 'error' | 'debug';
    action: string;
    userId?: string;
    result?: 'success' | 'failure';
    details?: any;
}

export class SystemService {

    /**
     * Get a system setting by key
     */
    static async getSetting<T>(key: string, defaultValue: T): Promise<T> {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error || !data) {
            return defaultValue;
        }

        return data.value as T;
    }

    /**
     * Update a system setting
     */
    static async updateSetting(key: string, value: any, userId: string) {
        const { error } = await supabase
            .from('system_settings')
            .upsert({
                key,
                value,
                updated_by: userId,
                updated_at: new Date()
            });

        if (error) throw error;
    }

    /**
     * Check if Debug Mode is ON
     */
    static async isDebugMode(): Promise<boolean> {
        return this.getSetting<boolean>('debug_mode', false);
    }

    /**
     * Write to System Logs (if Debug Mode is ON)
     */
    static async log(entry: SystemLog) {
        try {
            // Check global switch first
            const debugMode = await this.isDebugMode();
            if (!debugMode) return;

            // Write to DB
            await supabase.from('system_logs').insert({
                level: entry.level,
                action: entry.action,
                user_id: entry.userId,
                result: entry.result,
                details: entry.details,
                timestamp: new Date()
            });

        } catch (err) {
            // Fallback to console if DB logging fails, but don't crash
            console.error('Failed to write system log:', err);
        }
    }
}

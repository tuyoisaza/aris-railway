import { supabase } from '../db';
import { SystemService } from './system.service';

export class UserService {

    /**
     * List all users with optional filtering
     */
    static async listUsers(filters: {
        plan?: string;
        isSuperAdmin?: boolean;
        search?: string
    } = {}) {
        let query = supabase
            .from('profiles')
            .select(`
                id, email, full_name, 
                subscription_status, is_super_admin, 
                created_at
            `)
            .order('created_at', { ascending: false });

        if (filters.plan) {
            query = query.eq('subscription_status', filters.plan);
        }

        if (filters.isSuperAdmin !== undefined) {
            query = query.eq('is_super_admin', filters.isSuperAdmin);
        }

        if (filters.search) {
            query = query.ilike('email', `%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Get a single user by ID
     */
    static async getUser(id: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Create a new user (Auth + Profile)
     * Note: This requires Service Role for auth.admin.createUser
     */
    static async createUser(data: { email: string; fullName: string; plan?: string; isSuperAdmin?: boolean }) {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: data.email,
            email_confirm: true, // Auto-confirm for admin created users? Usually yes.
            user_metadata: { full_name: data.fullName }
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        // 2. Update Profile (User Trigger handles basic creation, but we need to set specific fields)
        // Wait briefly for trigger? Or just update. Upsert is safest.

        await new Promise(r => setTimeout(r, 500)); // Tiny yield for trigger

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: data.email,
                full_name: data.fullName,
                subscription_status: data.plan || 'free',
                is_super_admin: data.isSuperAdmin || false
            });

        if (profileError) {
            // Rollback auth user if profile fails? 
            // For now, throw error.
            throw profileError;
        }

        await SystemService.log({
            level: 'info',
            action: 'user:create',
            details: { created_user_id: userId, plan: data.plan }
        });

        return { id: userId, ...data };
    }

    /**
     * Update user details (Plan, Role, Status)
     */
    static async updateUser(id: string, updates: {
        plan?: string;
        isSuperAdmin?: boolean;
        fullName?: string;
    }, adminId: string) {

        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_status: updates.plan,
                is_super_admin: updates.isSuperAdmin,
                full_name: updates.fullName,
                updated_at: new Date()
            })
            .eq('id', id);

        if (error) throw error;

        await SystemService.log({
            level: 'info',
            action: 'user:update',
            userId: adminId,
            details: { target_user_id: id, updates }
        });
    }

    /**
     * Soft Delete (Deactivate)
     * For now, we don't have a 'deleted_at' column in profiles defined in previous phases?
     * Checking schema... profiles has `subscription_status`. 
     * Maybe we add a `status` column? Or just use `subscription_status` = 'cancelled'?
     * The Brief says: "Soft delete... Data preserved... User cannot log in".
     * Best way: Ban user in Auth.
     */
    static async deleteUser(id: string, adminId: string) {
        // Soft delete via Auth Ban
        const { error } = await supabase.auth.admin.updateUserById(id, { ban_duration: '876000h' }); // 100 years
        if (error) throw error;

        await SystemService.log({
            level: 'warn',
            action: 'user:delete',
            userId: adminId,
            details: { target_user_id: id, type: 'soft-ban' }
        });
    }

    /**
     * Send Password Reset Email
     */
    static async sendPasswordReset(id: string, adminId: string) {
        // Need email first
        const user = await this.getUser(id);
        if (!user || !user.email) throw new Error("User not found or no email");

        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: process.env.CLIENT_URL + '/reset-password' // standard method
        });

        // Alternatively generate link: supabase.auth.admin.generateLink(...)

        if (error) throw error;

        await SystemService.log({
            level: 'info',
            action: 'user:reset_password',
            userId: adminId,
            details: { target_user_id: id }
        });
    }
}

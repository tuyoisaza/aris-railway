import { Router, Request, Response } from 'express';
import { supabase } from '../db';
import { verifyAdmin } from '../middleware/auth';

const router = Router();

// Delete User (and Profile)
router.delete('/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // Delete from Auth (Service Role required)
        // Since we are using standard supabase client in db.ts, it might be Anon key?
        // Wait, db.ts usually initializes with SERVICE_ROLE_KEY if available.
        // Let's assume 'supabase' exported from db.ts has admin privileges if configured correctly.
        // Actually, for deleteUser, we need the admin auth client.

        const { error } = await supabase.auth.admin.deleteUser(id);

        if (error) throw error;

        // Profile should cascade delete if FK is set, or we delete manually
        // But usually deleting Auth user is enough if "ON DELETE CASCADE" is set.
        // If not, we might need to delete profile first.

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Subscription Status
router.patch('/:id/subscription', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active', 'trialing', 'canceled', etc.

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ subscription_status: status })
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Subscription updated successfully' });
    } catch (error: any) {
        console.error('Error updating subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create User (Admin invite)
router.post('/', verifyAdmin, async (req: Request, res: Response) => {
    const { email, full_name, subscription_status, is_super_admin } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Invite user via Supabase Auth (sends magic link)
        const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: { full_name: full_name || '' }
        });

        if (authError) throw authError;

        // Update profile with additional data if needed
        if (authData.user && (full_name || subscription_status !== undefined || is_super_admin !== undefined)) {
            await supabase
                .from('profiles')
                .update({
                    full_name: full_name || null,
                    subscription_status: subscription_status || 'free',
                    is_super_admin: !!is_super_admin
                })
                .eq('id', authData.user.id);
        }

        res.json({ message: 'User invited successfully', user: authData.user });
    } catch (error: any) {
        console.error('Error inviting user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update User Profile
router.put('/:id', verifyAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { full_name, email, subscription_status, is_super_admin } = req.body;

    try {
        // Update profile in profiles table
        const updateData: any = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (email !== undefined) updateData.email = email;
        if (subscription_status !== undefined) updateData.subscription_status = subscription_status;
        if (is_super_admin !== undefined) updateData.is_super_admin = !!is_super_admin;

        const { error: profileError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', id);

        if (profileError) throw profileError;

        // If email changed, also update in Auth
        if (email) {
            const { error: authError } = await supabase.auth.admin.updateUserById(id, { email });
            if (authError) {
                console.warn('Could not update auth email:', authError.message);
            }
        }

        res.json({ message: 'User updated successfully' });
    } catch (error: any) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

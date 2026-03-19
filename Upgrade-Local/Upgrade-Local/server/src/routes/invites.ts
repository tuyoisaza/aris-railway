import express, { Request, Response } from 'express';
import { supabase } from '../db';
import { verifyAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { inviteSchema } from '../schemas';

const router = express.Router();

// Claim an invite code
router.post('/claim', verifyAuth, validate(inviteSchema), async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        const userId = req.user.id; // From verifyAuth

        if (!code) return res.status(400).json({ error: 'Invite code is required' });

        // 1. Validate Invite Code
        const { data: invite, error: fetchError } = await supabase
            .from('invites')
            .select('*')
            .eq('code', code)
            .single();

        if (fetchError || !invite) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        if (invite.uses_remaining <= 0) {
            return res.status(410).json({ error: 'Invite code has been fully used' });
        }

        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            return res.status(410).json({ error: 'Invite code has expired' });
        }

        // 2. Decrement Uses
        const { error: updateError } = await supabase
            .from('invites')
            .update({ uses_remaining: invite.uses_remaining - 1 })
            .eq('code', code);

        if (updateError) throw updateError;

        // 3. Mark user as "Invited" (Optional detailed tracking)
        // For now, we assume the successful claim allows the user to proceed.
        // If we wanted to "activate" their subscription or something, we would do it here.
        // e.g. await supabase.from('profiles').update({ ... }).eq('id', userId);

        res.json({ success: true, message: 'Invite claimed successfully' });

    } catch (error: any) {
        console.error('Invite Claim Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

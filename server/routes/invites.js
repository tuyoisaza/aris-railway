import express from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { supabaseAdmin } from '../db.js';
import { log } from '../utils/logger.js';
import { requireAuth, validate } from '../middleware.js';
import { schemas } from '../schemas.js';

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

// POST /api/invite (Create Invite)
router.post('/invite', requireAuth, validate(schemas.invite), async (req, res) => {
    const { familyId, email, userId } = req.body;

    // Enforce identity
    if (userId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized: ID mismatch' });
    }

    log('API', 'INFO', 'Invite', `Creating invite for ${email} to family ${familyId}`);
    try {
        const token = crypto.randomBytes(16).toString('hex');
        const { data, error } = await supabaseAdmin
            .from('invitations')
            .insert([{
                family_id: familyId,
                email,
                token,
                created_by: userId,
                status: 'Pending',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            }])
            .select()
            .single();

        if (error) throw error;

        const baseUrl = isProduction ? 'https://aris.app' : 'http://localhost:5173';
        const inviteLink = `${baseUrl}/join/${token}`;

        // Send email via Resend
        if (process.env.RESEND_API_KEY) {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);

            try {
                const emailResult = await resend.emails.send({
                    from: isProduction ? 'Aris <noreply@aris.app>' : 'Aris <onboarding@resend.dev>',
                    to: [email],
                    subject: "You've been invited to join a family on Aris!",
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1 style="color: #F97316;">You're Invited!</h1>
                            <p>Someone has invited you to join their family on <strong>Aris</strong>, the personal AI tutor.</p>
                            <p>Click the button below to accept the invitation:</p>
                            <a href="${inviteLink}" style="display: inline-block; background: #F97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Accept Invitation</a>
                            <p style="color: #888; font-size: 12px; margin-top: 24px;">This link expires in 7 days.</p>
                        </div>
                    `
                });
                log('Email', 'INFO', 'Invite', `Email sent to ${email}`);
            } catch (emailErr) {
                log('Email', 'ERROR', 'Invite', emailErr.message);
            }
        }

        res.json({ link: inviteLink, invite: data, emailSent: !!process.env.RESEND_API_KEY });

    } catch (err) {
        log('API', 'ERROR', 'Invite', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/invites/:familyId (Get Invites)
// NOTE: This route was /api/invites/:familyId in index.js, NOT /api/invite/:familyId
// If we mount this router at /api/invite, we need to handle the path carefully.
// index.js: app.get('/api/invites/:familyId', ...)
// If I assume this router is mounted at /api/invite, then I should probably change the mount point or the path.
// Actually, 'invites' (plural) vs 'invite' (singular).
// 'POST /api/invite' -> Singular.
// 'GET /api/invites/:familyId' -> Plural.
// 'DELETE /api/invite/:id' -> Singular.
// 'POST /api/invite/accept' -> Singular.
// I will mount this router at `/api` and define full subpaths inside? No, that defeats modularity.
// Best approach: Mount at `/api` and define `router.post('/invite'...)`, `router.get('/invites/:familyId'...)`.
// OR: Mount at `/api/invite` and handle plural via a separate router? No.
// I'll stick to mounting at `/api` and having the router define the sub-paths if they are mixed plural/singular.
// WAIT. Usually routers are mounted at a prefix.
// Let's mount this at `/api` in index.js, so here I define `/invite`, `/invites/:familyId`, etc.
// Better yet: Fix the API consistency? No, "Do not rename conventions arbitrarily".
// So I must preserve `/api/invite` and `/api/invites`.
// I will define the routes here assuming `router` is mounted at `/api`?
// No, usually `app.use('/api', inviteRouter)`.
// So inside here: `router.post('/invite', ...)` and `router.get('/invites/:familyId', ...)`.
// Correct.

router.get('/invites/:familyId', requireAuth, async (req, res) => {
    const { familyId } = req.params;
    const userId = req.user.id;

    if (!z.string().uuid().safeParse(familyId).success) {
        return res.status(400).json({ error: 'Invalid family ID format' });
    }

    try {
        log('API', 'INFO', 'Invites', `Fetching invites for family ${familyId} (Requested by ${userId})`);

        // 1. Manually verify the user is a Parent in this family
        // We use supabaseAdmin here to be 100% sure we can read the membership
        const { data: member, error: memberError } = await supabaseAdmin
            .from('family_members')
            .select('role')
            .eq('family_id', familyId)
            .eq('user_id', userId)
            .single();

        if (memberError || !member) {
            log('API', 'WARN', 'Invites', `Access denied: User ${userId} is not a member of family ${familyId}`);
            return res.status(403).json({ error: 'Unauthorized: Not a member of this family' });
        }

        if (member.role !== 'Parent') {
            log('API', 'WARN', 'Invites', `Access denied: User ${userId} is not a Parent (Role: ${member.role})`);
            return res.status(403).json({ error: 'Unauthorized: Only parents can view invitations' });
        }

        // 2. Fetch invitations using supabaseAdmin to bypass RLS
        const { data, error } = await supabaseAdmin
            .from('invitations')
            .select('*')
            .eq('family_id', familyId)
            .eq('status', 'Pending');

        if (error) {
            log('API', 'ERROR', 'Invites', `Database error: ${error.message}`);
            throw error;
        }

        log('API', 'INFO', 'Invites', `Found ${data?.length || 0} pending invites`);
        res.json(data);
    } catch (err) {
        log('API', 'ERROR', 'Invites', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/invite/:id
router.delete('/invite/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    log('API', 'INFO', 'Invite', `DELETE request for ID: ${id} by user: ${userId}`);

    if (!z.string().uuid().safeParse(id).success) {
        return res.status(400).json({ error: 'Invalid invite ID format' });
    }

    try {
        // 1. Fetch invite to find its family_id
        const { data: invite, error: fetchErr } = await supabaseAdmin
            .from('invitations')
            .select('family_id')
            .eq('id', id)
            .single();

        if (fetchErr || !invite) {
            return res.status(404).json({ error: 'Invite not found' });
        }

        // 2. Verify requestor is a Parent in that family
        const { data: member, error: memberError } = await supabaseAdmin
            .from('family_members')
            .select('role')
            .eq('family_id', invite.family_id)
            .eq('user_id', userId)
            .single();

        if (memberError || !member || member.role !== 'Parent') {
            return res.status(403).json({ error: 'Unauthorized: Only parents can delete invitations' });
        }

        // 3. Delete invite using supabaseAdmin
        const { data, error } = await supabaseAdmin
            .from('invitations')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        log('API', 'INFO', 'Invite', `Deleted invite: ${id}`);
        res.json({ success: true, deleted: data });
    } catch (err) {
        log('API', 'ERROR', 'Invite', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/invite/accept
router.post('/invite/accept', requireAuth, async (req, res) => {
    const { token, userId } = req.body;

    // Enforce identity
    if (userId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized: ID mismatch' });
    }

    log('API', 'INFO', 'Invite', `Accept request - Token: ${token?.substring(0, 8)}... User: ${userId}`);

    if (!token || !userId) {
        return res.status(400).json({ success: false, error: 'Token and userId are required' });
    }

    if (!z.string().uuid().safeParse(userId).success) {
        return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }

    try {
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('invitations')
            .select('*, families(name)')
            .eq('token', token)
            .eq('status', 'Pending')
            .single();

        if (inviteError || !invite) {
            log('API', 'WARN', 'Invite', `Invalid or expired token: ${token?.substring(0, 8)}...`);
            return res.status(404).json({ success: false, error: 'This invitation is invalid or has expired.' });
        }

        if (new Date(invite.expires_at) < new Date()) {
            await supabaseAdmin.from('invitations').update({ status: 'Expired' }).eq('id', invite.id);
            return res.status(400).json({ success: false, error: 'This invitation has expired.' });
        }

        const { data: existingMember } = await supabaseAdmin
            .from('family_members')
            .select('id')
            .eq('family_id', invite.family_id)
            .eq('user_id', userId)
            .single();

        if (existingMember) {
            return res.json({ success: true, familyName: invite.families?.name, message: 'You are already a member of this family.' });
        }

        const { error: memberError } = await req.userClient
            .from('family_members')
            .insert([{
                family_id: invite.family_id,
                user_id: userId,
                role: 'Child',
                active: true,
                stats: { weeklyUsage: 0, avgSession: '0m', activeTopics: 0 }
            }]);

        if (memberError) {
            log('API', 'ERROR', 'Invite', `Failed to add member: ${memberError.message}`);
            throw memberError;
        }

        await supabaseAdmin
            .from('invitations')
            .update({ status: 'Accepted' })
            .eq('id', invite.id);

        log('API', 'INFO', 'Invite', `User ${userId} joined family ${invite.family_id}`);
        res.json({ success: true, familyName: invite.families?.name });

    } catch (err) {
        log('API', 'ERROR', 'Invite', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;

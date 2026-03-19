import express from 'express';
import { log } from '../utils/logger.js';
import { requireAuth } from '../middleware.js';

const router = express.Router();

// PUT /api/user/preferences
router.put('/preferences', requireAuth, async (req, res) => {
    const { preferences } = req.body;
    try {
        const { data, error } = await req.userClient
            .from('users')
            .update({ preferences })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        log('API', 'ERROR', 'User', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/user (Generic Profile Update)
router.put('/', requireAuth, async (req, res) => {
    const { name, age, plan, bio, pin, avatar, avatar_url } = req.body;
    try {
        const updates = {};
        if (name !== undefined) {
            updates.name = name;
        }
        if (age !== undefined) updates.age = parseInt(age, 10) || null;
        if (plan !== undefined) updates.plan = plan; // Be careful in prod
        if (bio !== undefined) updates.bio = bio;
        if (pin !== undefined) updates.pin = pin;
        if (avatar !== undefined) updates.avatar = avatar;
        if (avatar_url !== undefined) updates.avatar = avatar_url; // Normalize to 'avatar' column

        // Ensure we have at least one field to update
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const { data, error } = await req.userClient
            .from('users')
            .update(updates)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        log('API', 'ERROR', 'User', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/user (Get Profile)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { data: profile, error } = await req.userClient
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        // Check if user logged in via OAuth (Google)
        const oauthProvider = req.user.app_metadata?.provider;
        const oauthName = req.user.user_metadata?.full_name || req.user.user_metadata?.name;

        // Sync name from OAuth provider if:
        // 1. User is from OAuth provider (e.g. Google)
        // 2. OAuth name is available and different from current
        // 3. User hasn't explicitly edited their name (tracked by name_edited_at column)
        if (oauthProvider && oauthName && profile.name !== oauthName && !profile.name_edited_at) {
            log('API', 'INFO', 'User', `Syncing OAuth name for user ${req.user.id}: "${oauthName}" (was: "${profile.name}")`);

            // Update the users table with OAuth name
            const { data: updated, error: updateError } = await req.userClient
                .from('users')
                .update({ name: oauthName })
                .eq('id', req.user.id)
                .select()
                .single();

            if (!updateError && updated) {
                return res.json(updated);
            }
        }

        // Also sync avatar from OAuth if not set
        const oauthAvatar = req.user.user_metadata?.avatar_url || req.user.user_metadata?.picture;
        if (oauthAvatar && !profile.avatar) {
            log('API', 'INFO', 'User', `Syncing OAuth avatar for user ${req.user.id}`);

            const { data: updated } = await req.userClient
                .from('users')
                .update({ avatar: oauthAvatar })
                .eq('id', req.user.id)
                .select()
                .single();

            if (updated) {
                return res.json(updated);
            }
        }

        res.json(profile);
    } catch (err) {
        log('API', 'ERROR', 'User', err.message);
        res.status(500).json({ error: err.message });
    }
});


// PUT /api/user/avatar
router.put('/avatar', requireAuth, async (req, res) => {
    const { avatar } = req.body;
    try {
        const { data, error } = await req.userClient
            .from('users')
            .update({ avatar })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        log('API', 'ERROR', 'User', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;

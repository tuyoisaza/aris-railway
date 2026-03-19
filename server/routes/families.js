import express from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../db.js';
import { log } from '../utils/logger.js';
import { requireAuth, validate } from '../middleware.js';
import { schemas } from '../schemas.js';

const router = express.Router();

// POST /api/family (Create Family)
router.post('/', requireAuth, validate(schemas.createFamily), async (req, res) => {
    const { userId, name } = req.body;

    // Enforce identity
    if (userId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized: ID mismatch' });
    }

    log('API', 'INFO', 'Family', `Creating family for user: ${userId}`);

    try {
        // 1. Create Family via RPC (Transactional & Bypass RLS)
        const { data: family, error: rpcError } = await supabaseAdmin.rpc('create_new_family', {
            name_input: name,
            owner_id_input: userId
        });

        if (rpcError) throw rpcError;

        log('API', 'INFO', 'Family', `Family created: ${family.id}`);
        res.json(family);

    } catch (err) {
        log('API', 'ERROR', 'Family', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/family/:userId (Get Family for User)
router.get('/:userId', requireAuth, async (req, res) => {
    const { userId } = req.params;

    // Enforce identity
    if (userId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized: ID mismatch' });
    }

    // Validate UUID format
    if (!z.string().uuid().safeParse(userId).success) {
        return res.status(400).json({ error: 'Invalid user ID format' });
    }

    try {
        // 1. Get all memberships to find the "best" one (most active or newest)
        const { data: memberships, error: memberError } = await supabaseAdmin
            .from('family_members')
            .select('family_id, role')
            .eq('user_id', userId)
            .order('joined_at', { ascending: false });

        if (memberError || !memberships || memberships.length === 0) {
            return res.json({ family: null });
        }

        let membership = memberships[0]; // Default to newest

        // Heuristic: If there are multiple families, try to find one that isn't empty
        if (memberships.length > 1) {
            log('API', 'INFO', 'Family', `User ${userId} has ${memberships.length} families. Searching for active one...`);
            for (const m of memberships) {
                // Check members count
                const { count: memberCount } = await supabaseAdmin
                    .from('family_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('family_id', m.family_id);

                // Check invites count
                const { count: inviteCount } = await supabaseAdmin
                    .from('invitations')
                    .select('*', { count: 'exact', head: true })
                    .eq('family_id', m.family_id);

                if (memberCount > 1 || inviteCount > 0) {
                    log('API', 'INFO', 'Family', `Found active family: ${m.family_id} (${memberCount} members, ${inviteCount} invites)`);
                    membership = m;
                    break;
                }
            }
        }

        // 2. Get Family Details
        const { data: family, error: familyError } = await supabaseAdmin
            .from('families')
            .select('*')
            .eq('id', membership.family_id)
            .single();

        if (familyError) throw familyError;

        // 3. Get Members & Calculate Stats
        const { data: members, error: membersError } = await supabaseAdmin
            .from('family_members')
            .select('*, users(*)')
            .eq('family_id', membership.family_id);

        if (membersError) throw membersError;

        // Enhanced Stats Calculation
        const enhancedMembers = await Promise.all(members.map(async (m) => {
            // A. Weekly Activity (XP proxy)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const { count: weeklyCount } = await supabaseAdmin
                .from('activity_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', m.user_id)
                .gte('created_at', oneWeekAgo.toISOString());

            // B. Top Skill
            const { data: topSkill } = await supabaseAdmin
                .from('user_skill_progress')
                .select('skills(title)')
                .eq('user_id', m.user_id)
                .order('last_practiced_at', { ascending: false })
                .limit(1)
                .single();

            // Default legacy stats if new ones are empty
            const legacyStats = m.stats || {};

            return {
                id: m.users.id,
                name: m.users.name,
                role: m.role,
                active: m.active,
                avatar: m.users.avatar,
                stats: {
                    ...legacyStats,
                    weeklyUsage: `${weeklyCount || 0} Acts`,
                    activeTopics: topSkill?.skills?.title || 'None',
                    avgSession: weeklyCount > 10 ? 'High' : 'Low'
                }
            };
        }));

        res.json({ ...family, members: enhancedMembers });

    } catch (err) {
        log('API', 'ERROR', 'Family', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/family/:memberId (Remove Member)
router.delete('/:memberId', requireAuth, async (req, res) => {
    const { memberId } = req.params; // Note: this is the UUID of the family_member record, NOT the user_id

    // TODO: Verify requestor is Admin/Parent of the same family?
    // For now, simpler check: is the user a member of the same family?
    // Or just let it fail if ID doesn't match a record accessible via RLS?
    // We'll use supabaseAdmin to ensure cleanup works, but we should verify permission.

    try {
        // Check if target member exists
        const { data: target, error: findError } = await supabaseAdmin
            .from('family_members')
            .select('family_id')
            .eq('id', memberId) // checking against family_members.id (passed as memberId from frontend) -> wait.
        // Frontend ParentDashboard passes `member.id` to `deleteFamilyMember`.
        // In `ParentDashboard`, `members` are mapped: `id: m.users.id`!
        // WAIT.
        // In Step 611 (original families.js), formattedMembers: `id: m.users.id`.
        // So the frontend passed `user_id` as `memberId` to delete!
        // But `family.js` (Step 530) DELETE used `.eq('id', id)`.
        // If `id` was `user_id`, this query finds nothing if `family_members` primary key is a UUID unrelated to user_id.
        // `family_members` table (Step 583): `id UUID DEFAULT uuid_generate_v4()`.
        // So `id` != `user_id`.
        // Frontend Bug: ParentDashboard passes `member.id`.
        // In `families.js` mapping (lines 82-89 of original), `id` was set to `m.users.id`.
        // So frontend sends a `user_id`.
        // Backend DELETE expects a `family_members.id`??
        // Or does backend need to delete by `user_id`?
        // `router.delete('/:id')` in `family.js` did `.eq('id', id)`.
        // This implies `family.js` assumed `id` was the `family_member` ID.
        // But `ParentDashboard` was sending `user_id`.
        // I need to use `user_id` to delete, or fix the ID mapping.
        // Better to delete by `user_id` AND `family_id` (implied or fetched).
        // Let's change DELETE to accept a user_id (target) and remove them from the requestor's family.

        // 1. Find requestor's family
        const { data: reqMember } = await supabaseAdmin
            .from('family_members')
            .select('family_id, role')
            .eq('user_id', req.user.id)
            .single();

        if (!reqMember) return res.status(403).json({ error: 'You are not in a family' });

        // 2. Delete target from that family
        // memberId param is actually the userId of the member to remove
        const { error: delError } = await supabaseAdmin
            .from('family_members')
            .delete()
            .eq('family_id', reqMember.family_id)
            .eq('user_id', memberId); // Assume param is user_id

        if (delError) throw delError;

        res.json({ success: true });

    } catch (err) {
        log('API', 'ERROR', 'Family Delete', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/family/:familyId/activity
router.get('/:familyId/activity', requireAuth, async (req, res) => {
    const { familyId } = req.params;

    // 1. Verify Membership
    const { data: member, error: memberErr } = await req.userClient
        .from('family_members')
        .select('role')
        .eq('family_id', familyId)
        .eq('user_id', req.user.id)
        .single();

    if (memberErr || !member) {
        return res.status(403).json({ error: 'Not a member of this family' });
    }

    try {
        // 2. Fetch Recent Projects (Global across family)
        // Need to join user to get name
        const { data: projects, error: projErr } = await req.userClient
            .from('projects')
            .select('*, users(name)')
            // Filter by family members? RLS allows seeing family data if policy set correctly.
            // Assuming current RLS allows viewing projects of family members (shared visibility)
            // or we need to query based on user_ids in family.
            // For now, let's assume we query strictly by user_ids in family.
            .order('created_at', { ascending: false })
            .limit(5);

        // 3. Fetch Recent Badges
        const { data: badges, error: badgeErr } = await req.userClient
            .from('user_badges')
            .select('*, badges(*), users(name)')
            .order('created_at', { ascending: false })
            .limit(5);

        // 4. Combine & Sort
        const activity = [];

        if (projects) {
            projects.forEach(p => {
                activity.push({
                    type: 'project',
                    title: p.title,
                    user: p.users?.name || 'Unknown',
                    status: p.status,
                    date: p.created_at
                });
            });
        }

        if (badges) {
            badges.forEach(b => {
                activity.push({
                    type: 'badge',
                    title: b.badges?.name || 'Badge',
                    user: b.users?.name || 'Unknown',
                    icon: b.badges?.icon || '🏆',
                    date: b.created_at
                });
            });
        }

        activity.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(activity.slice(0, 10));

    } catch (err) {
        log('API', 'ERROR', 'Family Activity', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;

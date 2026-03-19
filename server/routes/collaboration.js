/**
 * Collaboration API Routes
 * Handles collaborative sessions, shared entities, and family collaboration features
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db.js';
import { socketServer } from '../websocket/socketServer.js';
import { log } from '../utils/logger.js';

const router = express.Router();

// Helper function to verify user family membership
const verifyFamilyMember = async (userId, familyId) => {
    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('family_id, role')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        throw new Error('User profile not found');
    }

    if (profile.family_id !== familyId) {
        throw new Error('User is not a member of this family');
    }

    return profile;
};

// Create a new collaborative session
router.post('/sessions', authenticateToken, async (req, res) => {
    try {
        const { name, description, familyId, hostId, goals } = req.body;
        const userId = req.user.userId;

        // Verify user is member of the family
        await verifyFamilyMember(userId, familyId);

        // Create the session
        const { data: session, error } = await supabaseAdmin
            .from('collaborative_sessions')
            .insert({
                name,
                description,
                family_id: familyId,
                host_id: hostId || userId,
                status: 'active',
                goals: goals || []
            })
            .select()
            .single();

        if (error) throw error;

        // Add host as first participant
        await supabaseAdmin
            .from('session_participants')
            .insert({
                session_id: session.id,
                user_id: userId,
                joined_at: new Date().toISOString(),
                contribution_level: 'host'
            });

        // Log collaboration event
        await supabaseAdmin
            .from('collaboration_events')
            .insert({
                session_id: session.id,
                user_id: userId,
                event_type: 'session_created',
                event_data: { session_name: name }
            });

        log('COLLABORATION', 'INFO', 'Session Created', `Session ${session.id} by user ${userId}`);

        res.status(201).json(session);
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Join a collaborative session
router.post('/sessions/join', authenticateToken, async (req, res) => {
    try {
        const { sessionId, userId } = req.body;
        const requestingUserId = req.user.userId;

        // Verify userId matches authenticated user
        if (userId !== requestingUserId) {
            return res.status(403).json({ error: 'Cannot join session for another user' });
        }

        // Get session details
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('collaborative_sessions')
            .select('family_id, status')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status !== 'active') {
            return res.status(400).json({ error: 'Session is not active' });
        }

        // Verify user is member of the family
        await verifyFamilyMember(userId, session.family_id);

        // Check if already a participant
        const { data: existingParticipant } = await supabaseAdmin
            .from('session_participants')
            .select('id')
            .eq('session_id', sessionId)
            .eq('user_id', userId)
            .single();

        if (existingParticipant) {
            return res.status(400).json({ error: 'Already a participant in this session' });
        }

        // Add participant
        await supabaseAdmin
            .from('session_participants')
            .insert({
                session_id: sessionId,
                user_id: userId,
                joined_at: new Date().toISOString(),
                contribution_level: 'participant'
            });

        // Get updated session with participants
        const { data: updatedSession, error: updateError } = await supabaseAdmin
            .from('collaborative_sessions')
            .select(`
                *,
                session_participants(
                    user_id,
                    joined_at,
                    contribution_level
                )
            `)
            .eq('id', sessionId)
            .single();

        if (updateError) throw updateError;

        // Log collaboration event
        await supabaseAdmin
            .from('collaboration_events')
            .insert({
                session_id: sessionId,
                user_id: userId,
                event_type: 'user_joined',
                event_data: {}
            });

        log('COLLABORATION', 'INFO', 'Session Joined', `User ${userId} joined session ${sessionId}`);

        res.json(updatedSession);
    } catch (error) {
        console.error('Error joining session:', error);
        res.status(500).json({ error: error.message });
    }
});

// End a collaborative session
router.post('/sessions/end', authenticateToken, async (req, res) => {
    try {
        const { sessionId, userId } = req.body;
        const requestingUserId = req.user.userId;

        // Verify userId matches authenticated user
        if (userId !== requestingUserId) {
            return res.status(403).json({ error: 'Cannot end session for another user' });
        }

        // Get session details
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('collaborative_sessions')
            .select('host_id, status')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Only host can end session
        if (session.host_id !== userId) {
            return res.status(403).json({ error: 'Only session host can end the session' });
        }

        if (session.status !== 'active') {
            return res.status(400).json({ error: 'Session is already ended' });
        }

        // Update session status
        const { data: updatedSession, error: updateError } = await supabaseAdmin
            .from('collaborative_sessions')
            .update({
                status: 'completed',
                ended_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Log collaboration event
        await supabaseAdmin
            .from('collaboration_events')
            .insert({
                session_id: sessionId,
                user_id: userId,
                event_type: 'session_ended',
                event_data: {}
            });

        log('COLLABORATION', 'INFO', 'Session Ended', `Session ${sessionId} ended by host ${userId}`);

        res.json(updatedSession);
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get active sessions for a family
router.get('/sessions/family/:familyId', authenticateToken, async (req, res) => {
    try {
        const { familyId } = req.params;
        const userId = req.user.userId;

        // Verify user is member of the family
        await verifyFamilyMember(userId, familyId);

        // Get active sessions
        const { data: sessions, error } = await supabaseAdmin
            .from('collaborative_sessions')
            .select(`
                *,
                session_participants(
                    user_id,
                    joined_at,
                    contribution_level,
                    profiles(
                        display_name,
                        avatar_url
                    )
                )
            `)
            .eq('family_id', familyId)
            .in('status', ['active', 'paused'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(sessions || []);
    } catch (error) {
        console.error('Error getting family sessions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Share a topic with family
router.post('/topics/share', authenticateToken, async (req, res) => {
    try {
        const { topicId, familyId } = req.body;
        const userId = req.user.userId;

        // Verify user is member of the family
        await verifyFamilyMember(userId, familyId);

        // Check if topic exists and user owns it
        const { data: topic, error: topicError } = await supabaseAdmin
            .from('topics')
            .select('title, user_id')
            .eq('id', topicId)
            .single();

        if (topicError || !topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }

        if (topic.user_id !== userId) {
            return res.status(403).json({ error: 'Can only share your own topics' });
        }

        // Create shared entity record
        const { data: sharedEntity, error: shareError } = await supabaseAdmin
            .from('shared_entities')
            .insert({
                entity_id: topicId,
                entity_type: 'topic',
                family_id: familyId,
                shared_by: userId,
                entity_name: topic.title,
                shared_with: 'family'
            })
            .select()
            .single();

        if (shareError) throw shareError;

        // Update topic to mark as shared
        await supabaseAdmin
            .from('topics')
            .update({ shared_with_family: true })
            .eq('id', topicId);

        log('COLLABORATION', 'INFO', 'Topic Shared', `Topic ${topicId} shared with family ${familyId} by ${userId}`);

        res.json(sharedEntity);
    } catch (error) {
        console.error('Error sharing topic:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get shared entities for a family
router.get('/shared/:familyId', authenticateToken, async (req, res) => {
    try {
        const { familyId } = req.params;
        const userId = req.user.userId;

        // Verify user is member of the family
        await verifyFamilyMember(userId, familyId);

        // Get shared entities
        const { data: sharedEntities, error } = await supabaseAdmin
            .from('shared_entities')
            .select(`
                *,
                profiles(
                    display_name,
                    avatar_url
                )
            `)
            .eq('family_id', familyId)
            .eq('shared_with', 'family')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(sharedEntities || []);
    } catch (error) {
        console.error('Error getting shared entities:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
/**
 * ActionRegistry.js
 * 
 * Central registry for all system actions in ARIS.
 * Unifies Skills, Topics, Projects, Badges, and Recommendations.
 * Enforces "Action Budget" to ensure conversational rhythm.
 * Enhanced for multi-user family-based learning actions.
 */

import { socketServer } from '../websocket/socketServer.js';

class ActionRegistry {
    constructor() {
        this.actions = new Map();

        // Action Budget Configuration
        // Limits per session to prevent spamming system actions
        this.budgetConfig = {
            'light': 1,   // e.g., recommendations, presence updates
            'medium': 1,  // e.g., topic/skill triggers, collaboration invites
            'heavy': 1    // e.g., projects, badges, collaborative sessions
        };

        // Track usage per session (in-memory for now, could be in Redis/DB)
        this.sessionUsage = new Map();
    }

    /**
     * Register a new action type handler.
     * @param {string} type - Action type identifier (e.g., 'recommendation', 'project:propose')
     * @param {string} category - Budget category ('light', 'medium', 'heavy')
     * @param {Function} handler - Async function to execute the action
     */
    registerAction(type, category, handler) {
        if (!['light', 'medium', 'heavy'].includes(category)) {
            throw new Error(`Invalid action category: ${category}`);
        }
        this.actions.set(type, { category, handler });
        console.log(`[ActionRegistry] Registered action: ${type} (${category})`);
    }

    /**
     * Check if a specific action type is eligible to run for a user/session.
     * Checks rate limits and budget.
     * 
     * @param {string} sessionId - User session ID
     * @param {string} actionType - Type of action requested
     * @returns {boolean} True if eligible
     */
    checkEligibility(sessionId, actionType) {
        const action = this.actions.get(actionType);
        if (!action) {
            console.warn(`[ActionRegistry] Unknown action type: ${actionType}`);
            return false;
        }

        // Initialize session usage if needed
        if (!this.sessionUsage.has(sessionId)) {
            this.sessionUsage.set(sessionId, {
                'light': 0,
                'medium': 0,
                'heavy': 0
            });
        }

        const usage = this.sessionUsage.get(sessionId);
        const limit = this.budgetConfig[action.category];

        if (usage[action.category] >= limit) {
            console.log(`[ActionRegistry] Budget exceeded for ${action.category} (Action: ${actionType})`);
            return false;
        }

        return true;
    }

/**
     * Execute an action.
     * Consumes budget if successful.
     * Broadcasts collaboration events to family members when applicable.
     * 
     * @param {string} sessionId - User session ID
     * @param {string} userId - User ID
     * @param {string} actionType - Type of action
     * @param {Object} payload - Data for the action
     */
    async executeAction(sessionId, userId, actionType, payload) {
        console.log(`[ActionRegistry] Requesting execution: ${actionType}`);

        if (!this.checkEligibility(sessionId, actionType)) {
            return {
                success: false,
                reason: 'budget_exceeded'
            };
        }

        const action = this.actions.get(actionType);

        try {
            // Execute the handler
            const result = await action.handler(userId, payload);

            // Increment usage count on success
            const usage = this.sessionUsage.get(sessionId);
            usage[action.category]++;

            // Broadcast to family members if this is a collaborative action
            if (this.isCollaborativeAction(actionType)) {
                this.broadcastCollaborativeAction(userId, actionType, payload, result);
            }

            return {
                success: true,
                result
            };
        } catch (error) {
            console.error(`[ActionRegistry] Action execution failed: ${actionType}`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if an action type should be broadcast to family members
     */
    isCollaborativeAction(actionType) {
        const collaborativeTypes = [
            'collaboration:invite',
            'collaboration:session_start',
            'collaboration:session_join',
            'family:goal_set',
            'family:challenge_create',
            'shared_entity:create',
            'skill:family_progress'
        ];
        return collaborativeTypes.includes(actionType);
    }

    /**
     * Broadcast collaborative actions to family members via WebSocket
     */
    broadcastCollaborativeAction(userId, actionType, payload, result) {
        try {
            // Get user's family context (this would come from user service in real implementation)
            const familyId = payload.familyId; // For now, assume familyId is in payload
            
            if (familyId) {
                socketServer.broadcastToFamily(familyId, {
                    type: 'collaborative_action',
                    data: {
                        actionType,
                        userId,
                        payload,
                        result,
                        timestamp: Date.now()
                    }
                });
            }
        } catch (error) {
            console.error('[ActionRegistry] Failed to broadcast collaborative action:', error);
        }
    }

    /**
     * Reset budget for a session (e.g., on new conversation).
     */
    resetSessionBudget(sessionId) {
        this.sessionUsage.delete(sessionId);
    }
}

const registry = new ActionRegistry();

// =============================================================================
// DEFAULT ACTIONS SETUP
// =============================================================================

// 1. RECOMMENDATION (Light)
registry.registerAction('recommendation', 'light', async (userId, payload) => {
    // Payload: { type: 'book'|'person'|'movie', reference: '...', reason: '...' }
    // In a real implementation, we might log this to a 'recommendations' table
    console.log(`[Action:Recommendation] Recommended ${payload.type}: ${payload.reference} for user ${userId}`);
    return { recommended: true, payload };
});

// 2. PROJECT PROPOSAL (Heavy)
// Wrapper for ProjectArchitectService (to be properly connected later)
registry.registerAction('project:propose', 'heavy', async (userId, payload) => {
    console.log(`[Action:Project] Proposed project: ${payload.title}`);
    return { proposed: true, payload };
});

// 3. BADGE AWARD (Heavy)
// Wrapper for BadgeService
registry.registerAction('badge:award', 'heavy', async (userId, payload) => {
    console.log(`[Action:Badge] Awarding badge: ${payload.badgeId}`);
    // return BadgeService.awardBadge(userId, payload.badgeId);
    return { awarded: true, badgeId: payload.badgeId };
});

// =============================================================================
// COLLABORATION ACTIONS (Family-based Learning)
// =============================================================================

// 4. COLLABORATION INVITE (Medium)
// Invite family member to join a collaborative activity
registry.registerAction('collaboration:invite', 'medium', async (userId, payload) => {
    // Payload: { targetUserId, activity, message, familyId }
    console.log(`[Action:Collaboration] User ${userId} inviting ${payload.targetUserId} to ${payload.activity}`);
    
    // Send WebSocket invitation
    socketServer.sendToClient(payload.targetUserId, {
        type: 'collaboration_invite',
        data: {
            fromUserId: userId,
            activity: payload.activity,
            message: payload.message,
            timestamp: Date.now()
        }
    });
    
    return { invited: true, targetUserId: payload.targetUserId };
});

// 5. COLLABORATIVE SESSION START (Heavy)
// Start a collaborative learning session with family members
registry.registerAction('collaboration:session_start', 'heavy', async (userId, payload) => {
    // Payload: { familyId, sessionType, title, description, participants }
    console.log(`[Action:Collaboration] Starting session: ${payload.title} for family ${payload.familyId}`);
    
    // Create collaborative session in database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );
    
    const { data: session, error } = await supabase
        .from('collaborative_sessions')
        .insert([{
            family_id: payload.familyId,
            initiated_by: userId,
            session_type: payload.sessionType,
            title: payload.title,
            description: payload.description,
            participants: payload.participants || []
        }])
        .select()
        .single();
    
    if (error) throw error;
    
    // Notify family members
    socketServer.broadcastToFamily(payload.familyId, {
        type: 'collaborative_session_started',
        data: {
            sessionId: session.id,
            initiatedBy: userId,
            sessionType: payload.sessionType,
            title: payload.title,
            timestamp: Date.now()
        }
    });
    
    return { sessionCreated: true, sessionId: session.id };
});

// 6. FAMILY GOAL SET (Medium)
// Set a shared learning goal for the family
registry.registerAction('family:goal_set', 'medium', async (userId, payload) => {
    // Payload: { familyId, goal, targetDate, skillId }
    console.log(`[Action:Family] Setting family goal: ${payload.goal} for family ${payload.familyId}`);
    
    // Store family goal (would need family_goals table)
    // For now, just broadcast the goal
    socketServer.broadcastToFamily(payload.familyId, {
        type: 'family_goal_set',
        data: {
            setBy: userId,
            goal: payload.goal,
            targetDate: payload.targetDate,
            skillId: payload.skillId,
            timestamp: Date.now()
        }
    });
    
    return { goalSet: true, goal: payload.goal };
});

// 7. SHARED ENTITY CREATE (Light)
// Share a topic, skill, or project with family members
registry.registerAction('shared_entity:create', 'light', async (userId, payload) => {
    // Payload: { familyId, entityType, entityId, title, description }
    console.log(`[Action:SharedEntity] Creating shared ${payload.entityType}: ${payload.title}`);
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );
    
    const { data: sharedEntity, error } = await supabase
        .from('shared_entities')
        .insert([{
            family_id: payload.familyId,
            entity_type: payload.entityType,
            entity_id: payload.entityId,
            shared_by: userId,
            title: payload.title,
            description: payload.description,
            tags: payload.tags || []
        }])
        .select()
        .single();
    
    if (error) throw error;
    
    // Notify family members
    socketServer.broadcastToFamily(payload.familyId, {
        type: 'shared_entity_created',
        data: {
            sharedEntityId: sharedEntity.id,
            entityType: payload.entityType,
            title: payload.title,
            sharedBy: userId,
            timestamp: Date.now()
        }
    });
    
    return { shared: true, sharedEntityId: sharedEntity.id };
});

// 8. FAMILY CHALLENGE CREATE (Medium)
// Create a learning challenge for family members
registry.registerAction('family:challenge_create', 'medium', async (userId, payload) => {
    // Payload: { familyId, challenge, skillId, duration, reward }
    console.log(`[Action:Family] Creating family challenge: ${payload.challenge}`);
    
    // Store family challenge (would need family_challenges table)
    socketServer.broadcastToFamily(payload.familyId, {
        type: 'family_challenge_created',
        data: {
            createdBy: userId,
            challenge: payload.challenge,
            skillId: payload.skillId,
            duration: payload.duration,
            reward: payload.reward,
            timestamp: Date.now()
        }
    });
    
    return { challengeCreated: true, challenge: payload.challenge };
});

// 9. SKILL FAMILY PROGRESS (Light)
// Broadcast skill progress updates to family members
registry.registerAction('skill:family_progress', 'light', async (userId, payload) => {
    // Payload: { familyId, skillId, progress, level }
    console.log(`[Action:Skill] Broadcasting family progress for skill ${payload.skillId}`);
    
    socketServer.broadcastSkillProgress(userId, {
        skillId: payload.skillId,
        progress: payload.progress,
        level: payload.level
    });
    
    return { progressBroadcast: true };
});

export default registry;

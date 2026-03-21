import { socketServer } from '../websocket/socketServer.js';
import { log } from '../utils/logger.js';
import { prisma } from '../db.js';

/**
 * PresenceService
 * Manages user presence status and family member visibility
 * Integrates with WebSocket server for real-time updates
 */
class PresenceService {
    constructor() {
        this.presenceCache = new Map(); // userId -> presence data
        this.familyPresence = new Map(); // familyId -> Set of userIds
    }

    /**
     * Initialize presence for a user when they connect
     */
    async initializePresence(userId, familyId, socketId) {
        const presenceData = {
            userId,
            familyId,
            status: 'online',
            lastSeen: Date.now(),
            currentActivity: null,
            currentEntityType: null,
            currentEntityId: null,
            socketId,
            isVisible: true
        };

        // Update cache
        this.presenceCache.set(userId, presenceData);

        // Update family membership
        if (familyId) {
            if (!this.familyPresence.has(familyId)) {
                this.familyPresence.set(familyId, new Set());
            }
            this.familyPresence.get(familyId).add(userId);
        }

        // Store in database
        await this.updatePresenceInDatabase(userId, presenceData);

        // Broadcast to family members
        if (familyId) {
            this.broadcastFamilyPresenceUpdate(familyId, userId, 'online');
        }

        log('PRESENCE', 'INFO', 'Init', `User ${userId} presence initialized for family ${familyId}`);
        
        return presenceData;
    }

    /**
     * Update user presence status
     */
    async updatePresence(userId, updates) {
        const current = this.presenceCache.get(userId);
        if (!current) return null;

        const updated = {
            ...current,
            ...updates,
            lastSeen: Date.now()
        };

        this.presenceCache.set(userId, updated);

        // Update database
        await this.updatePresenceInDatabase(userId, updated);

        // Broadcast changes to family if status changed
        if (current.familyId && updates.status) {
            this.broadcastFamilyPresenceUpdate(current.familyId, userId, updates.status);
        }

        log('PRESENCE', 'DEBUG', 'Update', `User ${userId} status updated to ${updates.status}`);
        
        return updated;
    }

    /**
     * Set user's current activity
     */
    async setActivity(userId, activity, entityType = null, entityId = null) {
        const presence = this.presenceCache.get(userId);
        if (!presence) return null;

        const updated = await this.updatePresence(userId, {
            currentActivity: activity,
            currentEntityType: entityType,
            currentEntityId: entityId
        });

        // Broadcast activity to family for collaborative awareness
        if (presence.familyId && activity) {
            socketServer.broadcastToFamily(presence.familyId, {
                type: 'user_activity_update',
                data: {
                    userId,
                    activity,
                    entityType,
                    entityId,
                    timestamp: Date.now()
                }
            }, userId);
        }

        return updated;
    }

    /**
     * Handle user disconnection
     */
    async handleDisconnection(userId) {
        const presence = this.presenceCache.get(userId);
        if (!presence) return;

        // Update status to offline
        await this.updatePresence(userId, {
            status: 'offline',
            socketId: null
        });

        // Remove from family presence
        if (presence.familyId && this.familyPresence.has(presence.familyId)) {
            this.familyPresence.get(presence.familyId).delete(userId);
        }

        log('PRESENCE', 'INFO', 'Disconnect', `User ${userId} marked as offline`);
    }

    /**
     * Get presence data for a user
     */
    getUserPresence(userId) {
        return this.presenceCache.get(userId) || null;
    }

    /**
     * Get all online family members
     */
    getFamilyOnlineUsers(familyId) {
        const familyMembers = this.familyPresence.get(familyId);
        if (!familyMembers) return [];

        return Array.from(familyMembers)
            .map(userId => {
                const presence = this.presenceCache.get(userId);
                if (!presence) return null;
                
                return {
                    userId: presence.userId,
                    status: presence.status,
                    currentActivity: presence.currentActivity,
                    currentEntityType: presence.currentEntityType,
                    currentEntityId: presence.currentEntityId,
                    lastSeen: presence.lastSeen
                };
            })
            .filter(user => user && user.status !== 'offline' && user.isVisible);
    }

    /**
     * Get family members with detailed presence info
     */
    getFamilyPresence(familyId) {
        const familyMembers = this.familyPresence.get(familyId);
        if (!familyMembers) return [];

        return Array.from(familyMembers)
            .map(userId => {
                const presence = this.presenceCache.get(userId);
                return presence || {
                    userId,
                    status: 'offline',
                    isVisible: false
                };
            })
            .sort((a, b) => {
                // Sort online users first, then by last seen
                if (a.status === 'online' && b.status !== 'online') return -1;
                if (a.status !== 'online' && b.status === 'online') return 1;
                return (b.lastSeen || 0) - (a.lastSeen || 0);
            });
    }

    /**
     * Update presence in database
     */
    async updatePresenceInDatabase(userId, presenceData) {
        try {
            await prisma.userPresence.upsert({
                where: { userId },
                update: {
                    familyId: presenceData.familyId,
                    status: presenceData.status,
                    lastSeen: new Date(presenceData.lastSeen),
                    currentActivity: presenceData.currentActivity,
                    currentEntityType: presenceData.currentEntityType,
                    currentEntityId: presenceData.currentEntityId,
                    socketId: presenceData.socketId,
                    isVisible: presenceData.isVisible,
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    familyId: presenceData.familyId,
                    status: presenceData.status,
                    lastSeen: new Date(presenceData.lastSeen),
                    currentActivity: presenceData.currentActivity,
                    currentEntityType: presenceData.currentEntityType,
                    currentEntityId: presenceData.currentEntityId,
                    socketId: presenceData.socketId,
                    isVisible: presenceData.isVisible
                }
            });
        } catch (error) {
            log('PRESENCE', 'ERROR', 'Database', `Failed to update presence for ${userId}: ${error.message}`);
        }
    }

    /**
     * Broadcast presence updates to family members
     */
    broadcastFamilyPresenceUpdate(familyId, userId, status) {
        socketServer.broadcastToFamily(familyId, {
            type: 'user_status_change',
            data: {
                userId,
                status,
                timestamp: Date.now()
            }
        }, userId); // Exclude the user themselves
    }

    /**
     * Periodic cleanup of stale presence data
     */
    async cleanupStalePresence() {
        const now = Date.now();
        const offlineThreshold = 5 * 60 * 1000; // 5 minutes

        for (const [userId, presence] of this.presenceCache) {
            if (presence.status !== 'offline' && (now - presence.lastSeen) > offlineThreshold) {
                await this.updatePresence(userId, { status: 'away' });
            }
        }
    }

    /**
     * Get presence statistics for a family
     */
    getFamilyStats(familyId) {
        const familyMembers = this.familyPresence.get(familyId);
        if (!familyMembers) return { total: 0, online: 0, away: 0, offline: 0 };

        let online = 0, away = 0, offline = 0;

        familyMembers.forEach(userId => {
            const presence = this.presenceCache.get(userId);
            if (presence) {
                switch (presence.status) {
                    case 'online': online++; break;
                    case 'away': away++; break;
                    case 'offline': offline++; break;
                }
            } else {
                offline++;
            }
        });

        return {
            total: familyMembers.size,
            online,
            away,
            offline
        };
    }

    /**
     * Handle typing indicators for collaborative activities
     */
    handleTyping(userId, isTyping, activity, targetUserId = null) {
        socketServer.handleTypingIndicator(userId, {
            isTyping,
            activity,
            targetUserId
        });
    }

    /**
     * Get users currently active on a specific entity
     */
    getUsersOnEntity(entityType, entityId) {
        const activeUsers = [];

        for (const [userId, presence] of this.presenceCache) {
            if (presence.currentEntityType === entityType && 
                presence.currentEntityId === entityId &&
                presence.status === 'online') {
                activeUsers.push({
                    userId,
                    activity: presence.currentActivity,
                    lastSeen: presence.lastSeen
                });
            }
        }

        return activeUsers;
    }
}

// Export singleton instance
export const presenceService = new PresenceService();
export default presenceService;
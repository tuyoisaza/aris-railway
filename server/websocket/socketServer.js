import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { log } from '../utils/logger.js';
import { presenceService } from '../services/PresenceService.js';

/**
 * WebSocket Server for Real-time Collaboration
 * Handles presence, notifications, and live collaboration features
 */
class SocketServer {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // userId -> { ws, familyId, lastSeen, status }
        this.familyRooms = new Map(); // familyId -> Set of userIds
    }

    /**
     * Generate unique socket identifier
     */
    generateSocketId() {
        return `socket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initialize WebSocket server to run alongside Express
     */
    initialize(server) {
        this.wss = new WebSocketServer({ 
            server,
            path: '/ws',
            verifyClient: this.verifyClient.bind(this)
        });

        this.wss.on('connection', this.handleConnection.bind(this));
        
        // Set up periodic cleanup of inactive connections
        setInterval(this.cleanupInactiveClients.bind(this), 30000); // 30 seconds

        log('SOCKET', 'INFO', 'Init', 'WebSocket server initialized');
    }

    /**
     * Verify JWT token before establishing WebSocket connection
     */
    async verifyClient(info) {
        try {
            const token = this.extractToken(info.req);
            if (!token) {
                return false;
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            info.req.user = decoded;
            return true;
        } catch (error) {
            log('SOCKET', 'WARN', 'Auth', `WebSocket auth failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Extract JWT token from request headers or query params
     */
    extractToken(req) {
        // Try Authorization header first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.slice(7);
        }
        
        // Fall back to query parameter
        const url = new URL(req.url, `http://${req.headers.host}`);
        return url.searchParams.get('token');
    }

    /**
     * Handle new WebSocket connection
     */
    async handleConnection(ws, req) {
        const user = req.user;
        const userId = user.id;
        const familyId = user.family_id;
        const socketId = this.generateSocketId();

        log('SOCKET', 'INFO', 'Connect', `User ${userId} connected with socket ${socketId}`);

        // Initialize presence service
        await presenceService.initializePresence(userId, familyId, socketId);

        // Store client connection (keeping for backwards compatibility)
        this.clients.set(userId, {
            ws,
            userId,
            familyId,
            lastSeen: Date.now(),
            status: 'online'
        });

        // Add to family room if applicable
        if (familyId) {
            if (!this.familyRooms.has(familyId)) {
                this.familyRooms.set(familyId, new Set());
            }
            this.familyRooms.get(familyId).add(userId);
        }

        // Send initial connection confirmation with family presence
        this.sendToClient(userId, {
            type: 'connection_established',
            data: {
                userId,
                familyId,
                timestamp: Date.now(),
                familyPresence: presenceService.getFamilyOnlineUsers(familyId)
            }
        });

        // Notify other family members about this user coming online
        if (familyId) {
            this.broadcastToFamily(familyId, {
                type: 'user_status_change',
                data: {
                    userId,
                    status: 'online',
                    timestamp: Date.now()
                }
            }, userId);
        }

        // Set up message handlers
        ws.on('message', (data) => this.handleMessage(userId, data));
        ws.on('close', () => this.handleDisconnection(userId));
        ws.on('error', (error) => this.handleError(userId, error));

        // Send periodic ping to keep connection alive
        const pingInterval = setInterval(() => {
            if (this.clients.has(userId)) {
                this.sendToClient(userId, { type: 'ping' });
            } else {
                clearInterval(pingInterval);
            }
        }, 25000);
    }

    /**
     * Handle incoming WebSocket messages
     */
    async handleMessage(userId, data) {
        try {
            const message = JSON.parse(data.toString());
            const client = this.clients.get(userId);
            
            if (!client) return;

            // Update last seen timestamp
            client.lastSeen = Date.now();

            log('SOCKET', 'DEBUG', 'Message', `Message from ${userId}: ${message.type}`);

            switch (message.type) {
                case 'pong':
                    // Response to ping - just update timestamp
                    break;
                    
                case 'presence_update':
                    this.handlePresenceUpdate(userId, message.data);
                    break;
                    
                case 'typing_indicator':
                    this.handleTypingIndicator(userId, message.data);
                    break;
                    
                case 'collaboration_invite':
                    this.handleCollaborationInvite(userId, message.data);
                    break;
                    
                default:
                    log('SOCKET', 'WARN', 'Message', `Unknown message type: ${message.type}`);
            }
        } catch (error) {
            log('SOCKET', 'ERROR', 'Message', `Error handling message from ${userId}: ${error.message}`);
        }
    }

    /**
     * Handle presence status updates (online, away, busy, etc.)
     */
    async handlePresenceUpdate(userId, data) {
        const client = this.clients.get(userId);
        if (!client) return;

        const { status, activity, entityType, entityId } = data;
        
        // Update presence service
        await presenceService.updatePresence(userId, {
            status,
            currentActivity: activity,
            currentEntityType: entityType,
            currentEntityId: entityId
        });

        // Update local client cache for backwards compatibility
        client.status = status;
        client.lastSeen = Date.now();
    }

    /**
     * Handle typing indicators for collaborative activities
     */
    handleTypingIndicator(userId, data) {
        const client = this.clients.get(userId);
        if (!client) return;

        const { isTyping, activity, targetUserId } = data;

        if (targetUserId) {
            // Send to specific user
            this.sendToClient(targetUserId, {
                type: 'typing_indicator',
                data: {
                    userId,
                    isTyping,
                    activity,
                    timestamp: Date.now()
                }
            });
        } else if (client.familyId) {
            // Broadcast to family
            this.broadcastToFamily(client.familyId, {
                type: 'typing_indicator',
                data: {
                    userId,
                    isTyping,
                    activity,
                    timestamp: Date.now()
                }
            }, userId);
        }
    }

    /**
     * Handle collaboration invitations
     */
    handleCollaborationInvite(userId, data) {
        const { targetUserId, activity, message } = data;
        
        this.sendToClient(targetUserId, {
            type: 'collaboration_invite',
            data: {
                fromUserId: userId,
                activity,
                message,
                timestamp: Date.now()
            }
        });
    }

    /**
     * Handle client disconnection
     */
    async handleDisconnection(userId) {
        const client = this.clients.get(userId);
        if (!client) return;

        log('SOCKET', 'INFO', 'Disconnect', `User ${userId} disconnected`);

        // Handle presence service disconnection
        await presenceService.handleDisconnection(userId);

        // Remove from family room
        if (client.familyId && this.familyRooms.has(client.familyId)) {
            this.familyRooms.get(client.familyId).delete(userId);
            
            // Notify other family members
            this.broadcastToFamily(client.familyId, {
                type: 'user_status_change',
                data: {
                    userId,
                    status: 'offline',
                    timestamp: Date.now()
                }
            });
        }

        // Remove client
        this.clients.delete(userId);
    }

    /**
     * Handle WebSocket errors
     */
    handleError(userId, error) {
        log('SOCKET', 'ERROR', 'Connection', `WebSocket error for user ${userId}: ${error.message}`);
        this.handleDisconnection(userId);
    }

    /**
     * Send message to specific client
     */
    sendToClient(userId, message) {
        const client = this.clients.get(userId);
        if (client && client.ws.readyState === client.ws.OPEN) {
            try {
                client.ws.send(JSON.stringify(message));
            } catch (error) {
                log('SOCKET', 'ERROR', 'Send', `Failed to send to ${userId}: ${error.message}`);
            }
        }
    }

    /**
     * Broadcast message to all family members
     */
    broadcastToFamily(familyId, message, excludeUserId = null) {
        const familyMembers = this.familyRooms.get(familyId);
        if (!familyMembers) return;

        familyMembers.forEach(userId => {
            if (userId !== excludeUserId) {
                this.sendToClient(userId, message);
            }
        });
    }

    /**
     * Get online users in a family
     */
    getFamilyOnlineUsers(familyId) {
        const familyMembers = this.familyRooms.get(familyId);
        if (!familyMembers) return [];

        return Array.from(familyMembers).map(userId => {
            const client = this.clients.get(userId);
            return client ? {
                userId,
                status: client.status,
                lastSeen: client.lastSeen
            } : null;
        }).filter(Boolean);
    }

    /**
     * Clean up inactive connections
     */
    cleanupInactiveClients() {
        const now = Date.now();
        const inactiveThreshold = 60000; // 1 minute

        for (const [userId, client] of this.clients) {
            if (now - client.lastSeen > inactiveThreshold) {
                log('SOCKET', 'INFO', 'Cleanup', `Removing inactive client ${userId}`);
                if (client.ws.readyState === client.ws.OPEN) {
                    client.ws.close();
                }
                this.handleDisconnection(userId);
            }
        }
    }

    /**
     * Broadcast XP notifications to family members
     */
    broadcastXPGain(userId, xpData) {
        const client = this.clients.get(userId);
        if (!client || !client.familyId) return;

        this.broadcastToFamily(client.familyId, {
            type: 'xp_notification',
            data: {
                userId,
                ...xpData,
                timestamp: Date.now()
            }
        }, userId); // Exclude the user who earned XP
    }

    /**
     * Broadcast skill progress updates to family
     */
    broadcastSkillProgress(userId, skillData) {
        const client = this.clients.get(userId);
        if (!client || !client.familyId) return;

        this.broadcastToFamily(client.familyId, {
            type: 'skill_progress',
            data: {
                userId,
                ...skillData,
                timestamp: Date.now()
            }
        });
    }
}

// Export singleton instance
export const socketServer = new SocketServer();
export default socketServer;
/**
 * WebSocket Client Service for ARIS Real-time Collaboration
 * Handles WebSocket connection, presence tracking, and real-time updates
 */

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  userId?: string;
  familyId?: string;
}

interface PresenceData {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  currentActivity?: string;
  currentTopicId?: string;
  currentSkillId?: string;
}

interface FamilyPresence {
  [userId: string]: PresenceData;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private heartbeatInterval: number | null = null;
  private presenceUpdateInterval: number | null = null;
  
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private familyPresence: FamilyPresence = {};
  private currentUserId: string | null = null;
  private currentFamilyId: string | null = null;
  
  private readonly WEBSOCKET_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

  constructor() {
    this.initializeSubscriptions();
  }

  private initializeSubscriptions() {
    this.subscribers.set('connection_established', new Set());
    this.subscribers.set('user_status_change', new Set());
    this.subscribers.set('xp_notification', new Set());
    this.subscribers.set('skill_progress', new Set());
    this.subscribers.set('collaborative_action', new Set());
    this.subscribers.set('typing_indicator', new Set());
    this.subscribers.set('presence_update', new Set());
    this.subscribers.set('error', new Set());
  }

  public async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      const token = localStorage.getItem('aris_token');
      const userStr = localStorage.getItem('aris_user');
      
      if (!token || !userStr) {
        console.log('No active session - WebSocket not connecting');
        return;
      }

      const user = JSON.parse(userStr);
      this.currentUserId = user.id;
      
      this.isConnecting = true;
      
      const wsUrl = `${this.WEBSOCKET_URL}?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = () => this.handleClose();
      this.ws.onerror = (error) => this.handleError(error);

    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to connect WebSocket:', error);
      this.emit('error', { type: 'connection_failed', error });
    }
  }

  private handleOpen() {
    console.log('WebSocket connected successfully');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    this.startHeartbeat();
    this.startPresenceUpdates();
    
    this.emit('connection_established', {
      familyPresence: this.familyPresence,
      userId: this.currentUserId,
      familyId: this.currentFamilyId
    });
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'connection_established':
          this.familyPresence = message.data?.familyPresence || {};
          break;
          
        case 'user_status_change':
        case 'presence_update':
          if (message.data?.userId && message.data?.presence) {
            this.familyPresence[message.data.userId] = {
              ...message.data.presence,
              lastSeen: new Date().toISOString()
            };
          }
          break;
          
        case 'xp_notification':
        case 'skill_progress':
        case 'typing_indicator':
        case 'collaborative_action':
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }

      this.emit(message.type, message.data);
      
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose() {
    console.log('WebSocket connection closed');
    this.isConnecting = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.presenceUpdateInterval) {
      clearInterval(this.presenceUpdateInterval);
      this.presenceUpdateInterval = null;
    }
    
    this.attemptReconnect();
  }

  private handleError(error: Event) {
    console.error('WebSocket error:', error);
    this.emit('error', { type: 'websocket_error', error });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('error', { type: 'max_reconnect_attempts_reached' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000);
  }

  private startPresenceUpdates() {
    this.presenceUpdateInterval = window.setInterval(() => {
      this.updatePresence({
        status: 'online',
        lastSeen: new Date().toISOString()
      });
    }, 60000);
  }

  public updatePresence(presence: Partial<PresenceData>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'presence_update',
        data: {
          userId: this.currentUserId,
          familyId: this.currentFamilyId,
          presence
        }
      }));
    }
  }

  public sendTypingIndicator(isTyping: boolean, context?: { topicId?: string; skillId?: string }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing_indicator',
        data: {
          userId: this.currentUserId,
          familyId: this.currentFamilyId,
          isTyping,
          context
        }
      }));
    }
  }

  public sendCollaborativeAction(action: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'collaborative_action',
        data: {
          userId: this.currentUserId,
          familyId: this.currentFamilyId,
          action,
          data
        }
      }));
    }
  }

  public subscribe(type: string, callback: (data: any) => void) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    
    this.subscribers.get(type)!.add(callback);
    
    return () => {
      this.subscribers.get(type)?.delete(callback);
    };
  }

  private emit(type: string, data: any) {
    const callbacks = this.subscribers.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscriber for ${type}:`, error);
        }
      });
    }
  }

  public getFamilyPresence(): FamilyPresence {
    return { ...this.familyPresence };
  }

  public isUserOnline(userId: string): boolean {
    const presence = this.familyPresence[userId];
    if (!presence) return false;
    
    if (presence.status === 'offline') return false;
    
    const lastSeenTime = new Date(presence.lastSeen).getTime();
    const now = new Date().getTime();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    return lastSeenTime > fiveMinutesAgo;
  }

  public getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return 'connected';
    return 'disconnected';
  }

  public disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.presenceUpdateInterval) {
      clearInterval(this.presenceUpdateInterval);
      this.presenceUpdateInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.familyPresence = {};
    this.currentUserId = null;
    this.currentFamilyId = null;
  }
}

export const websocketClient = new WebSocketClient();

// Auto-connect when user session is available
const checkAuthAndConnect = () => {
  const token = localStorage.getItem('aris_token');
  const user = localStorage.getItem('aris_user');
  
  if (token && user) {
    setTimeout(() => {
      websocketClient.connect();
    }, 1000);
  } else {
    websocketClient.disconnect();
  }
};

// Listen for storage changes (for cross-tab auth sync)
window.addEventListener('storage', (e) => {
  if (e.key === 'aris_token' || e.key === 'aris_user') {
    checkAuthAndConnect();
  }
});

export default websocketClient;

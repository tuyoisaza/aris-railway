import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DebugService {
  constructor() {
    this._cache = null;
    this._cacheTime = null;
    this._cacheTTL = 5000;
  }

  async _getPrisma() {
    return prisma;
  }

  _invalidateCache() {
    this._cache = null;
    this._cacheTime = null;
  }

  async _getActiveSessions() {
    const now = new Date();
    const db = await this._getPrisma();
    return db.debugSession.findMany({
      where: {
        enabled: true,
        expiresAt: { gt: now },
      },
      orderBy: { activatedAt: 'desc' },
    });
  }

  async getActiveSessions(userId = null, scope = null) {
    let sessions = this._cache;
    const now = Date.now();

    if (!sessions || !this._cacheTime || (now - this._cacheTime) > this._cacheTTL) {
      sessions = await this._getActiveSessions();
      this._cache = sessions;
      this._cacheTime = now;
    }

    if (userId) {
      sessions = sessions.filter(s => s.userId === userId);
    }
    if (scope) {
      sessions = sessions.filter(s => s.scope === scope);
    }

    return sessions;
  }

  async isDebugActive(userId = null, scope = null) {
    const sessions = await this.getActiveSessions(userId, scope);
    return sessions.length > 0;
  }

  async activateDebug(userId, scope = 'ADMIN', durationMinutes = 15, reason = null) {
    const db = await this._getPrisma();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const session = await db.debugSession.create({
      data: {
        userId,
        scope: scope.toUpperCase(),
        enabled: true,
        reason,
        expiresAt,
        metadata: JSON.stringify({
          activatedBy: userId,
          durationMinutes,
        }),
      },
    });

    this._invalidateCache();
    
    return session;
  }

  async deactivateDebug(sessionId) {
    const db = await this._getPrisma();
    const session = await db.debugSession.update({
      where: { id: sessionId },
      data: { enabled: false },
    });

    this._invalidateCache();
    return session;
  }

  async deactivateAllDebug() {
    const db = await this._getPrisma();
    const result = await db.debugSession.updateMany({
      where: {
        enabled: true,
        expiresAt: { gt: new Date() },
      },
      data: { enabled: false },
    });

    this._invalidateCache();
    return result.count;
  }

  async cleanupExpiredSessions() {
    const db = await this._getPrisma();
    const result = await db.debugSession.deleteMany({
      where: {
        enabled: true,
        expiresAt: { lte: new Date() },
      },
    });

    if (result.count > 0) {
      this._invalidateCache();
    }

    return result.count;
  }

  async getAllSessions(includeDisabled = false) {
    const db = await this._getPrisma();
    return db.debugSession.findMany({
      orderBy: { activatedAt: 'desc' },
      where: includeDisabled ? undefined : { enabled: true },
    });
  }

  async getSessionById(sessionId) {
    const db = await this._getPrisma();
    return db.debugSession.findUnique({
      where: { id: sessionId },
    });
  }

  async initialize() {
    await this.cleanupExpiredSessions();
  }
}

const debugService = new DebugService();

export default debugService;
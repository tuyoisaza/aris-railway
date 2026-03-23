import { prisma } from '../db.js';

export const audit = {
    async log({
        userId,
        userEmail,
        action,
        targetType = null,
        targetId = null,
        oldValue = null,
        newValue = null,
        ipAddress = null,
        userAgent = null,
        metadata = null
    }) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    userEmail,
                    action,
                    targetType,
                    targetId,
                    oldValue: oldValue ? JSON.stringify(oldValue) : null,
                    newValue: newValue ? JSON.stringify(newValue) : null,
                    ipAddress,
                    userAgent,
                    metadata: metadata ? JSON.stringify(metadata) : null
                }
            });
        } catch (err) {
            console.error('[Audit] Failed to log:', err.message);
        }
    }
};

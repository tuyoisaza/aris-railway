import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'aris-development-secret-change-in-production';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export function generateToken(payload) {
    return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, jwtSecret);
    } catch {
        return null;
    }
}

export function extractToken(authHeader) {
    if (!authHeader) return null;
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    return authHeader;
}

export function authMiddleware(req, res, next) {
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = decoded;
    next();
}

export function optionalAuthMiddleware(req, res, next) {
    const token = extractToken(req.headers.authorization);
    
    if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
            req.user = decoded;
        }
    }
    
    next();
}


import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: any;
            adminUser?: any;
            userRoles?: string[];
            userPermissions?: string[];
            subscription?: any;
            isSuperAdmin?: boolean;
        }
    }
}

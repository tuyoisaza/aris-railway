import express from 'express';
import { sendError } from '../middleware.js';
import agentsRouter from './admin/agents.js';
import actionsRouter from './admin/actions.js';
import systemstatusRouter from './admin/systemstatus.js';
import badgesRouter from './admin/badges.js';
import usersRouter from './admin/users.js';
import debugRouter from './admin/debug.js';
import guidedactionsRouter from './admin/guidedactions.js';
import featureflagsRouter from './admin/featureflags.js';
import auditRouter from './admin/audit.js';

const router = express.Router();

const requireAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.plan !== 'pro') {
        return sendError(res, 'Admin access required', 403);
    }
    next();
};

router.use('/agents', agentsRouter);
router.use('/actions', actionsRouter);
router.use('/systemstatus', systemstatusRouter);
router.use('/badges', badgesRouter);
router.use('/users', usersRouter);
router.use('/debug', debugRouter);
router.use('/guidedactions', guidedactionsRouter);
router.use('/featureflags', featureflagsRouter);
router.use('/audit', auditRouter);

export default router;

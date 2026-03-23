import crypto from 'crypto';
import debugService from '../services/debug/DebugService.js';

const correlationIdHeader = 'x-correlation-id';
const debugSessionHeader = 'x-debug-session';

const generateCorrelationId = () => {
  return crypto.randomUUID();
};

const debugMiddleware = async (req, res, next) => {
  const correlationId = req.headers[correlationIdHeader] || generateCorrelationId();
  req.correlationId = correlationId;
  res.setHeader(correlationIdHeader, correlationId);

  const isDebugActive = await debugService.isDebugActive();
  
  if (isDebugActive) {
    const activeSessions = await debugService.getActiveSessions();
    const sessionIds = activeSessions.map(s => s.id).join(',');
    res.setHeader(debugSessionHeader, sessionIds);
    req.isDebugActive = true;
    req.debugSessions = activeSessions;
  } else {
    req.isDebugActive = false;
    req.debugSessions = [];
  }

  next();
};

export { debugMiddleware, correlationIdHeader, debugSessionHeader, generateCorrelationId };

export default debugMiddleware;
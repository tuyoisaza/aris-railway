import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

/**
 * Request logging middleware
 * Logs all HTTP requests with duration and status code
 */
function requestLogger(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Capture the original end function
    const originalEnd = res.end;

    // Override res.end to log after response is sent
    // @ts-ignore
    res.end = function (...args: any[]) {
        const duration = Date.now() - startTime;
        (logger as any).logRequest(req, res.statusCode, duration);

        // Call the original end function
        originalEnd.apply(res, args as any);
    };

    next();
}

export default requestLogger;


import winston from 'winston';
import Transport from 'winston-transport';
import { SystemService } from './services/system.service';

declare module 'winston' {
    interface Logger {
        logError: (message: string, error: any, metadata?: any) => void;
        logRequest: (req: any, statusCode: number, duration: number) => void;
    }
}

// Custom Transport for System Logs
class SystemLogTransport extends Transport {
    async log(info: any, callback: () => void) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        // We only want to log 'relevant system actions' to DB.
        // Standard HTTP noise might overlap with Winston 'info'.
        // Let's filter or standardise.

        // SystemService.log checks Debug Mode internally.

        const { level, message, timestamp, ...meta } = info;

        // Map Winston info to SystemLog
        // We assume 'message' is the 'action' or 'description'
        // If meta has userId, we use it.

        try {
            await SystemService.log({
                level: level as any,
                action: message,
                userId: meta.userId || meta.user_id,
                result: meta.result, // optional
                details: meta
            });
        } catch (err) {
            console.error('SystemLogTransport Error:', err);
        }

        callback();
    }
}

// Create logger with structured JSON format
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'upgrade-platform' },
    transports: [
        // Console output (always)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    let msg = `${timestamp} [${level}]: ${message}`;
                    if (Object.keys(meta).length > 0 && meta.service !== 'upgrade-platform') {
                        msg += ` ${JSON.stringify(meta)}`;
                    }
                    return msg;
                })
            )
        }),
        // DB Transport (checks debug mode internally)
        new SystemLogTransport()
    ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880,
        maxFiles: 5
    }));
}

// Helper to safely log errors without exposing secrets
(logger as any).logError = (message: string, error: any, metadata = {}) => {
    const safeError = {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        // Don't log full stack traces in production
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    };

    logger.error(message, { error: safeError, ...metadata });
};

// Helper to log requests
(logger as any).logRequest = (req: any, statusCode: number, duration: number) => {
    // We might NOT want every HTTP request in System Logs unless specific debug needs.
    // The transport sends everything to SystemService.log, which checks Debug Mode.
    // So if Debug = ON, we get all requests. This is consistent with "Global Debug Switch".

    logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.id
    });
};

export default logger;

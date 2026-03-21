import { useEffect, useRef, useCallback } from 'react';

const LOG_KEY = 'aris_console_logs';

export function useConsoleCapture() {
    const logsRef = useRef<string[]>([]);

    useEffect(() => {
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info,
        };

        const formatMessage = (type: string, ...args: any[]) => {
            const timestamp = new Date().toISOString();
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');
            return `[${timestamp}] [${type}] ${message}`;
        };

        const capture = (type: 'log' | 'error' | 'warn' | 'info') => (...args: any[]) => {
            const formatted = formatMessage(type.toUpperCase(), ...args);
            logsRef.current.push(formatted);
            if (logsRef.current.length > 500) {
                logsRef.current = logsRef.current.slice(-500);
            }
            originalConsole[type](...args);
        };

        console.log = capture('log');
        console.error = capture('error');
        console.warn = capture('warn');
        console.info = capture('info');

        return () => {
            console.log = originalConsole.log;
            console.error = originalConsole.error;
            console.warn = originalConsole.warn;
            console.info = originalConsole.info;
        };
    }, []);

    const getLogs = useCallback(() => {
        return logsRef.current.join('\n');
    }, []);

    const getVersion = useCallback(async () => {
        try {
            const res = await fetch('/VERSION.txt');
            if (res.ok) {
                return await res.text();
            }
        } catch {
            // fallback
        }
        return 'unknown';
    }, []);

    const copyForSupport = useCallback(async () => {
        const version = await getVersion();
        const logs = getLogs();
        const domain = window.location.hostname;
        
        const supportText = `ARIS Support Report
==================
Version: ${version.trim()}
Domain: ${domain}
Time: ${new Date().toISOString()}
URL: ${window.location.href}

Console Logs:
${logs || '(no logs)'}

==================
Please describe your issue below:
`;

        try {
            await navigator.clipboard.writeText(supportText);
            return true;
        } catch {
            return false;
        }
    }, [getVersion, getLogs]);

    return { copyForSupport, getLogs, getVersion };
}

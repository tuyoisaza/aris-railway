import type { LogEntry } from './types';

export type ConsoleSnapshot = Pick<Console, 'log' | 'warn' | 'error' | 'debug'>;

export function snapshotConsole(): ConsoleSnapshot {
    return {
        log: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };
}

export function restoreConsole(snapshot: ConsoleSnapshot): void {
    console.log = snapshot.log;
    console.warn = snapshot.warn;
    console.error = snapshot.error;
    console.debug = snapshot.debug;
}

export function formatLogMessage(args: any[]): string {
    return args
        .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
        .join(' ');
}

export function createLogEntry(level: LogEntry['level'], args: any[]): LogEntry {
    return {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        level,
        message: formatLogMessage(args),
        args
    };
}

export function installConsoleCapture(options: {
    snapshot: ConsoleSnapshot;
    onEntry: (entry: LogEntry) => void;
}): () => void {
    const { snapshot, onEntry } = options;

    const add = (level: LogEntry['level'], args: any[]) => {
        onEntry(createLogEntry(level, args));
    };

    console.log = (...args: any[]) => {
        snapshot.log(...args);
        add('info', args);
    };
    console.warn = (...args: any[]) => {
        snapshot.warn(...args);
        add('warn', args);
    };
    console.error = (...args: any[]) => {
        snapshot.error(...args);
        add('error', args);
    };
    console.debug = (...args: any[]) => {
        snapshot.debug(...args);
        add('debug', args);
    };

    return () => {
        restoreConsole(snapshot);
    };
}

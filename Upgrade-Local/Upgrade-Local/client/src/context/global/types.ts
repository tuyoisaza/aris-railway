export type Theme = 'light' | 'dark';

export interface LogEntry {
    id: string;
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    args: any[];
}

export interface GlobalContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    debugMode: boolean;
    toggleDebugMode: () => void;
    logs: LogEntry[];
    clearLogs: () => void;
}

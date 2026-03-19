import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';

import type { GlobalContextValue, LogEntry, Theme } from './global/types';
import { fetchRemoteDebugMode } from './global/debugSettings';
import { installConsoleCapture, snapshotConsole } from './global/logging';
import { writeStoredDebugMode, writeStoredTheme, readStoredDebugMode } from './global/storage';
import { applyThemeToDocument, getInitialTheme } from './global/theme';

export type { LogEntry, Theme } from './global/types';

const GlobalContext = createContext<GlobalContextValue | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
    // 1. Theme State
    const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

    // 2. Debug Mode State
    const [debugMode, setDebugMode] = useState<boolean>(() => readStoredDebugMode());

    // 3. Log State
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const originalConsoleRef = useRef(snapshotConsole());

    // 4. Effect: Handle Theme Changes
    useEffect(() => {
        applyThemeToDocument(theme);
        writeStoredTheme(theme);
    }, [theme]);

    // 5. Effect: Handle Debug Mode Persistence & Sync
    useEffect(() => {
        const fetchDebugSetting = async () => {
            const remote = await fetchRemoteDebugMode();
            if (typeof remote === 'boolean') {
                setDebugMode(remote);
                writeStoredDebugMode(remote);
            }
        };

        fetchDebugSetting();
    }, []);

    useEffect(() => {
        writeStoredDebugMode(debugMode);
    }, [debugMode]);

    // 6. Effect: Console Override (Log Capture)
    useEffect(() => {
        if (!debugMode) {
            // Restore originals if debug off
            console.log = originalConsoleRef.current.log;
            console.warn = originalConsoleRef.current.warn;
            console.error = originalConsoleRef.current.error;
            console.debug = originalConsoleRef.current.debug;
            return;
        }

        return installConsoleCapture({
            snapshot: originalConsoleRef.current,
            onEntry: (entry) => {
                setLogs(prev => [entry, ...prev].slice(0, 100));
            }
        });
    }, [debugMode]);

    // 7. Helper Functions
    const toggleDebugMode = () => setDebugMode(prev => !prev);
    const toggleTheme = () => setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    const setTheme = (newTheme: Theme) => setThemeState(newTheme);
    const clearLogs = () => setLogs([]);

    return (
        <GlobalContext.Provider value={{ theme, toggleTheme, setTheme, debugMode, toggleDebugMode, logs, clearLogs }}>
            {children}
        </GlobalContext.Provider>
    );
}

export function useGlobal() {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
}

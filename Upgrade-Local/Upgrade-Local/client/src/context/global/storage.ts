import type { Theme } from './types';

export const THEME_STORAGE_KEY = 'theme';
export const DEBUG_STORAGE_KEY = 'upgrade_debug_mode';

export function readStoredTheme(): Theme | null {
    return localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
}

export function writeStoredTheme(theme: Theme): void {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function readStoredDebugMode(): boolean {
    return localStorage.getItem(DEBUG_STORAGE_KEY) === 'true';
}

export function writeStoredDebugMode(enabled: boolean): void {
    localStorage.setItem(DEBUG_STORAGE_KEY, String(enabled));
}

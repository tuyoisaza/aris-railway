import type { Theme } from './types';
import { readStoredTheme } from './storage';

export function getInitialTheme(): Theme {
    const savedTheme = readStoredTheme() as Theme;
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
}

export function applyThemeToDocument(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark');
    } else {
        root.removeAttribute('data-theme');
        root.classList.remove('dark');
    }
}

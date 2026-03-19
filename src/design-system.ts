/**
 * Centralized Design System
 * 
 * This file is the single source of truth for all design tokens in the application.
 * These values mirror the CSS variables defined in src/index.css.
 * 
 * Usage:
 * import { DesignSystem } from './design-system';
 * style={{ color: DesignSystem.colors.primary }}
 */

export const DesignSystem = {
  colors: {
    // Brand Colors
    primary: '#FF6B00',
    primaryHover: '#E65A00',
    primaryLight: '#FFF0E6',

    // Base Colors
    bg: '#F9F9F8',
    bgSecondary: '#FFFFFF',
    surface: '#FFFFFF',

    // Text Colors
    text: '#1A1A1A',
    textSecondary: '#666666',
    textTertiary: '#999999',

    // Borders & Dividers
    border: '#E5E5E5',
    borderLight: '#F0F0F0',
  },

  typography: {
    fontMain: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
  }
};

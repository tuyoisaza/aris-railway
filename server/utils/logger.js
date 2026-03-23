
// Logger Utility with Buffer and Level Control with Debug Session Support

import debugService from '../services/debug/DebugService.js';

// Levels
const LEVELS = {
    NONE: 0,
    ALERTS: 1, // ERROR, WARN only
    LOG: 2,    // INFO, WARN, ERROR
    VERBOSE: 3, // DEBUG, INFO, WARN, ERROR
    DEBUG: 4   // Full debug mode from DB
};

// State
let currentLevel = LEVELS.VERBOSE;
const MAX_LOGS = 1000;
const logBuffer = [];

let currentCorrelationId = null;

const setCorrelationId = (id) => {
    currentCorrelationId = id;
};

const getCorrelationId = () => currentCorrelationId;

const setLogLevel = (level) => {
    // Map string input to number if needed
    if (typeof level === 'string') {
        const up = level.toUpperCase();
        if (LEVELS[up] !== undefined) currentLevel = LEVELS[up];
    } else if (Object.values(LEVELS).includes(level)) {
        currentLevel = level;
    }
    console.log(`[Logger] Log level set to ${currentLevel}`);
};

const getLogLevel = () => currentLevel;

const addLog = (entry) => {
    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOGS) {
        logBuffer.shift();
    }
};

/**
 * Log a message
 * @param {string} module - Component name (API, Auth, etc)
 * @param {string} severity - INFO, WARN, ERROR, DEBUG
 * @param {string} context - Sub-component or action
 * @param {string} message - The actual message
 * @param {object} extra - Extra data for debug mode
 */
const log = async (module, severity, context, message, extra = null) => {
    // Check if debug mode is active from DB
    let isDebugActive = false;
    try {
        isDebugActive = await debugService.isDebugActive();
    } catch (e) {
        // Debug service might not be initialized yet
    }

    // If debug session active, force VERBOSE+ level
    const effectiveLevel = isDebugActive ? LEVELS.DEBUG : currentLevel;

    const timestamp = new Date().toISOString();

    // Determine numeric severity for filtering
    let severityLevel = 2; // Default to INFO importance
    const s = severity.toUpperCase();
    if (s === 'ERROR' || s === 'WARN') severityLevel = 1;
    if (s === 'INFO') severityLevel = 2;
    if (s === 'DEBUG') severityLevel = 3;

    if (effectiveLevel === 0) return; // NONE

    // Special Check: If filtering for ALERTS, only allow ERROR/WARN
    const isAlert = (s === 'ERROR' || s === 'WARN');

    let shouldLog = false;
    if (effectiveLevel >= 4) shouldLog = true; // DEBUG mode - always log
    else if (effectiveLevel >= 3) shouldLog = true;
    else if (effectiveLevel === 2 && (s === 'INFO' || isAlert)) shouldLog = true;
    else if (effectiveLevel === 1 && isAlert) shouldLog = true;

    if (shouldLog) {
        const correlationPrefix = currentCorrelationId ? `[${currentCorrelationId.slice(0,8)}] ` : '';
        const entry = { 
            timestamp, 
            module, 
            severity, 
            context, 
            message, 
            correlationId: currentCorrelationId,
            isDebugSession: isDebugActive,
            ...(extra || {})
        };
        addLog(entry);
        
        // Format output based on debug mode
        let logMessage = message;
        if (isDebugActive && extra) {
            logMessage += ` ${JSON.stringify(extra)}`;
        }
        
        console.log(`[${timestamp}]${correlationPrefix}[${module}] [${severity}] [${context}] ${logMessage}`);
    }
};

export const getLogs = () => logBuffer;

export const getRecent = (count = 100) => {
    return logBuffer.slice(-count);
};

export const getLevel = () => currentLevel;

export const isDebugSessionActive = async () => {
    try {
        return await debugService.isDebugActive();
    } catch {
        return false;
    }
};

export { LEVELS, log, setLogLevel, getLogLevel, setLogLevel as setLevel, setCorrelationId, getCorrelationId };


// Logger Utility with Buffer and Level Control

// Levels
const LEVELS = {
    NONE: 0,
    ALERTS: 1, // ERROR, WARN only
    LOG: 2,    // INFO, WARN, ERROR
    VERBOSE: 3 // DEBUG, INFO, WARN, ERROR
};

// State
let currentLevel = LEVELS.VERBOSE;
const MAX_LOGS = 1000;
const logBuffer = [];

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
 */
const log = (module, severity, context, message) => {
    const timestamp = new Date().toISOString();

    // Determine numeric severity for filtering
    let severityLevel = 2; // Default to INFO importance
    const s = severity.toUpperCase();
    if (s === 'ERROR' || s === 'WARN') severityLevel = 1;
    if (s === 'INFO') severityLevel = 2;
    if (s === 'DEBUG') severityLevel = 3;

    // Filter based on current setting
    // Logic: If currentLevel is logs (2), we show 1 and 2.
    // If currentLevel is alerts (1), we show 1.
    // If currentLevel is none (0), we show nothing.
    // Wait, the mapping above was: NO LOG=0, ALERTS=1 (shows error/warn), LOG=2 (shows info+), VERBOSE=3 (shows debug+)
    // So we check if severityLevel <= currentLevel?
    // ERROR(1) <= ALERTS(1)? Yes.
    // INFO(2) <= ALERTS(1)? No.
    // DEBUG(3) <= LOG(2)? No.
    // Correct.

    // Always console.log for server stdout irrespective of UI buffer setting?
    // User asked "control amount of logging we want". 
    // They probably mean in the UI AND console.
    // But usually console is fine to be verbose. 
    // I'll apply filtering to the BUFFER (UI) and Console.

    if (currentLevel === 0) return; // NONE

    // Special Check: If filtering for ALERTS, only allow ERROR/WARN
    const isAlert = (s === 'ERROR' || s === 'WARN');

    // Simple Numeric Check:
    // If currentLevel == 1 (ALERTS), only show isAlert.
    // if currentLevel == 2 (LOG), show INFO and ALERTS. (DEBUG is hidden)
    // if currentLevel == 3 (VERBOSE), show ALL.

    let shouldLog = false;
    if (currentLevel >= 3) shouldLog = true;
    else if (currentLevel === 2 && (s === 'INFO' || isAlert)) shouldLog = true;
    else if (currentLevel === 1 && isAlert) shouldLog = true;

    if (shouldLog) {
        const entry = { timestamp, module, severity, context, message };
        addLog(entry);
        // Also print to stdout
        console.log(`[${timestamp}] [${module}] [${severity}] [${context}] ${message}`);
    }
};

export const getLogs = () => logBuffer;

export { LEVELS, log, setLogLevel, getLogLevel };

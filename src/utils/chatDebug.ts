/**
 * Chat Debug Utility
 * 
 * Provides debugging tools and logging for chat-related issues.
 * Helps diagnose message parsing, display, and topic duplication problems.
 */

export interface ChatDebugInfo {
    timestamp: string;
    messageType: 'user' | 'ai' | 'system' | 'milestone' | 'unknown';
    hasText: boolean;
    hasContent: boolean;
    hasOptions: boolean;
    hasAction: boolean;
    textLength: number;
    isJson: boolean;
    jsonParseable: boolean;
    parsedAsV2: boolean;
    rawContentPreview: string;
}

/**
 * Analyzes a message object for debugging purposes
 */
export function debugMessage(msg: any): ChatDebugInfo {
    const timestamp = new Date().toISOString();
    const rawContent = msg.text || msg.content || '';
    const textLength = rawContent.length;
    
    // Check if content looks like JSON
    const trimmed = rawContent.trim();
    const isJson = trimmed.startsWith('{') && trimmed.endsWith('}');
    
    // Try to parse JSON
    let jsonParseable = false;
    let parsedAsV2 = false;
    
    if (isJson) {
        try {
            const parsed = JSON.parse(trimmed);
            jsonParseable = true;
            parsedAsV2 = 'response' in parsed || Array.isArray(parsed.options);
        } catch (e) {
            jsonParseable = false;
        }
    }
    
    // Determine message type
    let messageType: ChatDebugInfo['messageType'] = 'unknown';
    if (msg.type === 'milestone' || msg.milestoneType) {
        messageType = 'milestone';
    } else if (msg.role === 'system') {
        messageType = 'system';
    } else if (msg.role === 'user') {
        messageType = 'user';
    } else if (msg.role === 'ai') {
        messageType = 'ai';
    }
    
    return {
        timestamp,
        messageType,
        hasText: !!msg.text,
        hasContent: !!msg.content,
        hasOptions: !!(msg.options && Array.isArray(msg.options) && msg.options.length > 0),
        hasAction: !!msg.action,
        textLength,
        isJson,
        jsonParseable,
        parsedAsV2,
        rawContentPreview: rawContent.substring(0, 200) + (rawContent.length > 200 ? '...' : '')
    };
}

/**
 * Logs detailed message information for debugging
 */
export function logMessageDebug(msg: any, context: string = 'Unknown') {
    const debug = debugMessage(msg);
    
    console.group(`[ChatDebug] ${context}`);
    console.log('Message Debug Info:', debug);
    console.log('Full Message Object:', msg);
    
    if (debug.isJson && !debug.jsonParseable) {
        console.warn('JSON content failed to parse!');
    }
    
    if (debug.hasText && debug.hasContent && msg.text !== msg.content) {
        console.warn('Message has both text and content fields with different values!');
    }
    
    if (msg.role === 'ai' && !debug.hasText && !debug.hasContent && !debug.hasOptions && !debug.hasAction) {
        console.error('AI message is completely empty!');
    }
    
    console.groupEnd();
    
    return debug;
}

/**
 * Creates a debug summary for recent messages
 */
export function createDebugSummary(messages: any[]): string {
    const summary = messages.map((msg, idx) => {
        const debug = debugMessage(msg);
        return `[${idx}] ${debug.messageType}: ${debug.textLength} chars, JSON:${debug.isJson}, V2:${debug.parsedAsV2}`;
    }).join('\n');
    
    return `Chat Debug Summary (${messages.length} messages):\n${summary}`;
}

/**
 * Checks for common message display issues
 */
export function checkMessageDisplayIssues(msg: any): string[] {
    const issues: string[] = [];
    const debug = debugMessage(msg);
    
    if (msg.role === 'ai' && !debug.hasText && !debug.hasContent) {
        issues.push('AI message has no text or content');
    }
    
    if (debug.isJson && !debug.jsonParseable) {
        issues.push('JSON content failed to parse');
    }
    
    if (debug.parsedAsV2 && debug.textLength === 0 && !debug.hasOptions) {
        issues.push('V2 message parsed but has no text and no options');
    }
    
    if (msg.hasOptions && (!Array.isArray(msg.options) || msg.options.length === 0)) {
        issues.push('Message flagged as having options but options array is empty/invalid');
    }
    
    return issues;
}
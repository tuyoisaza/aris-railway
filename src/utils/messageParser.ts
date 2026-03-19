/**
 * Message Parser Utility
 * 
 * Centralized V2 JSON parsing logic for ARIS messages.
 * Extracted from GlobalContext.tsx to reduce file size and improve maintainability.
 */

export interface ParsedMessage {
    text: string;
    role?: string;
    options?: string[];
    action?: { type: string; payload: any } | null;
    type?: 'aris_v2' | 'proposal' | 'milestone';
    projectData?: any;
    milestoneType?: string;
    topic?: string;
    shouldRefresh?: boolean;
}

/**
 * Parse raw message content and extract V2 JSON structure if present.
 * Handles multiple message formats:
 * - ARIS V2 JSON Triple (response, options, action)
 * - Legacy Project Proposals
 * - Legacy Milestone JSON
 */
export function parseV2Message(rawContent: string, role: string = 'ai'): ParsedMessage {
    let msgText = rawContent;
    let msgMetadata: Partial<ParsedMessage> = {};
    let shouldRefresh = false;

    try {
        const trimText = msgText.trim();
        const firstBrace = trimText.indexOf('{');
        const lastBrace = trimText.lastIndexOf('}');

        if (firstBrace >= 0 && lastBrace > firstBrace) {
            const jsonCandidate = trimText.substring(firstBrace, lastBrace + 1);
            
            // Enhanced JSON parsing with detailed error logging
            let parsed;
            try {
                parsed = JSON.parse(jsonCandidate);
            } catch (parseError) {
                console.warn('[MessageParser] JSON parse failed:', {
                    error: parseError.message,
                    jsonCandidate: jsonCandidate.substring(0, 200) + (jsonCandidate.length > 200 ? '...' : ''),
                    role,
                    timestamp: new Date().toISOString()
                });
                throw parseError;
            }

            // Check for ARIS V2 Signature: has 'response' key OR 'options' array
            const isV2 = 'response' in parsed || Array.isArray(parsed.options);
            if (isV2) {
                msgText = parsed.response || "";
                msgMetadata = {
                    options: parsed.options || [],
                    action: parsed.action || null,
                    type: 'aris_v2'
                };

                // Check for Project Proposal Action
                if (parsed.action && (parsed.action.type === 'project:propose' || parsed.action.type === 'proposal') && parsed.action.payload) {
                    msgMetadata.type = 'proposal';
                    msgMetadata.projectData = parsed.action.payload;
                }

                // Check if the action itself is a milestone
                if (parsed.action && parsed.action.type === 'milestone' && parsed.action.payload) {
                    msgMetadata.type = 'milestone';
                    msgMetadata.milestoneType = parsed.action.payload.milestoneType || 'BRANCH';
                    msgMetadata.topic = parsed.action.payload.topic || '';
                }

                shouldRefresh = true;
            }
            // Check for Legacy/Direct Project Proposal
            else if (parsed.isProposal || parsed.type === 'proposal') {
                msgMetadata = {
                    type: 'proposal',
                    projectData: parsed.projectData || parsed.payload || parsed
                };
                msgText = "";
                shouldRefresh = true;
            }
            // Check for Milestone JSON (Server creates this for 'system' messages)
            else if (parsed.type === 'milestone' || parsed.milestoneType) {
                msgMetadata = {
                    type: 'milestone',
                    milestoneType: parsed.milestoneType || 'BRANCH',
                    topic: parsed.topic || parsed.display?.split(': ')[1] || ''
                };
                msgText = "";
                shouldRefresh = true;
            }
        }
} catch (e) {
        // Enhanced error logging for debugging
        if (e instanceof SyntaxError && e.message.includes('JSON')) {
            console.warn('[MessageParser] Failed to parse JSON in message:', {
                error: e.message,
                contentPreview: rawContent.substring(0, 150) + (rawContent.length > 150 ? '...' : ''),
                role,
                timestamp: new Date().toISOString()
            });
        }
    }

if ((role === 'ai' || role === 'system') && !msgText && !msgMetadata.type) {
        console.warn('[MessageParser] Empty message with no metadata, using fallback:', {
            originalContent: rawContent.substring(0, 100),
            role,
            metadata: msgMetadata,
            timestamp: new Date().toISOString()
        });
        msgText = "...";
    }

// Debug logging for parsed messages
    if (role === 'ai' && (!msgText || msgText === '...')) {
        console.warn('[MessageParser] AI message resulted in fallback content:', {
            originalContent: rawContent.substring(0, 100),
            parsedText: msgText,
            metadata: msgMetadata,
            timestamp: new Date().toISOString()
        });
    }

    return {
        text: msgText,
        role,
        shouldRefresh,
        ...msgMetadata
    };
}

/**
 * Parse message for loading from conversation history.
 */
export function parseHistoryMessage(msg: { content?: string; text?: string; role: string; created_at?: string }): ParsedMessage & { timestamp: string } {
    const rawContent = msg.content || msg.text || "";
    const parsed = parseV2Message(rawContent, msg.role);

    return {
        ...parsed,
        timestamp: msg.created_at || new Date().toISOString()
    };
}

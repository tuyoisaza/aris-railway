export type GuidedActionHandler = (payload: any, intent: string, navigate: (path: string) => void) => void | Promise<void>;

interface ActionDefinition {
    handler: GuidedActionHandler;
    description: string;
}

class ActionRegistry {
    private actions: Map<string, ActionDefinition> = new Map();

    register(name: string, handler: GuidedActionHandler, description: string = '') {
        this.actions.set(name, { handler, description });
        console.log(`[ActionRegistry] Registered action: ${name}`);
    }

    async execute(name: string, payloadBase64: string, intent: string, navigate: (path: string) => void) {
        const action = this.actions.get(name);
        if (!action) {
            console.error(`[ActionRegistry] Action not found: ${name}`);
            throw new Error(`Action '${name}' not found.`);
        }


        let payload: any = {};

        // Security/Performance Check
        if (payloadBase64 && payloadBase64.length > 2048) {
            console.warn('[ActionRegistry] WARNING: Payload is very large (>2KB). Large payloads in URL may be truncated by browsers/servers. Consider using POST or storage.');
        }

        // Strategy: 
        // 1. Try to decode as Base64.
        // 2. If decoding fails (atob throws), use raw text.
        // 3. If decoding succeeds, try to parse as JSON.
        // 4. If JSON parse fails, use the decoded string.

        try {
            // URL-safe Base64 -> Standard Base64
            const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');

            // This will throw if invalid base64 string
            const decodedString = atob(base64);

            try {
                // Try parsing as JSON first
                payload = JSON.parse(decodedString);
            } catch {
                // Not JSON, use decoded string as context
                payload = decodedString;
            }
        } catch (e) {
            // Decoding failed, so it wasn't base64. Treat as raw text.
            console.log('[ActionRegistry] Payload is not valid Base64, treating as raw text.');
            payload = payloadBase64;
        }

        console.log(`[ActionRegistry] Executing action: ${name}`, { intent, payloadType: typeof payload });
        await action.handler(payload, intent, navigate);
    }

    getActions() {
        return Array.from(this.actions.keys());
    }
}

export default new ActionRegistry();

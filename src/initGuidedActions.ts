import ActionRegistry from './services/ActionRegistry';
import { api } from './services/api';

// Initialize Guided Actions
export const initGuidedActions = () => {
    // 1. Conversation Action
    ActionRegistry.register('conversation', async (payload: any, intent: string, navigate: (path: string, options?: any) => void) => {
        try {
            console.log('[Guided Actions] Executing Conversation Action via Agora...', { intent });
            // Delegate creation to backend Agora -> ConversationAction
            const result = await api.agora.executeAction('conversation', payload, intent);

            if (result.success && result.url) {
                console.log('[Guided Actions] Conversation created, navigating to:', result.url);
                navigate(result.url);
            } else {
                console.error('[Guided Actions] Failed to create conversation:', result);
                navigate('/');
            }
        } catch (e) {
            console.error('[Guided Actions] API Error:', e);
            navigate('/');
        }
    }, 'Creates a conversation via backend.');

    // 2. Project Action
    ActionRegistry.register('project', async (payload: any, intent: string, navigate: (path: string, options?: any) => void) => {
        try {
            console.log('[Guided Actions] Executing Project Action via Agora...', { intent });
            // Delegate creation to backend Agora -> ProjectAction
            const result = await api.agora.executeAction('project', payload, intent);

            if (result.success && result.url) {
                console.log('[Guided Actions] Project created, navigating to:', result.url);
                navigate(result.url);
            } else {
                console.error('[Guided Actions] Failed to create project:', result);
                navigate('/projects');
            }
        } catch (e) {
            console.error('[Guided Actions] API Error:', e);
            navigate('/projects');
        }
    }, 'Creates a project via backend.');

    // 3. Topic Action
    ActionRegistry.register('topic', async (payload: any, intent: string, navigate: (path: string, options?: any) => void) => {
        try {
            console.log('[Guided Actions] Executing Topic Action via Agora...', { intent });
            // Delegate creation to backend Agora -> TopicAction
            const result = await api.agora.executeAction('topic', payload, intent);

            if (result.success && result.url) {
                console.log('[Guided Actions] Topic created, navigating to:', result.url);
                navigate(result.url);
            } else {
                console.error('[Guided Actions] Failed to create topic:', result);
                navigate('/');
            }
        } catch (e) {
            console.error('[Guided Actions] API Error:', e);
            navigate('/');
        }
    }, 'Creates a topic via backend.');

    // 4. Skill Action
    ActionRegistry.register('skill', async (payload: any, intent: string, navigate: (path: string, options?: any) => void) => {
        try {
            console.log('[Guided Actions] Executing Skill Action via Agora...', { intent });
            // Delegate creation to backend Agora -> Lugh
            const result = await api.agora.executeAction('skill', payload, intent);

            if (result.success && result.url) {
                console.log('[Guided Actions] Skill created, navigating to:', result.url);
                navigate(result.url);
            } else {
                console.error('[Guided Actions] Failed to create skill:', result);
                // Fallback: Go to skills page
                navigate('/skills');
            }
        } catch (e) {
            console.error('[Guided Actions] API Error:', e);
            navigate('/skills'); // Fail gracefull
        }
    }, 'Navigates to skill context.');

    console.log('[Guided Actions] Initialized and registered default actions.');
};

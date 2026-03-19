import OpenAI from 'openai';
import { MENTOR_PROMPTS, BASE_SYSTEM_PROMPT } from '../config/prompts';
import { IntegrationService } from './integration/integration.service';

// Initialize OpenAI
// Note: In production, ensure OPENAI_API_KEY is set.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key', // Fallback for dev if env missing
});

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export class AIService {
    static async streamChat(
        mentorId: string,
        history: ChatMessage[],
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        onError: (err: any) => void
    ) {
        // Para mentores avanzados, usar ARIS
        if (mentorId === 'advanced' || mentorId === 'teacher' || mentorId === 'cognitive') {
            try {
                const lastMessage = history[history.length - 1];
                const result = await IntegrationService.getAdvancedMentoring(
                    'temp-user', // Debería venir del contexto real
                    lastMessage.content
                );
                
                if (result.success && result.service === 'aris') {
                    // Procesar respuesta de ARIS
                    const response = result.data.aiMessage?.text || result.data.aiMessage?.content || '';
                    onChunk(response);
                    onComplete();
                    return;
                }
            } catch (error: any) {
                console.error("ARIS fallback error:", error);
                // Continuar con el sistema local si ARIS falla
            }
        }

        try {
            const mentorPrompt = MENTOR_PROMPTS[mentorId.toLowerCase()] || MENTOR_PROMPTS['marcus'];
            const systemMessage: ChatMessage = {
                role: 'system',
                content: `${BASE_SYSTEM_PROMPT}\n\n${mentorPrompt}`
            };

            const stream = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview', // Or gpt-3.5-turbo
                messages: [systemMessage, ...history],
                stream: true,
                temperature: 0.7,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    onChunk(content);
                }
            }
            onComplete();
        } catch (error) {
            console.error("OpenAI Stream Error:", error);
            // Verify if it's an API key error to give better feedback
            if (process.env.OPENAI_API_KEY === 'mock-key') {
                onError(new Error("Missing OpenAI API Key. Please configure .env"));
            } else {
                onError(error);
            }
        }
    }

    static async smartStreamChat(
        mentorId: string,
        history: ChatMessage[],
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        onError: (err: any) => void
    ) {
        // Para mentores avanzados, usar ARIS
        if (mentorId === 'advanced' || mentorId === 'teacher' || mentorId === 'cognitive') {
            try {
                const lastMessage = history[history.length - 1];
                const result = await IntegrationService.getAdvancedMentoring(
                    'temp-user', // Debería venir del contexto real
                    lastMessage.content
                );
                
                if (result.success && result.service === 'aris') {
                    // Procesar respuesta de ARIS
                    const response = result.data.aiMessage?.text || result.data.aiMessage?.content || '';
                    onChunk(response);
                    onComplete();
                    return;
                }
            } catch (error: any) {
                console.error("ARIS fallback error:", error);
                // Continuar con el sistema local si ARIS falla
            }
        }
        
        // Usar sistema local de UPGRADE! por defecto
        this.streamChat(mentorId, history, onChunk, onComplete, onError);
    }

    static async analyzeJournal(entries: any[]): Promise<{ trends: string[], insight: string }> {
        if (!entries || entries.length === 0) {
            return { trends: [], insight: "Not enough data to generate insights yet." };
        }

        try {
            const systemPrompt = `You are a Data Analyst for the 'Upgrade' platform.
            Your job is to analyze the user's decision journal and extract patterns.
            Output JSON format: { "trends": ["string"], "insight": "string" }
            Keep insights actionable and brief.`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: JSON.stringify(entries.slice(0, 10)) } // Limit context
                ],
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content || '{}';
            return JSON.parse(content);
        } catch (error) {
            console.error("AI Analysis Error:", error);
            // Mock fallback if API fails (e.g., dev mode)
            if (process.env.OPENAI_API_KEY === 'mock-key') {
                return {
                    trends: ["Mock Trend: Increasing clarity", "Mock Trend: Bias towards speed"],
                    insight: "This is a mock insight generated because OpenAI API key is missing."
                };
            }
            throw error;
        }
    }
}

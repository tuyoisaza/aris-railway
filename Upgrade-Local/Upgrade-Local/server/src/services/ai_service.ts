import OpenAI from 'openai';
import { COURSE_GENERATOR_PROMPT, STRUCTURE_DEFINITION } from './course_generator_prompt';
import { supabase } from '../db';

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

// HACK: Mapping "fake" future models (same as before)
export const MODEL_MAP: Record<string, string> = {
    "gpt-5-nano": "gpt-4o-mini",
    "gpt-5-mini": "gpt-4o-mini",
    "gpt-5": "gpt-4o",
    "gpt-4.1-nano": "gpt-4o-mini",
    "gpt-4.1-mini": "gpt-4o-mini",
    "gpt-4.1": "gpt-4-turbo",
    "gpt-5.2": "gpt-4o",
    "gpt-5.2-pro": "gpt-4o"
};

/**
 * Generates a course syllabus using OpenAI if available.
 * @param {string} topic 
 * @param {string} axisId - 'human', 'leadership', 'cocreation'
 * @returns {Promise<Object|null>} Returns the generated syllabus object or null if AI is not configured.
 */
export async function generateCourseWithAI(topic: string, axisId: string) {
    if (!openai) {
        console.log('[AI Service] No OpenAI API Key found. Skipping AI generation.');
        return null;
    }

    // 1. Fetch 'Architect' Agent Configuration
    // This overrides the global settings if the agent is defined.
    let systemPrompt = COURSE_GENERATOR_PROMPT;
    let selectedModel = "gpt-4o-mini";
    let temperature = 0.7;

    try {
        const { data: agent } = await supabase
            .from('ai_agents')
            .select('*')
            .eq('id', 'architect')
            .maybeSingle();

        if (agent) {
            console.log('[AI Service] Using "The Architect" agent configuration from DB.');
            if (agent.system_prompt) systemPrompt = agent.system_prompt;
            if (agent.model) selectedModel = agent.model;
            if (agent.temperature) temperature = agent.temperature;
        } else {
            // Fallback to global settings if agent not found
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'ai_model')
                .maybeSingle();

            if (data && data.value && data.value.model) {
                selectedModel = data.value.model;
            }
        }

        if (MODEL_MAP[selectedModel]) {
            console.log(`[AI Service] Mapping requested "${selectedModel}" to available "${MODEL_MAP[selectedModel]}"`);
            selectedModel = MODEL_MAP[selectedModel];
        }

    } catch (e: any) {
        console.warn('[AI Service] Failed to fetch agent/settings, using defaults:', e.message);
    }

    console.log(`[AI Service] Generating course for topic: "${topic}" in axis "${axisId}" using OpenAI model: ${selectedModel}...`);

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `${systemPrompt}

IMPORTANT: You must output valid JSON.
The JSON structure must be:
{
    "axis_id": "human" | "leadership" | "cocreation",
    "syllabus": [
        { "title": "Propósito del Upgrade", "duration": "5 min", "desc": "..." },
        ... (all 10 steps)
    ]
}
Ensure the "syllabus" array has exactly 10 items matching the titles defined in your instructions.
FOCUSED AXIS: The user has explicitly selected the axis: "${axisId}". Ensure the content is tailored to this axis.`
                },
                { role: "user", content: `Tema del curso: "${topic}". Eje: ${axisId}` }
            ],
            model: selectedModel,
            response_format: { type: "json_object" },
            temperature: temperature,
        });

        const content = completion.choices[0].message.content;
        const result = JSON.parse(content || '{}');

        return {
            ...result,
            model: completion.model,
            prompt_version: "v1-architect"
        };

    } catch (error) {
        console.error('[AI Service] Generation failed:', error);
        throw error;
    }
}

export { openai };


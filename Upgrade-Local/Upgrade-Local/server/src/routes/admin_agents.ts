import express, { Request, Response } from 'express';
import { supabase } from '../db';
import { openai, MODEL_MAP } from '../services/ai_service';
import { verifyAdmin } from '../middleware/auth';

const router = express.Router();

// GET /api/admin/agents - List all agents
router.get('/', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('ai_agents')
            .select('*')
            .order('name');

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/agents - Create or Update Agent
router.post('/', verifyAdmin, async (req: Request, res: Response) => {
    try {
        console.log('[AdminAgents] POST received body:', JSON.stringify(req.body));
        const agent = req.body;
        // Validate
        if (!agent.id || !agent.name || !agent.system_prompt) {
            console.error('[AdminAgents] Missing fields:', agent);
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log('[AdminAgents] Upserting agent:', agent.id);
        const { data, error } = await supabase
            .from('ai_agents')
            .upsert({
                id: agent.id,
                name: agent.name,
                role_description: agent.role_description,
                system_prompt: agent.system_prompt,
                model: agent.model || 'gpt-4o-mini',
                temperature: agent.temperature || 0.7,
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) {
            console.error('[AdminAgents] DB Error:', error);
            throw error;
        }

        console.log('[AdminAgents] Upsert success:', data);
        res.json(data[0]);
    } catch (error: any) {
        console.error('Error saving agent:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/agents/chat - Test Interaction
router.post('/chat', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { system_prompt, messages, model, temperature } = req.body;

        if (!system_prompt) {
            return res.status(400).json({ error: 'System prompt is required' });
        }

        const conversation = [
            { role: 'system', content: system_prompt },
            ...messages // [{role: 'user', content: '...'}]
        ];

        if (!openai) {
            return res.status(503).json({ error: 'OpenAI not configured' });
        }

        // Apply Model Map
        let selectedModel = model || 'gpt-4o-mini';
        if (MODEL_MAP[selectedModel]) {
            console.log(`[AdminChat] Mapping "${selectedModel}" to "${MODEL_MAP[selectedModel]}"`);
            selectedModel = MODEL_MAP[selectedModel];
        }

        const completion = await openai.chat.completions.create({
            messages: conversation as any, // OpenAI types might be strict
            model: selectedModel,
            temperature: parseFloat(temperature) || 0.7,
        });

        res.json({ message: completion.choices[0].message });
    } catch (error: any) {
        console.error('Error in agent chat:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;


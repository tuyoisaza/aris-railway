import express, { Request, Response } from 'express';
import { supabase } from '../db';
import { verifyAdmin } from '../middleware/auth';
import { generateCourseWithAI } from '../services/ai_service';

// Lazy load prompt constants if needed, or import them.
// Since ai_service handles generation, we might not need prompt constants here unless for fallback.
import { STRUCTURE_DEFINITION } from '../services/course_generator_prompt';

const router = express.Router();

// --- ROUTES ---

// 1. Generate Course Draft (Mock/Template Engine)
router.post('/generate', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { topic, axis_id } = req.body;

        if (!topic) return res.status(400).json({ error: 'Topic is required' });
        if (!axis_id) return res.status(400).json({ error: 'Axis is required' });

        console.log(`[Generator] Request received for: "${topic}" in axis "${axis_id}"`);

        // Resolve a default category for this axis (since DB requires it or it's good practice)
        // We'll pick the first one. In future, AI could decide.
        const { data: categories } = await supabase
            .from('categories')
            .select('id')
            .eq('axis_id', axis_id)
            .limit(1);

        const category_id = categories && categories.length > 0 ? categories[0].id : null;

        let syllabus: any[] = [];
        let generatedAxis = axis_id;
        let aiMetadata = {};
        let isAiGenerated = false;

        // 1. Try AI Generation
        try {
            const aiResult: any = await generateCourseWithAI(topic, axis_id);

            if (aiResult) {
                console.log('[Generator] AI Generation Successful!');
                syllabus = aiResult.syllabus;
                if (aiResult.axis_id) generatedAxis = aiResult.axis_id;

                aiMetadata = {
                    model: aiResult.model,
                    prompt_version: aiResult.prompt_version,
                    generated_at: new Date().toISOString()
                };
                isAiGenerated = true;
            }
        } catch (e: any) {
            console.error('[Generator] AI Failed, falling back to template:', e.message);
            // Fallback continues below
        }

        // 2. Fallback: Template Generation (if AI failed or no key)
        if (!isAiGenerated) {
            console.log('[Generator] Using Template Engine (Mock Mode)');
            syllabus = STRUCTURE_DEFINITION.map(step => ({
                title: step.title,
                duration: step.duration,
                desc: step.desc
            }));

            aiMetadata = {
                model: "template-engine-v1 (fallback)",
                prompt_version: "v1-architect",
                generated_at: new Date().toISOString()
            };
        }

        // Create Course in DB
        const courseId = `gen_${Date.now()}_${topic.substring(0, 10).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()}`;

        const newCourse = {
            id: courseId,
            category_id: category_id || null,
            title: `Upgrade: ${topic}`,
            description: isAiGenerated
                ? `Curso diseñado por Upgrade Architect sobre ${topic}.`
                : `Curso preliminar sobre ${topic} (Estructura Base).`,
            duration: "105 min",
            syllabus: syllabus,
            status: 'draft',
            origin_topic: topic,
            ai_metadata: aiMetadata
        };

        const { data, error } = await supabase
            .from('courses')
            .insert([newCourse])
            .select();

        if (error) throw error;

        res.json(data[0]);

    } catch (error: any) {
        console.error('Generator Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Get All Courses (Admin View - includes Drafts)
router.get('/', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*, categories(title, axis_id)');

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Update Course (Review/Edit)
router.put('/:id', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('courses')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Publish Course
router.post('/:id/publish', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('courses')
            .update({ status: 'published' })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Unpublish Course (Revert to Draft)
router.post('/:id/unpublish', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('courses')
            .update({ status: 'draft' })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;


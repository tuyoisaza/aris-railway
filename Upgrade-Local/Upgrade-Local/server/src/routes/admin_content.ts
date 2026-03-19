
import express, { Request, Response } from 'express';
import { verifyAdmin } from '../middleware/auth';
import { bulkExperienceService } from '../services/bulk_experience_service';
import { supabase } from '../db';

const router = express.Router();

router.use(verifyAdmin);

// Get Status
router.get('/status', (req: Request, res: Response) => {
    res.json(bulkExperienceService.getStatus());
});

// Per-course status snapshot (language completeness)
router.get('/course-status', async (req: Request, res: Response) => {
    try {
        const idsParam = typeof req.query.ids === 'string' ? req.query.ids : '';
        const courseIds = idsParam
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        if (courseIds.length === 0) return res.json({});

        // Fetch syllabi to know expected step count.
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id, syllabus')
            .in('id', courseIds);

        if (coursesError) throw coursesError;

        const expectedSteps: Record<string, number> = {};
        (courses || []).forEach((c: any) => {
            expectedSteps[c.id] = Array.isArray(c.syllabus) ? c.syllabus.length : 0;
        });

        const { data: rows, error } = await supabase
            .from('course_step_translations')
            .select('course_id, lang, step_index')
            .in('course_id', courseIds);

        if (error) throw error;

        const out: any = {};
        for (const id of courseIds) {
            out[id] = {
                expected_steps: expectedSteps[id] || 0,
                langs: {
                    en: { steps_done: 0, is_complete: false },
                    es: { steps_done: 0, is_complete: false },
                    pt: { steps_done: 0, is_complete: false }
                }
            };
        }

        // Count unique step indexes per (course, lang)
        const seen = new Set<string>();
        (rows || []).forEach((r: any) => {
            const key = `${r.course_id}|${r.lang}|${r.step_index}`;
            if (seen.has(key)) return;
            seen.add(key);
            if (!out[r.course_id] || !out[r.course_id].langs?.[r.lang]) return;
            out[r.course_id].langs[r.lang].steps_done++;
        });

        for (const id of courseIds) {
            const total = out[id].expected_steps;
            for (const lang of ['en', 'es', 'pt']) {
                out[id].langs[lang].is_complete = total > 0 && out[id].langs[lang].steps_done >= total;
            }
        }

        res.json(out);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Start Generation
router.post('/generate', async (req: Request, res: Response) => {
    const status = bulkExperienceService.getStatus();
    if (status.isRunning) {
        return res.status(400).json({ error: 'Generation already in progress' });
    }

    const langParam = typeof req.query.lang === 'string' ? req.query.lang : undefined;
    if (langParam && !['es', 'en', 'pt'].includes(langParam)) {
        return res.status(400).json({ error: 'Unsupported lang. Use es, en, or pt.' });
    }

    const lang = langParam as 'es' | 'en' | 'pt' | undefined;

    // Start background process
    bulkExperienceService.startGeneration(lang);

    res.json({ success: true, message: 'Generation started' });
});

// Generate for a single course (language-aware)
router.post('/generate-course', async (req: Request, res: Response) => {
    const { courseId, lang } = req.body || {};

    if (!courseId || typeof courseId !== 'string') {
        return res.status(400).json({ error: 'courseId is required' });
    }
    if (lang && !['en', 'es', 'pt'].includes(lang)) {
        return res.status(400).json({ error: 'Unsupported lang. Use en, es, or pt.' });
    }

    try {
        const status = bulkExperienceService.getStatus();
        if (status.isRunning) {
            return res.status(400).json({ error: 'Generation already in progress' });
        }

        bulkExperienceService.startCourseGeneration(courseId, lang);

        res.json({ success: true, message: 'Course generation started', courseId });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Stop Generation
router.post('/stop', async (req: Request, res: Response) => {
    bulkExperienceService.stopGeneration();
    res.json({ success: true, message: 'Generation stop requested' });
});

export default router;

import express, { Request, Response, NextFunction } from 'express';
import { supabase } from '../db';
import stripe from '../stripe';
import { verifyAuth, verifyAdmin } from '../middleware/auth';
import requireSubscription from '../middleware/requireSubscription';
// generateLessonContent was imported here but also later. Removing this one.

// Import sub-routers

import adminRoutes from './admin.routes';
import adminCoursesRouter from './admin_courses';
import adminSettingsRouter from './admin_settings';
import adminAgentsRouter from './admin_agents';
import adminUsersRouter from './admin_users'; // Legacy, might need to replace or coexist
import adminContentRouter from './admin_content';
import invitesRouter from './invites';
import chatRouter from './chat';
import analyticsRouter from './analytics';
import integrationRouter from './integration';

const router = express.Router();

router.use('/invites', invitesRouter);
router.use('/chat', chatRouter);
router.use('/analytics', analyticsRouter);

// --- PUBLIC DATA ENDPOINTS ---
import { SystemService } from '../services/system.service';

router.get('/settings', async (req: Request, res: Response) => {
    try {
        const debugMode = await SystemService.isDebugMode();
        res.json({ debug_mode: debugMode });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Axes
router.get('/axes', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase.from('axes').select('*').order('sort_order', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Mentors (Public)
router.get('/mentors', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('mentors')
            .select('*')
            .eq('is_visible', true)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Translations
router.get('/translations/:lang', async (req: Request, res: Response) => {
    try {
        const { lang } = req.params;
        const { data, error } = await supabase
            .from('translations')
            .select('key, value')
            .eq('lang', lang);

        if (error) throw error;

        // Transform back to Key-Value object
        const result: Record<string, string> = {};
        if (data) {
            data.forEach((row: any) => {
                result[row.key] = row.value;
            });
        }
        res.json(result);
    } catch (error: any) {
        console.error('Translation API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Course localized content
// Returns only translation-aware fields for a given course and language.
router.get('/courses/:id/content/:lang', async (req: Request, res: Response) => {
    try {
        const { id, lang } = req.params;

        if (!['en', 'es', 'pt'].includes(lang)) {
            return res.status(400).json({ error: 'Unsupported lang. Use en, es, or pt.' });
        }

        const { data: course, error } = await supabase
            .from('courses')
            .select('id, title, description, duration, syllabus')
            .eq('id', id)
            .single();

        if (error || !course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const syllabus = Array.isArray(course.syllabus) ? course.syllabus : [];

        // Prefer dedicated localization tables; fall back to legacy translations table; then fall back to base course.
        const { data: courseTr } = await supabase
            .from('course_translations')
            .select('title, description')
            .eq('course_id', id)
            .eq('lang', lang)
            .maybeSingle();

        const { data: stepTrRows } = await supabase
            .from('course_step_translations')
            .select('step_index, title, description, markdown_content, resources, estimated_read_time')
            .eq('course_id', id)
            .eq('lang', lang);

        const stepTrByIndex = new Map<number, any>();
        (stepTrRows || []).forEach((row: any) => {
            stepTrByIndex.set(row.step_index, row);
        });

        // Legacy fallback: translations table keys
        const prefix = `course.${id}.`;
        const legacyKeys: string[] = [
            `${prefix}title`,
            `${prefix}description`
        ];
        for (let i = 0; i < syllabus.length; i++) {
            legacyKeys.push(`${prefix}syllabus.${i}.title`);
            legacyKeys.push(`${prefix}syllabus.${i}.desc`);
            legacyKeys.push(`${prefix}syllabus.${i}.content.markdown_content`);
            legacyKeys.push(`${prefix}syllabus.${i}.content.resources`);
        }

        const { data: legacyRows } = await supabase
            .from('translations')
            .select('key, value')
            .eq('lang', lang)
            .in('key', legacyKeys);

        const legacy: Record<string, string> = {};
        (legacyRows || []).forEach((row: any) => {
            legacy[row.key] = row.value;
        });

        const localizedTitle =
            courseTr?.title ??
            legacy[`${prefix}title`] ??
            course.title;

        const localizedDescription =
            courseTr?.description ??
            legacy[`${prefix}description`] ??
            course.description;

        const localizedSyllabus = syllabus.map((step: any, i: number) => {
            const content = step?.content;

            const stepTr = stepTrByIndex.get(i);

            const legacyResourcesKey = `${prefix}syllabus.${i}.content.resources`;
            const legacyResourcesJson = legacy[legacyResourcesKey];
            const legacyResources = (() => {
                if (!legacyResourcesJson) return undefined;
                try {
                    return JSON.parse(legacyResourcesJson);
                } catch (_e) {
                    return undefined;
                }
            })();

            const legacyMarkdownKey = `${prefix}syllabus.${i}.content.markdown_content`;
            const legacyMarkdown = legacy[legacyMarkdownKey];

            return {
                ...step,
                title: stepTr?.title ?? legacy[`${prefix}syllabus.${i}.title`] ?? step.title,
                desc: stepTr?.description ?? legacy[`${prefix}syllabus.${i}.desc`] ?? step.desc,
                content: content
                    ? {
                        ...content,
                        markdown_content: stepTr?.markdown_content ?? legacyMarkdown ?? content.markdown_content,
                        resources: stepTr?.resources ?? legacyResources ?? content.resources,
                        estimated_read_time: stepTr?.estimated_read_time ?? content.estimated_read_time
                    }
                    : content
            };
        });

        res.json({
            id: course.id,
            title: localizedTitle,
            description: localizedDescription,
            duration: course.duration,
            syllabus: localizedSyllabus
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Pensum (Reconstruct JSON structure)
router.get('/pensum', async (req: Request, res: Response) => {
    try {
        // Fetch all data
        const { data: axes, error: errorAxes } = await supabase.from('axes').select('*');
        const { data: categories, error: errorCats } = await supabase.from('categories').select('*');
        const { data: courses, error: errorCourses } = await supabase.from('courses').select('*');

        if (errorAxes) throw errorAxes;
        if (errorCats) throw errorCats;
        if (errorCourses) throw errorCourses;

        // Ensure arrays are not null
        const safeAxes = axes || [];
        const safeCats = categories || [];
        const safeCourses = courses || [];

        // Build Tree
        const pensum: any = {};

        if (axes) {
            axes.forEach((axis: any) => {
                pensum[axis.id] = {
                    id: axis.id,
                    title_key: axis.title_key,
                    desc_key: axis.desc_key,
                    categories: []
                };
            });
        }

        if (categories) {
            categories.forEach((cat: any) => {
                if (pensum[cat.axis_id]) {
                    pensum[cat.axis_id].categories.push({
                        ...cat,
                        courses: []
                    });
                }
            });
        }

        if (courses) {
            courses.forEach((course: any) => {
                // Find category and axis
                for (const axisId in pensum) {
                    const cat = pensum[axisId].categories.find((c: any) => c.id === course.category_id);
                    if (cat) {
                        cat.courses.push({
                            id: course.id,
                            title: course.title,
                            duration: course.duration,
                            desc: course.description,
                            syllabus: course.syllabus
                        });
                        break;
                    }
                }
            });
        }

        res.json(pensum);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Tests (Public/Auth)
router.get('/tests', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


// --- USER ENDPOINTS (PROTECTED) ---

import { generateLessonContent } from '../services/experience_generator';

router.post('/user/course/:id/step/:index', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { id, index } = req.params;
        const stepIndex = parseInt(index);

        // 1. Fetch Course
        const { data: course, error } = await supabase
            .from('courses')
            .select(`
                *,
                categories (
                    title,
                    axis_id
                )
            `)
            .eq('id', id)
            .single();

        if (error || !course) return res.status(404).json({ error: 'Course not found' });

        // 2. Check if content already exists?
        // For now, we always regenerate or overwrite if requested. 
        // Ideally we check `course.syllabus[stepIndex].content` but our schema is JSONB.

        // 3. Generate Content
        console.log(`[Experience] Generating for Course ${id} Step ${stepIndex}`);
        const content = await generateLessonContent(course, stepIndex);

        // 4. Update Database
        // We need to update the specific array item in JSONB. 
        // PostgreSQL jsonb_set is tricky with arrays. 
        // Simplest way: Read, Modify, Write (since we verified concurrency is low for now).

        const newSyllabus = [...course.syllabus];
        if (!newSyllabus[stepIndex]) return res.status(404).json({ error: 'Step index out of bounds' });

        newSyllabus[stepIndex] = {
            ...newSyllabus[stepIndex],
            content: content // Add the generated content
        };

        const { error: updateError } = await supabase
            .from('courses')
            .update({ syllabus: newSyllabus })
            .eq('id', id);

        if (updateError) throw updateError;

        res.json({ success: true, content });

    } catch (error: any) {
        console.error("Experience Generation API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.use('/admin/courses', adminCoursesRouter);
router.use('/admin/settings', adminSettingsRouter); // Legacy
router.use('/admin/agents', adminAgentsRouter);
router.use('/admin/users', adminUsersRouter); // Legacy
router.use('/admin/content', adminContentRouter);

// New Super Admin Routes
router.use('/admin', adminRoutes); // Mounts /users, /system/settings, /system/logs directly under /api/admin

router.use('/user', verifyAuth); // Apply verifyAuth to all /user routes? No, logic in converted file was inline.
// But `router.use('/user', verifyAuth)` only applies to sub-routes if I mount here.
// Existing code: `router.use('/user', verifyAuth);` but then defined `router.get('/user', ...)` later?
// Express `router.use(path, middleware)` applies middleware to ANY route that starts with path.
// So `router.get('/user')` matches `/user`.
// But `router.use('/user', ...)` matches `/user` and `/user/*`.
// This seems correct.

// Test Protected Route
router.get('/premium-content', verifyAuth, requireSubscription, (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to the premium club!',
        data: 'Secret 123'
    });
});


// Get User Profile & Data
// Note: This matches /user exactly. Middleware above applies.
router.get('/user', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;

        // Parallel Fetch
        const [profile, tests, journal, subscription] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).single(),
            supabase.from('user_tests').select('*').eq('user_id', userId),
            supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle()
        ]);

        // If profile doesn't exist (first login), create it
        if (profile.error && profile.error.code === 'PGRST116') { // Not found
            const { data: newProfile, error: createError } = await supabase.from('profiles').insert({
                id: userId,
                email: req.user.email,
                full_name: req.user.user_metadata?.full_name || ''
            }).select().single();

            if (createError) throw createError;

            return res.json({
                profile: newProfile,
                tests: {},
                journal: [],
                subscription: null
            });
        }

        // Transform tests to object map { axis_id: testData }
        const testsMap: Record<string, any> = {};
        if (tests.data) {
            tests.data.forEach((t: any) => {
                testsMap[t.axis_id] = {
                    score: t.score,
                    levelTitle: t.level_title,
                    completedAt: t.completed_at
                };
            });
        }

        res.json({
            profile: profile.data,
            tests: testsMap,
            journal: journal.data || [],
            subscription: subscription.data || null
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

import { validate } from '../middleware/validate';
import { journalSchema, progressSchema } from '../schemas';

router.post('/user/progress', verifyAuth, validate(progressSchema), async (req: Request, res: Response) => {
    // For saving test results
    try {
        const { axis, data } = req.body;
        const userId = req.user.id;
        console.log(`[API] Save Progress for user ${userId}, axis ${axis}`, data);

        // 1. Check if record exists
        const { data: existing, error: fetchError } = await supabase
            .from('user_tests')
            .select('id')
            .eq('user_id', userId)
            .eq('axis_id', axis);

        if (fetchError) throw fetchError;

        // 2. Delete existing (to deduplicate if multiple found)
        if (existing && existing.length > 0) {
            const idsToDelete = existing.map((r: any) => r.id);
            await supabase.from('user_tests').delete().in('id', idsToDelete);
        }

        // 3. Insert new record
        const { error: insertError } = await supabase.from('user_tests').insert({
            user_id: userId,
            axis_id: axis,
            score: data.score,
            level_title: data.levelTitle,
            completed_at: new Date()
        });

        if (insertError) throw insertError;

        res.json({ success: true });
    } catch (error: any) {
        console.error("Save Progress Error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/user/journal', verifyAuth, validate(journalSchema), async (req: Request, res: Response) => {
    try {
        const entry = req.body;
        const userId = req.user.id;

        if (Array.isArray(entry)) {
            // Recommendation: Update frontend to append.
        } else {
            const { error } = await supabase.from('journal_entries').insert({
                user_id: userId,
                decision: entry.decision,
                context: entry.context,
                outcome: entry.outcome,
                review_date: entry.reviewDate,
                status: 'pending'
            });
            if (error) throw error;
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Generate Course Step Content (Experience)
router.post('/user/course/:id/step/:stepIndex', verifyAuth, async (req: Request, res: Response) => {
    try {
        const { id, stepIndex } = req.params;
        const index = parseInt(stepIndex);

        // 1. Fetch Course
        const { data: course, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !course) throw new Error("Course not found");

        // 2. Generate Content
        console.log(`[API] Generating content for course ${course.title} step ${index}`);
        const content = await generateLessonContent(course, index);

        // 3. Update Syllabus in DB
        const newSyllabus = [...course.syllabus];
        if (!newSyllabus[index]) throw new Error("Step index out of bounds");

        newSyllabus[index] = {
            ...newSyllabus[index],
            content: content
        };

        const { error: updateError } = await supabase
            .from('courses')
            .update({ syllabus: newSyllabus })
            .eq('id', id);

        if (updateError) throw updateError;

        res.json({ success: true, content });

    } catch (error: any) {
        console.error("Generate Step Error:", error);
        res.status(500).json({ error: error.message });
    }
});


// --- STRIPE ENDPOINTS (Private) ---
router.post('/create-checkout-session', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { plan } = req.body; // 'builder', 'practitioner', 'teams'

        let priceId;
        let mode: Stripe.Checkout.SessionCreateParams.Mode = 'subscription';
        let quantity = 1;

        switch (plan) {
            case 'builder':
                priceId = process.env.STRIPE_PRICE_BUILDER;
                break;
            case 'practitioner':
                priceId = process.env.STRIPE_PRICE_PRACTITIONER;
                break;
            case 'teams':
                priceId = process.env.STRIPE_PRICE_TEAMS;
                quantity = 5; // Minimum 5
                // logic for adjustable quantity could be added here or via frontend
                break;
            default:
                return res.status(400).json({ error: 'Invalid plan selected' });
        }

        if (!priceId || priceId.startsWith('price_...')) {
            return res.status(400).json({ error: 'Configuration Error: Price ID not set on server.' });
        }

        // Note: Stripe types are strict, `mode` must be 'payment' | 'subscription' | 'setup'
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: mode,
            customer_email: req.user.email,
            client_reference_id: userId,
            line_items: [
                {
                    price: priceId,
                    quantity: quantity,
                    adjustable_quantity: plan === 'teams' ? { enabled: true, minimum: 5 } : undefined
                }
            ],
            success_url: `${req.headers.origin}/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/index.html#pricing`,
            metadata: {
                plan_type: plan
            }
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- INTEGRATION ENDPOINTS ---
// Integrate ARIS and KELEDON services
router.use('/integration', integrationRouter);

// --- ADMIN ENDPOINTS (Legacy Inline) ---

// Store access logs in memory (in production, use database)
// We declare it global to module scope
const accessLogs: any[] = [];
const startTime = Date.now();

// Log access middleware - log all requests
// This was called inside verifyAdmin in legacy code.
// We can integrate it into verifyAdmin or keep it separate.
// Existing code called `logAccess(req, user.email)` inside verifyAdmin.
// Since verifyAdmin is now imported, we should probably add this logging there OR here.
// But `verifyAdmin` is shared.
// Let's implement specific admin logging here if needed, or update verifyAdmin to support it?
// For now, let's just not log to memory in the shared middleware to avoid side effects.
// Or we can add a simple middleware here:
const adminLogger = (req: Request, res: Response, next: NextFunction) => {
    if (req.adminUser) {
        accessLogs.push({
            timestamp: new Date().toISOString(),
            user_email: req.adminUser.email,
            action: `${req.method} ${req.path}`,
            ip: req.ip || req.connection.remoteAddress
        });
        // Keep only last 100 logs
        while (accessLogs.length > 100) {
            accessLogs.shift();
        }
    }
    next();
};

// We need to apply verifyAdmin then adminLogger
// Get server status
router.get('/admin/status', verifyAdmin, adminLogger, async (req: Request, res: Response) => {
    const uptimeMs = Date.now() - startTime;
    const uptimeHours = Math.floor(uptimeMs / 3600000);
    const uptimeMinutes = Math.floor((uptimeMs % 3600000) / 60000);

    res.json({
        status: 'online',
        uptime: `${uptimeHours}h ${uptimeMinutes}m`,
        memory: process.memoryUsage(),
        nodeVersion: process.version
    });
});

// Get access logs
router.get('/admin/logs', verifyAdmin, async (req: Request, res: Response) => {
    res.json(accessLogs.slice().reverse());
});

// Admin: Get All Mentors
router.get('/admin/mentors', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('mentors')
            .select('*')
            .order('sort_order', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add mentor
router.post('/admin/mentors', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { name, role, description, image_url, is_visible } = req.body;

        const { data, error } = await supabase
            .from('mentors')
            .insert([{ name, role, description, image_url, is_visible }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update mentor
router.put('/admin/mentors/:id', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, role, description, image_url, is_visible } = req.body;

        const { data, error } = await supabase
            .from('mentors')
            .update({ name, role, description, image_url, is_visible })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete mentor
router.delete('/admin/mentors/:id', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('mentors')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- QUESTIONS MANAGEMENT ---

// Get Questions by Axis (Admin)
router.get('/admin/questions/:axis', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { axis } = req.params;
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('axis_id', axis)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add Question
router.post('/admin/questions', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { axis_id, q, options, sort_order } = req.body;
        const { data, error } = await supabase
            .from('questions')
            .insert([{ axis_id, q, options, sort_order }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update Question
router.put('/admin/questions/:id', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { q, options, sort_order } = req.body;
        const { data, error } = await supabase
            .from('questions')
            .update({ q, options, sort_order })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Question
router.delete('/admin/questions/:id', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Clear Cache signal
router.post('/admin/cache/clear', verifyAdmin, async (req: Request, res: Response) => {
    // Clear in-memory logs
    accessLogs.length = 0;

    // Future: Clear node-cache or Redis if implemented

    console.log('🧹 Admin triggered cache clear');
    res.json({ message: 'Cache successfully cleared', clearedItems: ['accessLogs'] });
});

// Reload signal (process will exit, supervisor/pm2 should restart)
router.post('/admin/reload', verifyAdmin, async (req: Request, res: Response) => {
    res.json({ message: 'Reload signal received' });
    console.log('🔄 Admin triggered server reload');
    // In production with PM2: process.send('restart')
    // For dev, just log - actual restart would need external process manager
    process.exit(0); // Actually exit to force a restart if using nodemon/docker
});

import Stripe from 'stripe'; // Import for type usage in create-checkout-session scope if needed, or rely on ambient types?
// I used `import stripe from '../stripe'` which is the instance.
// `import Stripe` is the class/namespace.
// TS might error on `Stripe.Checkout.SessionCreateParams.Mode` if I don't import the type/class.
// Added import at bottom (valid in ES modules, hoisted usually, but cleaner at top).
// I'll leave it or move it up.
// Actually `Stripe` type is needed for `mode` variable type annotation.

export default router;

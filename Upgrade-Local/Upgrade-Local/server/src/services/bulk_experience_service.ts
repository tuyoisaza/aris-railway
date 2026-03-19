
import { supabase } from '../db';
import { generateLessonContent } from './experience_generator';

interface GenerationStatus {
    isRunning: boolean;
    totalCourses: number;
    processedCourses: number;
    currentCourse: string | null;
    currentCourseId: number | null;
    logs: string[];
}

class BulkExperienceService {
    private status: GenerationStatus = {
        isRunning: false,
        totalCourses: 0,
        processedCourses: 0,
        currentCourse: null,
        currentCourseId: null,
        logs: []
    };

    private addLog(message: string) {
        const timestamp = new Date().toLocaleTimeString();
        this.status.logs.unshift(`[${timestamp}] ${message}`);
        if (this.status.logs.length > 50) this.status.logs.pop();
    }

    getStatus() {
        return this.status;
    }

    stopGeneration() {
        if (!this.status.isRunning) return;
        this.status.isRunning = false;
        this.addLog("Stopping generation sequence...");
    }

    async startGeneration(lang?: 'es' | 'en' | 'pt') {
        if (this.status.isRunning) return;

        this.status.isRunning = true;
        this.status.logs = [];
        this.status.processedCourses = 0;
        this.addLog("Starting bulk generation process...");

        try {
            // 1. Fetch Candidates
            const { data: courses, error } = await supabase
                .from('courses')
                .select('*, categories(axis_id)')
                .eq('origin_topic', 'Seed Data'); // Logic: origin_topic='Seed Data'

            if (error) throw error;

            this.status.totalCourses = courses.length;
            this.addLog(`Found ${courses.length} seeded courses.`);

            // 2. Process async (don't await loop completion here if we want to return immediately, 
            // but for a singleton service triggered by API, we just let it run)
            this.processLoop(courses, lang);

        } catch (error: any) {
            this.addLog(`Error initializing: ${error.message}`);
            this.status.isRunning = false;
        }
    }

    // Generate content for a single course (used by AdminContent course-level actions)
    async startCourseGeneration(courseId: string, lang?: 'es' | 'en' | 'pt') {
        if (this.status.isRunning) return;

        this.status.isRunning = true;
        this.status.logs = [];
        this.status.processedCourses = 0;
        this.addLog(`Starting single-course generation: ${courseId} (${lang || 'en'})`);

        try {
            const { data: course, error } = await supabase
                .from('courses')
                .select('*, categories(axis_id)')
                .eq('id', courseId)
                .single();

            if (error || !course) throw new Error('Course not found');

            this.status.totalCourses = 1;
            this.processLoop([course], lang);
        } catch (e: any) {
            this.addLog(`Error initializing single-course run: ${e.message}`);
            this.status.isRunning = false;
        }
    }

    private async processLoop(courses: any[], lang?: 'es' | 'en' | 'pt') {
        for (const course of courses) {
            if (!this.status.isRunning) break; // Allow stop?

            this.status.currentCourse = course.title;
            this.status.currentCourseId = course.id;
            this.addLog(`Checking course: ${course.title}`);

            try {
                let updated = false;
                const newSyllabus = [...(course.syllabus || [])];

                for (let i = 0; i < newSyllabus.length; i++) {
                    const step = newSyllabus[i];
                    try {
                        // Skip if we already have localized markdown for this (course, step, lang)
                        const langToWrite = (lang || 'en') as 'en' | 'es' | 'pt';

                        const { data: existing } = await supabase
                            .from('course_step_translations')
                            .select('course_id')
                            .eq('course_id', course.id)
                            .eq('step_index', i)
                            .eq('lang', langToWrite)
                            .not('markdown_content', 'is', null)
                            .maybeSingle();

                        if (existing) {
                            this.addLog(`   > Step ${i + 1} already present for ${langToWrite.toUpperCase()}, skipping.`);
                            continue;
                        }

                        this.addLog(`   > Generating step ${i + 1} (${langToWrite.toUpperCase()}): ${step.title}`);

                        const content = await generateLessonContent(course, i, lang);

                        // Ensure localization tables receive the canonical data per-language.

                        // Upsert course-level title/description for the language.
                        await supabase
                            .from('course_translations')
                            .upsert(
                                {
                                    course_id: course.id,
                                    lang: langToWrite,
                                    title: course.title,
                                    description: course.description
                                },
                                { onConflict: 'course_id,lang' }
                            );

                        // Upsert step-level translation.
                        await supabase
                            .from('course_step_translations')
                            .upsert(
                                {
                                    course_id: course.id,
                                    step_index: i,
                                    lang: langToWrite,
                                    title: step.title,
                                    description: step.desc,
                                    markdown_content: content?.markdown_content,
                                    resources: content?.resources,
                                    estimated_read_time: content?.estimated_read_time,
                                    generator_metadata: {
                                        source: 'bulk_experience_service',
                                        generated_at: new Date().toISOString()
                                    }
                                },
                                { onConflict: 'course_id,step_index,lang' }
                            );

                        updated = true;
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (e: any) {
                        this.addLog(`   > Failed step ${i + 1}: ${e.message}`);
                    }
                }

                // We don't need to persist the full syllabus back to courses for per-language content.
                // Leave existing behavior alone, but avoid needless writes.
                if (updated) this.addLog(`   > Localization upserted.`);
                else this.addLog(`   > No updates needed.`);

            } catch (err: any) {
                this.addLog(`Error processing course: ${err.message}`);
            }

            this.status.processedCourses++;
        }

        this.status.isRunning = false;
        this.status.currentCourse = null;
        this.status.currentCourseId = null;
        this.addLog("Bulk generation completed.");
    }
}

export const bulkExperienceService = new BulkExperienceService();

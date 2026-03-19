
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader, ArrowLeft, CheckCircle, PlayCircle, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

import LockedContent from '@/components/LockedContent';
import { useAuth } from '@/contexts/AuthContext';

export default function Course() {
    const { id } = useParams();
    const { t, language } = useLanguage();
    const { profile } = useAuth(); // Get profile
    const navigate = useNavigate();
    const [course, setCourse] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCourse() {
            try {
                if (!id) return;

                // Use server endpoint so title/description/syllabus are language-aware.
                const localized = await api.getCourseContent(id, language);

                // Preserve gating fields from the canonical course row.
                // (Behavior stays the same; only text fields become localized.)
                const { data, error } = await supabase
                    .from('courses')
                    .select('is_premium, status')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setCourse({ ...localized, ...data });
            } catch (err) {
                console.error("Error fetching course:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCourse();
    }, [id, language]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
                <Loader className="animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
                <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
                <Button onClick={() => navigate('/pensum')}>Return to Pensum</Button>
            </div>
        );
    }

    // Gating Logic
    const isLocked = course.is_premium && profile?.subscription_status !== 'active';

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] pb-20">
            {/* Header */}
            <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] py-8 px-6">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/pensum')}
                        className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] mb-6 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Pensum
                    </button>

                    <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
                        {course.title}
                        {course.is_premium && <span className="ml-4 text-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded align-middle">PREMIUM</span>}
                    </h1>
                    <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
                        {course.description}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                {isLocked ? (
                    <LockedContent
                        title={`Unlock ${course.title}`}
                        description="This course is part of the Premium Pensum. Upgrade your plan to access the full syllabus and interactive exercises."
                    />
                ) : (
                    /* Unlocked Content */
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Main Content (Syllabus) */}
                        <div className="md:col-span-2 space-y-6">
                            <h2 className="text-xl font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                                Course Syllabus
                            </h2>

                            <div className="space-y-4">
                                {course.syllabus && course.syllabus.map((step: any, index: number) => (
                                    <Card
                                        key={index}
                                        className="bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/course/${id}/learn/${index}`)}
                                    >
                                        <CardContent className="p-5 flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] flex items-center justify-center font-bold text-sm group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                                                    {index + 1}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                                                        {step.title}
                                                    </h3>
                                                    <span className="text-xs bg-[var(--color-bg)] px-2 py-1 rounded text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                                                        {step.duration}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                                    {step.desc}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {(!course.syllabus || course.syllabus.length === 0) && (
                                    <div className="text-center py-12 border-2 border-dashed border-[var(--color-border)] rounded-lg text-[var(--color-text-tertiary)]">
                                        No syllabus content available yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] sticky top-6">
                                <CardContent className="p-6">
                                    <div className="mb-6">
                                        <div className="text-xs uppercase text-[var(--color-text-tertiary)] font-bold mb-1">Course Status</div>
                                        <div className="flex items-center gap-2 text-green-500 font-bold">
                                            <CheckCircle size={20} />
                                            <span>Active Enrollment</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full mb-3 gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]"
                                        onClick={() => navigate(`/course/${id}/learn/0`)}
                                    >
                                        <PlayCircle size={18} />
                                        Resume Learning
                                    </Button>
                                    <p className="text-xs text-center text-[var(--color-text-tertiary)]">
                                        Last accessed: Just now
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

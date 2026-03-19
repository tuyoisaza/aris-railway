import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '@/components/AdminNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, Play, CheckCircle, Terminal, Circle, AlertCircle, Square } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface Status {
    isRunning: boolean;
    totalCourses: number;
    processedCourses: number;
    currentCourse: string | null;
    currentCourseId: number | null;
    logs: string[];
}

type Lang = 'en' | 'es' | 'pt';

type CourseLangStatus = {
    expected_steps: number;
    langs: Record<Lang, { steps_done: number; is_complete: boolean }>;
};

interface CourseNode {
    id: string;
    title: string;
    syllabus: any[];
}

interface CategoryNode {
    id: number;
    title: string;
    courses: CourseNode[];
}

interface AxisNode {
    id: string;
    title_key: string;
    categories: CategoryNode[];
}

export default function AdminContent() {
    const { session } = useAuth();
    const [targetLang, setTargetLang] = useState<Lang>('es');
    const [status, setStatus] = useState<Status | null>(null);
    const [pensum, setPensum] = useState<Record<string, AxisNode> | null>(null);
    const [loadingPensum, setLoadingPensum] = useState(true);
    const [courseStatus, setCourseStatus] = useState<Record<string, CourseLangStatus>>({});
    const [runningCourse, setRunningCourse] = useState<string | null>(null);
    const [runningLang, setRunningLang] = useState<Lang | null>(null);

    // Initial Data Load
    useEffect(() => {
        async function loadPensum() {
            try {
                const res = await fetch('/api/pensum');
                const data = await res.json();
                setPensum(data);
            } catch (e) {
                console.error("Failed to load pensum structure", e);
            } finally {
                setLoadingPensum(false);
            }
        }
        loadPensum();
    }, []);

    // Polling Status
    useEffect(() => {
        if (!session?.access_token) return;
        let interval: NodeJS.Timeout;

        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/admin/content/status', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data);
                }
            } catch (error) {
                console.error("Failed to poll status", error);
            }
        };

        fetchStatus();
        interval = setInterval(fetchStatus, 2000);
        return () => clearInterval(interval);
    }, [session]);

    // Poll course-language completeness
    useEffect(() => {
        if (!session?.access_token) return;
        if (!pensum) return;

        const ids = Object.values(pensum)
            .flatMap(axis => axis.categories)
            .flatMap(cat => cat.courses)
            .map(c => String(c.id));

        const unique = Array.from(new Set(ids));
        if (unique.length === 0) return;

        let interval: NodeJS.Timeout;

        const fetchCourseStatus = async () => {
            try {
                const res = await fetch(`/api/admin/content/course-status?ids=${encodeURIComponent(unique.join(','))}` , {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCourseStatus(data || {});
                }
            } catch (e) {
                console.error('Failed to fetch course status', e);
            }
        };

        fetchCourseStatus();
        interval = setInterval(fetchCourseStatus, 4000);
        return () => clearInterval(interval);
    }, [session, pensum]);


    const handleStart = async () => {
        if (!session?.access_token) return;
        try {
            const res = await fetch(`/api/admin/content/generate?lang=${targetLang}` , {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Failed to start');
            } else {
                setStatus(prev => prev ? { ...prev, isRunning: true } : null);
            }
        } catch (e) {
            console.error(e);
            alert("Error starting generation");
        }
    };

    const handleGenerateCourseLang = async (courseId: string, lang: Lang) => {
        if (!session?.access_token) return;
        if (status?.isRunning) return;

        setRunningCourse(courseId);
        setRunningLang(lang);
        try {
            const res = await fetch('/api/admin/content/generate-course', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ courseId, lang })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert(err.error || 'Failed to start course generation');
            }
        } catch (e) {
            console.error(e);
            alert('Error starting course generation');
        } finally {
            // actual running state comes from polling; this local state is just for UI immediacy
            setTimeout(() => {
                setRunningCourse(null);
                setRunningLang(null);
            }, 1500);
        }
    };

    const handleStop = async () => {
        if (!session?.access_token) return;
        try {
            await fetch('/api/admin/content/stop', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            // State update will happen via polling
        } catch (e) {
            console.error(e);
            alert("Error stopping generation");
        }
    };

    // Helper to determine icon for a course
    const renderLangBadge = (courseId: string, lang: Lang) => {
        const c = courseStatus?.[courseId];
        const expected = c?.expected_steps || 0;
        const done = c?.langs?.[lang]?.steps_done || 0;
        const complete = c?.langs?.[lang]?.is_complete || false;
        const hasAny = done > 0;

        const isRunningThis = status?.isRunning && String(status?.currentCourseId) === courseId;
        const isLocallyStarting = runningCourse === courseId && runningLang === lang;

        const label = `${lang.toUpperCase()} ${expected ? `${done}/${expected}` : ''}`.trim();

        const base = 'text-[10px] font-bold uppercase px-2 py-1 rounded border transition-colors';
        if (complete) {
            return (
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleGenerateCourseLang(courseId, lang); }}
                    className={`${base} bg-green-500/10 text-green-500 border-green-500/20 hover:border-green-500/40`}
                    title="Regenerate this language for this course"
                >
                    <CheckCircle className="w-3 h-3 inline-block mr-1" />
                    {label}
                </button>
            );
        }

        if (hasAny) {
            return (
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleGenerateCourseLang(courseId, lang); }}
                    className={`${base} bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:border-yellow-500/40`}
                    title="Partially generated; click to continue"
                    disabled={status?.isRunning}
                >
                    <AlertCircle className="w-3 h-3 inline-block mr-1" />
                    {label}
                </button>
            );
        }

        return (
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleGenerateCourseLang(courseId, lang); }}
                className={`${base} ${isRunningThis || isLocallyStarting ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:border-[var(--color-primary)]'}`}
                title="Generate this language for this course"
                disabled={status?.isRunning}
            >
                {isRunningThis || isLocallyStarting ? <Loader className="w-3 h-3 inline-block mr-1 animate-spin" /> : <Circle className="w-3 h-3 inline-block mr-1" />}
                {label}
            </button>
        );
    };

    if (loadingPensum) return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center">
            <Loader className="animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] pb-20">
            <AdminNav />

            <div className="max-w-[1600px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Controls & Logs */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-[var(--color-surface)] border-[var(--color-border)] sticky top-6">
                        <CardHeader className="border-b border-[var(--color-border)] pb-4">
                            <CardTitle>Generator Control</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Target Language */}
                            <div className="bg-[var(--color-bg)] rounded-lg p-4 border border-[var(--color-border)]">
                                <div className="text-xs text-[var(--color-text-tertiary)] uppercase font-bold mb-2">Target Language</div>
                                <div className="flex gap-2">
                                    {(['es', 'en', 'pt'] as const).map((lang) => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => setTargetLang(lang)}
                                            className={`px-3 py-2 rounded-md text-xs font-bold uppercase border transition-colors ${
                                                targetLang === lang
                                                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                                            }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                                    Generates/updates course translations for the selected language.
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex justify-center">
                                {status?.isRunning ? (
                                    <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-6 py-3 rounded-full border border-yellow-500/20 animate-pulse">
                                        <Loader className="w-5 h-5 animate-spin" />
                                        <span className="font-bold tracking-wider">GENERATING...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-6 py-3 rounded-full border border-green-500/20">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-bold tracking-wider">IDLE</span>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-3 bg-[var(--color-bg)] rounded-lg">
                                    <div className="text-xs text-[var(--color-text-tertiary)] uppercase font-bold">Total</div>
                                    <div className="text-2xl font-bold">{status?.totalCourses || 0}</div>
                                </div>
                                <div className="p-3 bg-[var(--color-bg)] rounded-lg">
                                    <div className="text-xs text-[var(--color-text-tertiary)] uppercase font-bold">Done</div>
                                    <div className="text-2xl font-bold">{status?.processedCourses || 0}</div>
                                </div>
                            </div>

                            {/* Button */}


                            {/* Button */}
                            {status?.isRunning ? (
                                <Button
                                    className="w-full h-14 text-lg gap-3 bg-red-600 hover:bg-red-700 animate-pulse"
                                    onClick={handleStop}
                                >
                                    <Square size={20} fill="currentColor" />
                                    Stop Sequence
                                </Button>
                            ) : (
                                <Button
                                    className="w-full h-14 text-lg gap-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]"
                                    onClick={handleStart}
                                >
                                    <Play size={20} />
                                    Start Sequence
                                </Button>
                            )}

                            {/* Logs */}
                            <div className="bg-black rounded-lg border border-slate-800 p-4 font-mono text-xs h-[400px] overflow-y-auto">
                                <div className="flex items-center gap-2 text-slate-500 mb-2 pb-2 border-b border-slate-800">
                                    <Terminal size={12} />
                                    <span>System Output</span>
                                </div>
                                {status?.logs?.map((log, i) => (
                                    <div key={i} className="text-green-400 mb-1 leading-relaxed border-l-2 border-transparent pl-2 hover:bg-slate-900/50">
                                        {log}
                                    </div>
                                ))}
                                {!status?.logs?.length && <div className="text-slate-600 italic">Ready for input...</div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Curriculum Tree */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-2 h-8 bg-[var(--color-primary)] rounded-full"></span>
                            Curriculum Status Map
                        </h2>

                        {!pensum ? (
                            <div className="p-8 text-center text-[var(--color-text-secondary)]">No curriculum data found.</div>
                        ) : (
                            <div className="space-y-8">
                                {Object.values(pensum).map((axis) => (
                                    <div key={axis.id} className="border-l-2 border-[var(--color-border)] pl-6 relative">
                                        {/* Axis Label */}
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--color-border)]" />
                                        <h3 className="text-lg font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
                                            {axis.id} Axis
                                        </h3>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            {axis.categories.map((cat) => (
                                                <div key={cat.id} className="bg-[var(--color-bg)] rounded-sm p-4 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
                                                    <h4 className="font-bold text-sm mb-3 flex items-center justify-between">
                                                        {cat.title}
                                                        <span className="text-[10px] bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded text-[var(--color-text-tertiary)]">
                                                            {cat.courses.length}
                                                        </span>
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {cat.courses.map((course) => (
                                                            <li key={course.id} className="group">
                                                                <Link
                                                                    to={`/course/${course.id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center justify-between text-xs p-2 rounded hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
                                                                >
                                                                    <span className="truncate pr-2 text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] font-medium transition-colors">
                                                                        {course.title}
                                                                    </span>
                                                                    <div className="shrink-0 flex items-center gap-2">
                                                                        {renderLangBadge(String(course.id), 'en')}
                                                                        {renderLangBadge(String(course.id), 'es')}
                                                                        {renderLangBadge(String(course.id), 'pt')}
                                                                    </div>
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

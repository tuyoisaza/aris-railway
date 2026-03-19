
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader, ArrowLeft, Play, ExternalLink, BookOpen, Video, Mic } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CoursePlayer() {
    const { id, stepIndex } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [course, setCourse] = useState<any | null>(null);
    const [stepData, setStepData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const index = parseInt(stepIndex || '0');
    const hasAttemptedGen = useRef(false);

    // Reset attempt flag when changing steps
    useEffect(() => {
        hasAttemptedGen.current = false;
    }, [index, id]);

    // Auto-generate if content is missing
    useEffect(() => {
        if (!loading && course && !stepData && !generating && !hasAttemptedGen.current) {
            hasAttemptedGen.current = true;
            handleGenerate();
        }
    }, [loading, course, stepData, generating]);

    useEffect(() => {
        async function fetchCourse() {
            try {
                if (!id) return;

                // Use server endpoint so title/syllabus labels are language-aware.
                const localized = await api.getCourseContent(id, language);
                setCourse(localized);

                // Check if content exists
                const step = localized.syllabus[index];
                if (step && step.content) setStepData(step.content);
                else setStepData(null);
            } catch (err) {
                console.error("Error fetching course:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCourse();
    }, [id, index, language]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            if (!token) return;

            const res = await fetch(`/api/user/course/${id}/step/${index}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Generation failed');

            const result = await res.json();
            if (result.success && result.content) {
                setStepData(result.content);
                // Also update local course state to prevent re-generation on quick nav
                if (course) {
                    const newSyllabus = [...course.syllabus];
                    newSyllabus[index] = { ...newSyllabus[index], content: result.content };
                    setCourse({ ...course, syllabus: newSyllabus });
                }
            }

        } catch (e) {
            console.error(e);
            alert("Failed to create experience. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
                <Loader className="animate-spin" />
            </div>
        );
    }

    if (!course || !course.syllabus[index]) {
        return <div>Step not found</div>;
    }

    const currentStep = course.syllabus[index];

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] pb-20">
            {/* Nav */}
            <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/course/${id}`)} className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xs uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider">
                            {course.title}
                        </h2>
                        <h1 className="text-lg font-bold truncate max-w-md">
                            {index + 1}. {currentStep.title}
                        </h1>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-10">

                {/* CONTENT AREA */}
                {!stepData ? (
                    <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                        <div className="mb-6 inline-flex p-6 rounded-full bg-[var(--color-bg-secondary)] mb-6">
                            {generating ? (
                                <Loader size={48} className="text-[var(--color-primary)] animate-spin" />
                            ) : (
                                <BookOpen size={48} className="text-[var(--color-primary)] opacity-50" />
                            )}
                        </div>

                        {generating ? (
                            <>
                                <h2 className="text-2xl font-bold mb-4">Synthesizing Experience...</h2>
                                <p className="text-[var(--color-text-secondary)] mb-8 max-w-lg mx-auto">
                                    The Architect is constructing your lesson content. This usually takes about 10-20 seconds.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold mb-4">Content Not Found</h2>
                                <p className="text-[var(--color-text-secondary)] mb-8 max-w-lg mx-auto">
                                    We couldn't load the content for this step.
                                </p>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="text-lg px-8 py-6 h-auto bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white gap-3 shadow-xl"
                                >
                                    <Play size={24} />
                                    Retry Generation
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-10 animate-in fade-in duration-500">
                        {/* LEFT: READING & MARKDOWN */}
                        <div className="md:col-span-2 space-y-12">
                            <article className="prose prose-invert prose-lg max-w-none">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }) => (
                                            <h1 className="text-4xl font-extrabold text-[var(--color-primary)] mb-6 mt-10 leading-tight tracking-tight border-b-2 border-[var(--color-primary)] pb-4 inline-block" {...props} />
                                        ),
                                        h2: ({ node, ...props }) => (
                                            <h2 className="text-2xl font-bold text-[var(--color-text)] mt-12 mb-4 tracking-wide border-l-4 border-[var(--color-primary)] pl-4" {...props} />
                                        ),
                                        h3: ({ node, ...props }) => (
                                            <h3 className="text-xl font-semibold text-[var(--color-text-secondary)] mt-8 mb-3" {...props} />
                                        ),
                                        p: ({ node, ...props }) => (
                                            <p className="mb-6 leading-relaxed text-[var(--color-text-zinc-300)] text-lg" {...props} />
                                        ),
                                        ul: ({ node, ...props }) => (
                                            <ul className="list-disc pl-6 mb-6 space-y-2 marker:text-[var(--color-primary)]" {...props} />
                                        ),
                                        ol: ({ node, ...props }) => (
                                            <ol className="list-decimal pl-6 mb-6 space-y-2 marker:text-[var(--color-primary)] font-bold text-[var(--color-text)]" {...props} />
                                        ),
                                        li: ({ node, children, ...props }) => (
                                            <li className="pl-2" {...props}>
                                                <span className="font-normal text-[var(--color-text-secondary)]">{children}</span>
                                            </li>
                                        ),
                                        strong: ({ node, ...props }) => (
                                            <strong className="font-bold text-[var(--color-text)] bg-[var(--color-bg-secondary)] px-1 rounded-sm" {...props} />
                                        ),
                                        blockquote: ({ node, ...props }) => (
                                            <blockquote className="border-l-4 border-[var(--color-primary)] bg-[var(--color-bg-secondary)] p-6 my-8 rounded-r-lg italic text-[var(--color-text-secondary)]" {...props} />
                                        ),
                                        hr: ({ node, ...props }) => (
                                            <hr className="my-10 border-[var(--color-border)]" {...props} />
                                        )
                                    }}
                                >
                                    {stepData.markdown_content}
                                </ReactMarkdown>
                            </article>

                            {/* PROJECT SUGGESTION */}
                            {(() => {
                                const microPracticeMatch = stepData.markdown_content.match(/##\s*\d*\.?\s*Micro-Práctica[^\n]*\n([\s\S]*?)(?=\n---|(?=\n##)|$)/i);
                                if (microPracticeMatch) {
                                    const practiceContent = microPracticeMatch[1].trim();
                                    // Extract a short summary or just use the whole content if short
                                    const cleanContent = practiceContent.replace(/\*\*/g, '').replace(/###/g, '').substring(0, 300) + (practiceContent.length > 300 ? '...' : '');

                                    return (
                                        <div className="mt-12 p-8 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-primary)]/30 shadow-lg relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <BookOpen size={120} />
                                            </div>

                                            <div className="relative z-10">
                                                <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2 flex items-center gap-2">
                                                    <span className="p-1 bg-[var(--color-primary)] text-white rounded">🚀</span>
                                                    Ready to Install This Upgrade?
                                                </h3>
                                                <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
                                                    Transform this <strong>Micro-Práctica</strong> into a tracked project in your journal. Commit to the change.
                                                </p>

                                                <div className="bg-[var(--color-bg)]/50 p-4 rounded-md mb-6 italic text-sm border-l-2 border-[var(--color-primary)]">
                                                    "{cleanContent.split('\n')[0]}..."
                                                </div>

                                                <Button
                                                    onClick={() => navigate(`/journal?new=true&title=${encodeURIComponent(`Project: ${currentStep.title}`)}&context=${encodeURIComponent(cleanContent)}`)}
                                                    className="w-full md:w-auto bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] font-bold py-6 text-white text-lg rounded-xl shadow-lg transition-all hover:scale-105"
                                                >
                                                    Start Project: "{currentStep.title}"
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        {/* RIGHT: RESOURCES */}
                        <div className="space-y-6">
                            <h3 className="font-bold uppercase tracking-wider text-sm border-b border-[var(--color-border)] pb-2">
                                Curated Resources
                            </h3>

                            {stepData.resources && stepData.resources.map((res: any, i: number) => (
                                <a
                                    key={i}
                                    href={res.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all hover:-translate-y-1 group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="p-2 rounded bg-[var(--color-bg-secondary)] text-[var(--color-primary)]">
                                            {res.type === 'video' ? <Video size={16} /> :
                                                res.type === 'podcast' ? <Mic size={16} /> :
                                                    <BookOpen size={16} />}
                                        </div>
                                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-50" />
                                    </div>
                                    <h4 className="font-bold text-sm mb-1 leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                                        {res.title}
                                    </h4>
                                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                                        {res.description}
                                    </p>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

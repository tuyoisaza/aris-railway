import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { ChevronRight, Loader, ChevronDown, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface PensumAxis {
    id: string;
    title_key: string;
    desc_key: string;
    categories: PensumCategory[];
}

interface PensumCategory {
    id: string;
    title: string; // API returns title
    courses: any[]; // API returns array of courses
}

export default function Pensum() {
    const { t } = useLanguage();
    const { user } = useAuth(); // Get auth state
    const navigate = useNavigate(); // Add navigation
    const [pensumData, setPensumData] = useState<PensumAxis[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const handleCourseClick = (course: any) => {
        setSelectedCourse(course);
    };

    const closeModal = () => {
        setSelectedCourse(null);
    };

    const handleStartUpgrade = (course: any) => {
        if (user) {
            // Already logged in -> Go to course context
            navigate(`/course/${course.id}`);
        } else {
            // Not logged in -> Go to login
            // Ideally we pass the 'redirect' param to return here eventually, 
            // but for now user just wants Login if not logged in.
            navigate('/login');
        }
    };


    useEffect(() => {
        fetch('/api/pensum')
            .then(res => res.json())
            .then(data => {
                // API returns object { human: {...}, leadership: {...} }
                // Convert to array and sort specific order
                const orderedIds = ['human', 'leadership', 'cocreation'];
                const list = orderedIds.map(id => data[id]).filter(Boolean);
                setPensumData(list);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch pensum", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text)]">
                <Loader className="animate-spin w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[var(--font-main)] pb-20">
            {/* HERO SECTION */}
            <header className="py-20 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                <div className="max-w-[1200px] mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-[var(--color-primary)]">
                        {t('pensum_title')}
                    </h1>
                    <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
                        {t('pensum_subtitle')}
                    </p>
                </div>
            </header>

            {/* CONTENT GRID */}
            <div className="max-w-[1200px] mx-auto px-6 py-16">
                <div className="grid md:grid-cols-3 gap-8">
                    {pensumData.map((axis, index) => (
                        <motion.div
                            key={axis.id}
                            className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden border border-[var(--color-border)] hover:shadow-[var(--shadow-lg)] transition-all hover:-translate-y-1"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {/* Card Header */}
                            <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)] h-40 flex flex-col justify-end relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-9xl font-black">{index + 1}</span>
                                </div>
                                <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2 relative z-10">
                                    {t(axis.title_key)}
                                </h2>
                                <p className="text-sm text-[var(--color-text-secondary)] relative z-10">
                                    {t(axis.desc_key)}
                                </p>
                            </div>

                            {/* Card Content - Categories */}
                            <div className="p-4">
                                <ul className="space-y-3">
                                    {axis.categories.map((cat, i) => (
                                        <div key={cat.id} className="flex flex-col rounded-[var(--radius-sm)] overflow-hidden transition-colors">
                                            <div
                                                className="flex justify-between items-center p-3 hover:bg-[var(--color-bg-secondary)] cursor-pointer group/item"
                                                onClick={() => toggleCategory(cat.id)}
                                            >
                                                <span className="font-medium text-sm text-[var(--color-text)] group-hover/item:text-[var(--color-primary)] transition-colors">
                                                    {cat.title}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] px-2 py-1 rounded-full">
                                                        {cat.courses.length}
                                                    </span>
                                                    {expandedCategories[cat.id] ? (
                                                        <ChevronDown className="w-4 h-4 text-[var(--color-primary)]" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-[var(--color-border)] group-hover/item:text-[var(--color-primary)]" />
                                                    )}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {expandedCategories[cat.id] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="bg-[var(--color-bg-tertiary)]"
                                                    >
                                                        <ul className="pl-4 pr-3 py-2 space-y-1">
                                                            {cat.courses.length > 0 ? (
                                                                cat.courses.map((course: any) => (
                                                                    <li
                                                                        key={course.id}
                                                                        className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] py-1 pl-2 border-l border-[var(--color-border)] cursor-pointer transition-colors block"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCourseClick(course);
                                                                        }}
                                                                    >
                                                                        {course.title}
                                                                    </li>
                                                                ))
                                                            ) : (
                                                                <li className="text-xs text-[var(--color-text-tertiary)] italic pl-2 py-1">
                                                                    {t('no_courses_available') || "No courses available"}
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
            {/* COURSE MODAL */}
            <AnimatePresence>
                {selectedCourse && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden z-10"
                        >
                            {/* Close Button */}
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8">
                                <span className="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-wider text-[var(--color-primary)] uppercase bg-[var(--color-primary)]/10 rounded-full">
                                    Course
                                </span>

                                <h3 className="text-2xl font-bold text-[var(--color-text)] mb-2">
                                    {selectedCourse.title}
                                </h3>

                                {selectedCourse.duration && (
                                    <p className="text-sm text-[var(--color-text-tertiary)] mb-6 flex items-center gap-2">
                                        <span>⏱ {selectedCourse.duration}</span>
                                    </p>
                                )}

                                <div className="prose prose-invert max-w-none mb-8 text-[var(--color-text-secondary)] text-sm leading-relaxed">
                                    <p>{selectedCourse.desc || "No description available for this course."}</p>
                                </div>

                                <button
                                    className="w-full py-3 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold rounded-[var(--radius-md)] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-[var(--color-primary)]/25 flex items-center justify-center gap-2"
                                    onClick={() => handleStartUpgrade(selectedCourse)}
                                >
                                    Start UPGRADE
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div >
    );
}

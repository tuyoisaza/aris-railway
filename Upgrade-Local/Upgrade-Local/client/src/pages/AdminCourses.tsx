import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Plus, Save, Loader, Edit, CheckCircle, XCircle, Play } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminNav from '@/components/AdminNav';

interface SyllabusStep {
    title: string;
    duration: string;
    desc: string;
    content?: any;
}

interface Course {
    id: string;
    title: string;
    description: string;
    category_id: string;
    categories?: { title: string };
    origin_topic?: string;
    status: 'draft' | 'published';
    syllabus: SyllabusStep[];
}

interface Category {
    id: string;
    title: string;
    axis_id: string;
}

interface Axis {
    id: string;
    title_key: string;
}

const AdminCourses = () => {
    const { user } = useAuth(); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [generating, setGenerating] = useState(false);
    const [generatingCourses, setGeneratingCourses] = useState<Set<string>>(new Set());

    // Generator State
    const [topic, setTopic] = useState('');
    const [selectedAxis, setSelectedAxis] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [axes, setAxes] = useState<Axis[]>([]);

    // Editing State
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [description, setDescription] = useState('');
    // Store syllabus as object array for easier editing
    const [syllabus, setSyllabus] = useState<SyllabusStep[]>([]);

    // Alert Dialog State
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ title: string; desc: string; action: () => void }>({ title: '', desc: '', action: () => { } });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [coursesRes, catsRes, axesRes] = await Promise.all([
                supabase.from('courses').select('*, categories(title)'),
                supabase.from('categories').select('*'),
                fetch('/api/axes').then(r => r.json())
            ]);

            if (coursesRes.data) setCourses(coursesRes.data as unknown as Course[]);
            if (catsRes.data) setCategories(catsRes.data);
            if (axesRes) setAxes(axesRes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!topic || !selectedAxis) return alert('Topic and Axis are required');

        setGenerating(true);
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;

            const res = await fetch('/api/admin/courses/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    topic,
                    axis_id: selectedAxis
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert('Course Draft Generated!');
            setTopic('');
            fetchData();
        } catch (e: any) {
            alert('Generation Failed: ' + e.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateCourseContent = async (course: Course) => {
        if (generatingCourses.has(course.id)) return;

        const newSet = new Set(generatingCourses);
        newSet.add(course.id);
        setGeneratingCourses(newSet);

        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) throw new Error("No auth token");

            const syllabus = course.syllabus || [];
            let updatedCount = 0;

            for (let i = 0; i < syllabus.length; i++) {
                const step = syllabus[i];
                // Check if content is missing (loose check for content object)
                if (!step.content || !step.content.markdown_content) {

                    // Call generation API
                    const res = await fetch(`/api/user/course/${course.id}/step/${i}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        updatedCount++;
                        // Optimistically update local state to show progress
                        setCourses(prev => prev.map(c => {
                            if (c.id === course.id) {
                                const newSyllabus = [...c.syllabus];
                                newSyllabus[i] = { ...step, content: data.content };
                                return { ...c, syllabus: newSyllabus };
                            }
                            return c;
                        }));
                    } else {
                        console.error(`Failed to generate step ${i} for course ${course.id}`);
                    }
                }
            }

            if (updatedCount > 0) {
                // Refresh full data to be safe
                // fetchData(); // Optional, but let's stick to optimistic updates for smoothness
            }

        } catch (e: any) {
            alert('Generation Sequence Failed: ' + e.message);
        } finally {
            setGeneratingCourses(prev => {
                const next = new Set(prev);
                next.delete(course.id);
                return next;
            });
        }
    };

    const handleEdit = (course: Course) => {
        setEditingCourse(course);
        setTopic(course.title);

        // Derive Axis from the course's category
        const courseCat = categories.find(c => c.id === course.category_id);
        if (courseCat) {
            setSelectedAxis(courseCat.axis_id);
            setSelectedCategory(courseCat.id);
        } else {
            setSelectedAxis('');
            setSelectedCategory('');
        }

        setDescription(course.description || '');
        // Ensure syllabus is an array, default to empty if null
        setSyllabus(course.syllabus || []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSyllabusChange = (index: number, field: keyof SyllabusStep, value: string) => {
        const newSyllabus = [...syllabus];
        newSyllabus[index] = { ...newSyllabus[index], [field]: value };
        setSyllabus(newSyllabus);
    };

    const handleSaveEdit = async () => {
        if (!editingCourse) return;
        if (!topic || !selectedAxis) return alert('Title and Axis are required');

        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;

            // Use the directly selected category
            const resolvedCategoryId = selectedCategory || null;

            const res = await fetch(`/api/admin/courses/${editingCourse.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: topic,
                    category_id: resolvedCategoryId, // Update the category based on new axis
                    description: description,
                    syllabus: syllabus // Send the array directly
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert('Course Updated Successfully!');
            handleCancelEdit();
            fetchData();
        } catch (e: any) {
            console.error(e);
            alert('Update Failed: ' + e.message);
        }
    };

    const handleCancelEdit = () => {
        setEditingCourse(null);
        setTopic('');
        setSelectedAxis('');
        setSelectedCategory('');
        setDescription('');
        setSyllabus([]);
    };

    // Refactored with AlertDialog
    const confirmPublish = (id: string) => {
        setAlertConfig({
            title: "Publish Course?",
            desc: "This will make the course visible to all users.",
            action: () => executePublish(id)
        });
        setAlertOpen(true);
    };

    const executePublish = async (id: string) => {
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;

            const res = await fetch(`/api/admin/courses/${id}/publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            fetchData();
        } catch (e: any) {
            alert('Publish Failed: ' + e.message);
        }
    };

    // Refactored with AlertDialog
    const confirmUnpublish = (id: string) => {
        setAlertConfig({
            title: "Revert to Draft?",
            desc: "This will hide the course from users. You can publish it again later.",
            action: () => executeUnpublish(id)
        });
        setAlertOpen(true);
    };

    const executeUnpublish = async (id: string) => {
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;

            const res = await fetch(`/api/admin/courses/${id}/unpublish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            fetchData();
        } catch (e: any) {
            alert('Unpublish Failed: ' + e.message);
        }
    };

    return (
        <>
            <AdminNav />
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">Course Generator</h1>
                        <p className="admin-subtitle">Admin / Generator</p>
                    </div>
                </div>

                <div className="admin-grid" style={editingCourse ? { gridTemplateColumns: '1fr' } : {}}>
                    {/* Generator/Editor Panel */}
                    <div className="form-column">
                        <div className="admin-card">
                            <h2 className="admin-card-title">
                                {editingCourse ? <Edit size={20} className="text-[var(--color-primary)]" /> : <Plus size={20} className="text-[var(--color-primary)]" />}
                                {editingCourse ? 'Edit Course' : 'Create Course'}
                            </h2>

                            <hr className="my-4 border-[var(--color-border)]" />

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="admin-label">{editingCourse ? 'Title' : 'Topic / Research Area'}</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        placeholder={editingCourse ? "Course Title" : "e.g. 'Quantum Leadership'"}
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="admin-label">Target Axis</label>
                                    <select
                                        className="admin-select"
                                        value={selectedAxis}
                                        onChange={e => setSelectedAxis(e.target.value)}
                                    >
                                        <option value="">Select Axis...</option>
                                        {axes.filter(a => ['human', 'leadership', 'cocreation'].includes(a.id)).map(a => (
                                            <option key={a.id} value={a.id}>{a.title_key.replace('axis_', '').toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="admin-label">Category</label>
                                    <select
                                        className="admin-select"
                                        value={selectedCategory}
                                        onChange={e => setSelectedCategory(e.target.value)}
                                        disabled={!selectedAxis}
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.filter(c => c.axis_id === selectedAxis).map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {editingCourse && (
                                    <>
                                        <div>
                                            <label className="admin-label">Description</label>
                                            <textarea
                                                className="admin-textarea"
                                                rows={3}
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                            />
                                        </div>

                                        <div className="bg-[var(--color-bg)] p-4 rounded border border-[var(--color-border)]">
                                            <h3 className="font-bold text-sm text-[var(--color-text-secondary)] uppercase mb-4">Course Structure (10 Steps)</h3>
                                            <div className="flex flex-col gap-6">
                                                {syllabus.map((step, idx) => (
                                                    <div key={idx} className="relative pl-6 border-l-2 border-[var(--color-border)]">
                                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--color-border)]"></div>

                                                        <div className="mb-2 flex justify-between items-start gap-2">
                                                            <input
                                                                type="text"
                                                                className="font-bold text-sm bg-transparent border-none p-0 focus:ring-0 w-full text-[var(--color-text)]"
                                                                value={step.title}
                                                                onChange={(e) => handleSyllabusChange(idx, 'title', e.target.value)}
                                                                placeholder="Step Title"
                                                            />
                                                            <input
                                                                type="text"
                                                                className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1 py-0.5 w-24 text-right text-[var(--color-text-secondary)]"
                                                                value={step.duration}
                                                                onChange={(e) => handleSyllabusChange(idx, 'duration', e.target.value)}
                                                                placeholder="Duration"
                                                            />
                                                        </div>

                                                        <textarea
                                                            className="admin-textarea text-sm"
                                                            rows={2}
                                                            value={step.desc}
                                                            onChange={(e) => handleSyllabusChange(idx, 'desc', e.target.value)}
                                                            placeholder="Content description..."
                                                        />
                                                    </div>
                                                ))}
                                                {syllabus.length === 0 && (
                                                    <p className="text-sm text-[var(--color-text-secondary)] italic">No syllabus steps found.</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-2 mt-2">
                                    {editingCourse ? (
                                        <>
                                            <button
                                                onClick={handleSaveEdit}
                                                className="admin-btn admin-btn-primary flex-1"
                                            >
                                                <Save size={18} />
                                                Save Changes
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="admin-btn admin-btn-ghost"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleGenerate}
                                            disabled={generating}
                                            className="admin-btn admin-btn-primary w-full"
                                        >
                                            {generating ? <Loader className="animate-spin" size={20} /> : <Plus size={20} />}
                                            Generate Draft
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Courses List */}
                    {!editingCourse && (
                        <div className="list-column">
                            <h2 className="admin-title text-xl mb-4 text-[var(--color-text)]">
                                Generated Courses ({courses.length})
                            </h2>

                            <div className="flex flex-col gap-4">
                                {courses.map(course => (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={course.id}
                                        className="admin-card hover:shadow-md transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`admin-badge ${course.status === 'published' ? 'published' : 'draft'}`}>
                                                        {course.status || 'published'}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-lg leading-tight text-[var(--color-text)]">{course.title}</h3>
                                                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                                                    {(course as any).categories?.title || 'Uncategorized'} | {course.origin_topic || 'Manual'}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {course.status !== 'published' && (
                                                    <button
                                                        onClick={() => confirmPublish(course.id)}
                                                        className="admin-btn admin-btn-ghost text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        title="Publish"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                {course.status === 'published' && (
                                                    <button
                                                        onClick={() => confirmUnpublish(course.id)}
                                                        className="admin-btn admin-btn-ghost text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                        title="Unpublish"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(course)}
                                                    className="admin-btn admin-btn-ghost text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                                                >
                                                    <Edit size={18} />
                                                </button>

                                            </div>
                                        </div>

                                        {/* Generation Progress */}
                                        {(() => {
                                            const total = course.syllabus?.length || 0;
                                            const generated = course.syllabus?.filter(s => s.content && s.content.markdown_content).length || 0;
                                            const isGenerating = generatingCourses.has(course.id);
                                            const progress = total > 0 ? (generated / total) * 100 : 0;

                                            return (
                                                <div className="mb-4 bg-[var(--color-bg)] p-3 rounded border border-[var(--color-border)]">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold uppercase text-[var(--color-text-tertiary)] tracking-wider">
                                                            Content Generation
                                                        </span>
                                                        <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                                                            {generated} / {total} Steps
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-[var(--color-primary)] transition-all duration-500"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>

                                                        {generated < total && (
                                                            <button
                                                                onClick={() => handleGenerateCourseContent(course)}
                                                                disabled={isGenerating}
                                                                className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${isGenerating
                                                                    ? 'bg-orange-100 text-orange-600 cursor-wait'
                                                                    : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
                                                                    }`}
                                                            >
                                                                {isGenerating ? <Loader size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                                                                {isGenerating ? 'Generating...' : 'Generate'}
                                                            </button>
                                                        )}
                                                        {generated === total && total > 0 && (
                                                            <span className="text-green-500">
                                                                <CheckCircle size={16} />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2 leading-relaxed">
                                            {course.description}
                                        </p>

                                        {/* Syllabus Preview */}
                                        {course.syllabus && course.syllabus.length > 0 && (
                                            <div className="border-t border-[var(--color-border)] pt-3 mt-3">
                                                <h4 className="text-xs uppercase text-[var(--color-text-tertiary)] font-bold mb-2 tracking-wider">Syllabus Preview</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {course.syllabus.slice(0, 4).map((step: any, i: number) => (
                                                        <div key={i} className="text-xs bg-[var(--color-bg)] p-2 rounded border border-[var(--color-border)] flex justify-between items-center">
                                                            <span className="font-medium text-[var(--color-text)] truncate mr-2" title={step.title}>{step.title}</span>
                                                            <span className="text-[var(--color-text-tertiary)] whitespace-nowrap">{step.duration}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                    <AlertDialogContent className="bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-lg rounded-lg">
                        <AlertDialogHeader>
                            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
                            <AlertDialogDescription className="text-[var(--color-text-secondary)]">
                                {alertConfig.desc}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="admin-btn admin-btn-secondary border border-[var(--color-border)]">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={alertConfig.action}
                                className="admin-btn admin-btn-primary"
                            >
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
};

export default AdminCourses;

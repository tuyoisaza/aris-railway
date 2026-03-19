import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Loader, Plus, Trash2, Edit, Save, X, Search } from 'lucide-react';
import AdminNav from '@/components/AdminNav';

interface Option {
    text: string;
    points: number;
}

interface Question {
    id: string;
    q: string;
    axis_id: string;
    sort_order: number;
    options: Option[];
}

const defaultOptions: Option[] = [
    { text: "Option 1 (0 pts)", points: 0 },
    { text: "Option 2 (1 pts)", points: 1 },
    { text: "Option 3 (2 pts)", points: 2 },
    { text: "Option 4 (3 pts)", points: 3 }
];

export default function AdminQuestions() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAxis, setFilterAxis] = useState<string>('all');

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Question>>({
        q: '',
        axis_id: 'human',
        sort_order: 1,
        options: defaultOptions
    });

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .order('axis_id', { ascending: true })
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setQuestions(data || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (q: Question) => {
        setEditingId(q.id);
        setFormData(q);
        setShowForm(true);
    };

    const handleCreateNew = () => {
        setEditingId(null);
        setFormData({
            q: '',
            axis_id: 'human',
            sort_order: questions.filter(q => q.axis_id === 'human').length + 1,
            options: defaultOptions
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                options: formData.options
            };

            if (editingId) {
                const { error } = await supabase
                    .from('questions')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('questions')
                    .insert(payload);
                if (error) throw error;
            }

            setShowForm(false);
            fetchQuestions();
        } catch (error: any) {
            alert('Error saving: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;
        try {
            const { error } = await supabase.from('questions').delete().eq('id', id);
            if (error) throw error;
            fetchQuestions();
        } catch (error: any) {
            alert('Error deleting: ' + error.message);
        }
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.q.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAxis = filterAxis === 'all' || q.axis_id === filterAxis;
        return matchesSearch && matchesAxis;
    });

    return (
        <>
            <AdminNav />
            <div className={`admin-container transition-all duration-300 ${showForm ? 'max-w-6xl' : 'max-w-4xl'}`}>
                <header className="mb-8 border-b-4 border-slate-900 pb-4 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="brutal-title text-3xl">Manage Questions</h1>
                        <p className="font-mono text-slate-500">System diagnostic protocols.</p>
                    </div>
                    <Button
                        onClick={handleCreateNew}
                        className="brutal-btn bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        <Plus size={18} className="mr-2" /> New Question
                    </Button>
                </header>

                <div className="grid gap-6 grid-cols-1">

                    {/* Form Panel */}
                    {showForm ? (
                        <Card className="brutal-card bg-slate-50 border-2 border-indigo-900 h-fit sticky top-6">
                            <CardHeader className="border-b-2 border-slate-200 flex flex-row justify-between items-center">
                                <h2 className="font-bold text-xl flex items-center gap-2">
                                    {editingId ? <Edit size={20} /> : <Plus size={20} />}
                                    {editingId ? 'Edit Question' : 'New Question'}
                                </h2>
                                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500">
                                    <X size={20} />
                                </button>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <label className="brutal-label">Axis</label>
                                    <select
                                        className="brutal-input w-full"
                                        value={formData.axis_id}
                                        onChange={e => setFormData({ ...formData, axis_id: e.target.value })}
                                    >
                                        <option value="human">Human</option>
                                        <option value="leadership">Leadership</option>
                                        <option value="cocreation">Co-creation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="brutal-label">Question Text</label>
                                    <textarea
                                        className="brutal-input w-full min-h-[80px]"
                                        value={formData.q}
                                        onChange={e => setFormData({ ...formData, q: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="brutal-label">Order</label>
                                        <Input
                                            type="number"
                                            className="brutal-input"
                                            value={formData.sort_order}
                                            onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="brutal-label mb-4 block">Answer Options</label>
                                    <div className="space-y-3">
                                        {formData.options?.map((opt, idx) => (
                                            <div key={idx} className="flex gap-4 items-start bg-slate-100 p-3 rounded border border-slate-200">
                                                <div className="flex-1">
                                                    <label className="text-xs font-mono text-slate-500 mb-1 block">Answer Text</label>
                                                    <Input
                                                        className="brutal-input bg-white"
                                                        value={opt.text}
                                                        onChange={(e) => {
                                                            const newOptions = [...(formData.options || [])];
                                                            newOptions[idx] = { ...opt, text: e.target.value };
                                                            setFormData({ ...formData, options: newOptions });
                                                        }}
                                                    />
                                                </div>
                                                <div className="w-32">
                                                    <label className="text-xs font-mono text-slate-500 mb-1 block">Points</label>
                                                    <select
                                                        className="brutal-input bg-white w-full"
                                                        value={opt.points}
                                                        onChange={(e) => {
                                                            const newOptions = [...(formData.options || [])];
                                                            newOptions[idx] = { ...opt, points: parseInt(e.target.value) };
                                                            setFormData({ ...formData, options: newOptions });
                                                        }}
                                                    >
                                                        <option value={0}>0 Points</option>
                                                        <option value={1}>1 Point</option>
                                                        <option value={2}>2 Points</option>
                                                        <option value={3}>3 Points</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button onClick={handleSave} className="brutal-btn w-full bg-slate-900 text-white">
                                        <Save size={16} className="mr-2" /> Save Question
                                    </Button>
                                    <Button onClick={() => setShowForm(false)} variant="outline" className="brutal-btn flex-1">
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (

                        /* List Panel */
                        <div className="space-y-6">
                            {/* Filters */}
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <Input
                                        className="brutal-input pl-10"
                                        placeholder="Search questions..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="brutal-input w-40"
                                    value={filterAxis}
                                    onChange={e => setFilterAxis(e.target.value)}
                                >
                                    <option value="all">All Axes</option>
                                    <option value="human">Human</option>
                                    <option value="leadership">Leadership</option>
                                    <option value="cocreation">Co-creation</option>
                                </select>
                            </div>

                            {loading ? (
                                <div className="text-center py-12 font-mono">LOADING DATA...</div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredQuestions.map(q => (
                                        <Card key={q.id} className="brutal-card hover:translate-x-1 transition-transform">
                                            <div className="p-4 flex gap-4">
                                                <div className="flex flex-col items-center min-w-[3rem]">
                                                    <span className="text-xs font-mono uppercase bg-slate-100 px-2 py-1 rounded mb-1">
                                                        {q.axis_id.substring(0, 3)}
                                                    </span>
                                                    <span className="font-bold text-lg text-slate-400">#{q.sort_order}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold mb-2">{q.q}</h3>
                                                    <div className="text-sm text-slate-500 font-mono">
                                                        {q.options?.length || 0} Options
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => handleEdit(q)}
                                                        className="p-2 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200"
                                                    >
                                                        <Edit size={16} className="text-blue-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(q.id)}
                                                        className="p-2 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200"
                                                    >
                                                        <Trash2 size={16} className="text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    {filteredQuestions.length === 0 && (
                                        <div className="text-center py-12 text-slate-400 font-mono border-2 border-dashed border-slate-200">
                                            NO QUESTIONS FOUND
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

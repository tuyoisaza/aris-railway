import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Bot, MessageSquare, Play, RefreshCw, AlertCircle, Plus, Trash } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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

interface Agent {
    id: string;
    name: string;
    role_description: string;
    system_prompt: string;
    model: string;
    temperature: number;
}

const AdminAgents = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role_description: '',
        system_prompt: '',
        model: 'gpt-4o-mini',
        temperature: 0.7
    });

    // Chat State
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Alert Dialog State
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ title: string; desc: string; action: () => void }>({ title: '', desc: '', action: () => { } });


    useEffect(() => {
        fetchAgents();
    }, []);

    useEffect(() => {
        if (selectedAgent) {
            setFormData({
                name: selectedAgent.name || '',
                role_description: selectedAgent.role_description || '',
                system_prompt: selectedAgent.system_prompt || '',
                model: selectedAgent.model || 'gpt-4o-mini',
                temperature: selectedAgent.temperature || 0.7
            });
            // Reset chat when switching agents
            setChatHistory([]);
        } else {
            // New Agent Defaults
            setFormData({
                name: 'New Agent',
                role_description: 'Utility Bot',
                system_prompt: 'You are a helpful assistant.',
                model: 'gpt-4o-mini',
                temperature: 0.7
            });
            setChatHistory([]);
        }
    }, [selectedAgent]);

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const res = await fetch('/api/admin/agents', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to fetch agents');
            const data = await res.json();

            setAgents(data);
            if (data.length > 0 && !selectedAgent) {
                setSelectedAgent(data[0]);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedAgent(null); // Triggers useEffect to set defaults
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const payload = selectedAgent ? { ...selectedAgent, ...formData } : formData;
            // If new, payload has no ID (backend handles insert)

            // Determine method/url based on if editing or creating (Actually existing API might handle UPSERT based on ID presence, or separate POST/PUT)
            // Looking at previous views, `AdminAgents.jsx` used POST for update?
            // Let's assume standard REST: POST to create, PUT to update? Or POST with UPSERT?
            // The previous code verified used POST `/api/admin/agents`.
            // Let's stick to that for now, assuming it handles upsert or create.

            const res = await fetch('/api/admin/agents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save agent');
            }

            // Update local state
            if (selectedAgent) {
                setAgents(agents.map(a => a.id === data.id ? data : a));
            } else {
                setAgents([...agents, data]);
            }
            setSelectedAgent(data);

            // Simple success feedback (could use toast)
            // alert('Agent saved successfully'); 
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Add Delete Functionality
    const confirmDelete = () => {
        if (!selectedAgent) return;
        setAlertConfig({
            title: `Delete Agent ${selectedAgent.name}?`,
            desc: "This cannot be undone.",
            action: () => executeDelete(selectedAgent.id)
        });
        setAlertOpen(true);
    };

    const executeDelete = async (id: string) => {
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const res = await fetch(`/api/admin/agents/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Delete failed');

            setAgents(agents.filter(a => a.id !== id));
            if (agents.length > 0) setSelectedAgent(agents[0]);
            else setSelectedAgent(null);

        } catch (err: any) {
            setError(err.message);
        }
    };


    const handleSendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || testing) return;

        const userMsg = { role: 'user', content: chatInput };
        const newHistory = [...chatHistory, userMsg];
        setChatHistory(newHistory);
        setChatInput('');
        setTesting(true);

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const res = await fetch('/api/admin/agents/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    system_prompt: formData.system_prompt, // Use current form prompt (allows testing before saving)
                    messages: newHistory,
                    model: formData.model,
                    temperature: formData.temperature
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Chat failed');

            const assistantMsg = { role: 'assistant', content: data.message.content };
            setChatHistory(prev => [...prev, assistantMsg]);
        } catch (err: any) {
            setChatHistory(prev => [...prev, { role: 'error', content: `Error: ${err.message}` }]);
        } finally {
            setTesting(false);
        }
    };

    return (
        <>
            <AdminNav />
            <div className="brutal-container py-8">
                <div className="brutal-header mb-8">
                    <div>
                        <h1 className="brutal-title text-3xl text-[var(--color-text)]">IA Agents Manager</h1>
                        <p className="brutal-subtitle text-[var(--color-text-secondary)]">Configure System Personalities</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="brutal-btn bg-[var(--color-surface)] text-[var(--color-text)]"
                    >
                        <Plus size={18} className="mr-2" /> New Agent
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">

                    {/* 1. Sidebar List (Left - 3 cols) */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
                        <div className="brutal-card p-4 flex flex-col h-full overflow-hidden bg-[var(--color-surface)] border-[var(--color-border)]">
                            <div className="border-b-2 border-[var(--color-border)] pb-2 mb-4 bg-[var(--color-surface)]">
                                <h3 className="font-bold text-xl text-[var(--color-text)] flex items-center gap-2">
                                    <Bot className="text-[var(--color-primary)]" /> Agents
                                </h3>
                                <p className="text-xs text-[var(--color-text-secondary)]">Select to edit</p>
                            </div>

                            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                                {loading && <div className="p-4 text-center text-[var(--color-text-secondary)]">Loading...</div>}
                                {agents.map(agent => (
                                    <button
                                        key={agent.id}
                                        onClick={() => setSelectedAgent(agent)}
                                        className={`p-3 text-left transition-all border-2 rounded-none hover:translate-x-1 ${selectedAgent?.id === agent.id
                                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary-dark)] shadow-md'
                                            : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text)]'
                                            }`}
                                    >
                                        <div className="font-bold text-sm">{agent.name}</div>
                                        <div className={`text-xs truncate ${selectedAgent?.id === agent.id ? 'text-white/80' : 'text-[var(--color-text-tertiary)]'}`}>
                                            {agent.role_description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. Editor (Center - 5 cols) */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        <div className="brutal-card flex-1 flex flex-col p-6 h-full overflow-y-auto bg-[var(--color-surface)] border-[var(--color-border)]">
                            <div className="flex justify-between items-center mb-4 border-b-2 border-[var(--color-border)] pb-2">
                                <h3 className="font-bold text-xl text-[var(--color-text)]">
                                    {selectedAgent ? 'Edit Agent' : 'New Agent'}
                                </h3>
                                {selectedAgent && (
                                    <button
                                        onClick={confirmDelete}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                                        title="Delete Agent"
                                    >
                                        <Trash size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="brutal-label block mb-1">Name</label>
                                    <input
                                        type="text"
                                        className="brutal-input w-full"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Agent Name"
                                    />
                                </div>

                                <div>
                                    <label className="brutal-label block mb-1">Role Description</label>
                                    <input
                                        type="text"
                                        className="brutal-input w-full"
                                        value={formData.role_description}
                                        onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
                                        placeholder="Short role description"
                                    />
                                </div>

                                <div>
                                    <label className="brutal-label block mb-1 text-[var(--color-text-secondary)]">System Prompt</label>
                                    <textarea
                                        className="brutal-input w-full text-sm leading-relaxed p-4 resize-none h-48 bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border)]"
                                        value={formData.system_prompt}
                                        onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                                        placeholder="You are an AI assistant..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="brutal-label block mb-1">Model</label>
                                        <select
                                            className="brutal-input w-full"
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        >
                                            <optgroup label="Latest Generation">
                                                <option value="gpt-4o-mini">gpt-4o-mini</option>
                                                <option value="gpt-4o">gpt-4o</option>
                                                <option value="gpt-4-turbo">gpt-4-turbo</option>
                                            </optgroup>
                                            <optgroup label="Legacy">
                                                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                                                <option value="gpt-4">gpt-4</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="brutal-label block mb-1">Temperature</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="2"
                                            className="brutal-input w-full"
                                            value={formData.temperature}
                                            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    className="brutal-btn primary w-full justify-center flex items-center gap-2"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? <RefreshCw className="animate-spin" /> : <Save />}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                {error && <div className="mt-2 text-red-500 text-xs text-center">{error}</div>}
                            </div>
                        </div>
                    </div>

                    {/* 3. Chat Test (Right - 4 cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="brutal-card flex-1 flex flex-col p-0 overflow-hidden h-full bg-[var(--color-surface)] border-[var(--color-border)]">
                            <div className="p-4 border-b-2 border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                                <h3 className="font-bold text-xl text-[var(--color-text)] flex items-center gap-2">Test Interaction</h3>
                                <p className="text-xs text-[var(--color-text-secondary)]">Chat with the *unsaved* prompt version to test immediately.</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[var(--color-bg-secondary)] max-h-[400px]">
                                {chatHistory.length === 0 && (
                                    <div className="text-center text-[var(--color-text-tertiary)] mt-20 italic">
                                        Start a conversation...
                                    </div>
                                )}
                                {chatHistory.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg text-sm max-w-[90%] ${msg.role === 'user'
                                            ? 'bg-[var(--color-primary)] text-white self-end rounded-br-none'
                                            : 'bg-[var(--color-surface)] border border-[var(--color-border)] self-start rounded-bl-none text-[var(--color-text)]'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                ))}
                                {testing && (
                                    <div className="self-start bg-[var(--color-bg-tertiary)] p-2 rounded-lg text-xs animate-pulse text-[var(--color-text-secondary)]">
                                        Typing...
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSendChat} className="p-4 bg-[var(--color-surface)] border-t-2 border-[var(--color-border)]">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="brutal-input flex-1 bg-[var(--color-bg)] text-[var(--color-text)]"
                                        placeholder="Type a message..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        disabled={testing}
                                    />
                                    <button
                                        type="submit"
                                        className="brutal-btn bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                                        disabled={testing || !chatInput.trim()}
                                    >
                                        <Play size={16} fill="currentColor" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>

                <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                    <AlertDialogContent className="bg-[var(--color-surface)] text-[var(--color-text)] border-4 border-[var(--color-border)] rounded-none shadow-[8px_8px_0px_0px_var(--color-border)]">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-bold text-xl uppercase">{alertConfig.title}</AlertDialogTitle>
                            <AlertDialogDescription className="text-[var(--color-text-secondary)] text-sm">
                                {alertConfig.desc}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-[var(--color-surface)] text-[var(--color-text)] border-2 border-[var(--color-border)] rounded-none hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={alertConfig.action}
                                className="bg-red-600 text-white rounded-none hover:bg-red-700 border-2 border-transparent"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
};

export default AdminAgents;

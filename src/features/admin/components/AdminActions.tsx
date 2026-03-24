import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Plus, Edit2, Trash2, Save, X, Zap, RefreshCw } from 'lucide-react';

interface Action {
    slug?: string;
    name?: string;
    agent_id?: string;
    intent_placeholder?: string;
    description?: string;
    icon?: string;
    input_type?: string;
    enabled?: boolean;
    requires_confirmation?: boolean;
    result_route?: string;
}

const AGENTS = [
    { id: 'teacher', name: 'The Teacher' },
    { id: 'cartographer', name: 'The Cartographer' },
    { id: 'librarian', name: 'The Librarian' },
    { id: 'scout', name: 'The Scout' },
    { id: 'lugh', name: 'Lugh (Skills)' },
    { id: 'daedalus', name: 'Daedalus (Projects)' },
    { id: 'ogma', name: 'Ogma (Memory)' },
    { id: 'thoth', name: 'Thoth (Organizer)' },
];

const AdminActions = () => {
    const [actions, setActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState<Action>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getActions?.() || [];
            setActions(data);
        } catch (err) {
            console.error('[Admin/Actions] Error fetching actions:', err);
            setActions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (action: Action) => {
        setEditing(action.slug);
        setFormData({ ...action });
        setShowCreate(false);
    };

    const handleNew = () => {
        setShowCreate(true);
        setEditing(null);
        setFormData({
            agent_id: 'teacher',
            intent_placeholder: 'Describe what you want to do...',
            input_type: 'text',
            enabled: true,
            requires_confirmation: false,
            result_route: '/dashboard',
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editing) {
                await api.agora.updateAction(editing, formData);
            } else {
                await api.agora.createAction(formData);
            }
            setEditing(null);
            setShowCreate(false);
            setFormData({});
            fetchActions();
        } catch (err: any) {
            alert('Failed to save action: ' + (err.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (slug: string) => {
        if (!confirm(`Are you sure you want to delete action "${slug}"?`)) return;
        try {
            await api.agora.deleteAction(slug);
            fetchActions();
        } catch (err) {
            alert('Failed to delete action');
        }
    };

    const handleCancel = () => {
        setEditing(null);
        setShowCreate(false);
        setFormData({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading actions...</div>
            </div>
        );
    }

    if (editing || showCreate) {
        return (
            <div className="p-6 max-w-3xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            {editing ? <Edit2 size={20} className="text-orange-600" /> : <Plus size={20} className="text-orange-600" />}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {editing ? 'Edit Action' : 'Create New Action'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Slug (ID)</label>
                            <input
                                name="slug"
                                value={formData.slug || ''}
                                onChange={handleChange}
                                disabled={editing !== null}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-mono text-sm bg-gray-50"
                                placeholder="my-action-slug"
                            />
                            {editing && <p className="text-xs text-gray-500 mt-1">Slug cannot be changed</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
                            <input
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                placeholder="My Action"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Agent</label>
                            <select
                                name="agent_id"
                                value={formData.agent_id || 'teacher'}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                            >
                                {AGENTS.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Result Route</label>
                            <input
                                name="result_route"
                                value={formData.result_route || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                placeholder="/topic/:id"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                            <input
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                placeholder="What this action does..."
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Intent Placeholder</label>
                            <input
                                name="intent_placeholder"
                                value={formData.intent_placeholder || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                placeholder="Describe what you want to do..."
                            />
                        </div>
                        <div className="col-span-2 flex items-center gap-6 pt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="enabled"
                                    checked={formData.enabled ?? true}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Enabled</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="requires_confirmation"
                                    checked={formData.requires_confirmation ?? false}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Requires Confirmation</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Action'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            <X size={18} />
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Guided Actions</h1>
                <div className="flex gap-3">
                    <button
                        onClick={fetchActions}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                    <button
                        onClick={handleNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
                    >
                        <Plus size={18} />
                        New Action
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {actions.map((action) => (
                            <tr key={action.slug} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="font-medium text-gray-900">{action.name}</div>
                                    {action.description && (
                                        <div className="text-sm text-gray-500 truncate max-w-xs">{action.description}</div>
                                    )}
                                </td>
                                <td className="px-5 py-4">
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{action.slug}</code>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                        {action.agent_id}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-sm text-gray-600">{action.result_route || '-'}</span>
                                </td>
                                <td className="px-5 py-4">
                                    {action.enabled ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                            Active
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Disabled</span>
                                    )}
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => handleEdit(action)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} className="text-gray-600" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(action.slug!)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} className="text-red-500" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {actions.length === 0 && (
                    <div className="text-center py-16">
                        <Zap size={64} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No actions found</h3>
                        <p className="text-gray-500 mb-4">Create your first guided action</p>
                        <button
                            onClick={handleNew}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
                        >
                            <Plus size={18} />
                            Create First Action
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminActions;

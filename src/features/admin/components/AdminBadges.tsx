import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Plus, Edit2, Trash2, Award, Check, X, AlertTriangle } from 'lucide-react';
import BulkDeleteBar from '../../../components/BulkDeleteBar';

const AdminBadges = () => {
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBadge, setEditingBadge] = useState<any>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getBadges();
            setBadges(data?.data || data || []);
        } catch (err) {
            console.error('[Admin/Badges] Error fetching badges:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this badge?')) return;
        try {
            await api.admin.deleteBadge(id);
            fetchBadges();
        } catch (err) {
            alert('Failed to delete badge');
        }
    };

    const handleSave = async (data: any) => {
        try {
            if (data.id) {
                await api.admin.updateBadge(data.id, data);
            } else {
                await api.admin.createBadge(data);
            }
            setEditingBadge(null);
            fetchBadges();
        } catch (err) {
            alert('Failed to save badge');
        }
    };

    const toggleSelectionMode = () => {
        if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedIds([]);
        } else {
            setIsSelectionMode(true);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} badges?`)) return;

        setIsBulkDeleting(true);
        try {
            await Promise.all(selectedIds.map(id => api.admin.deleteBadge(id)));
            fetchBadges();
            setSelectedIds([]);
            setIsSelectionMode(false);
        } catch (err) {
            alert('Some badges failed to delete.');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading badges...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">System Badges & Rewards</h1>
                <div className="flex gap-3">
                    {!editingBadge && (
                        <button
                            onClick={toggleSelectionMode}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                isSelectionMode
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {isSelectionMode ? 'Cancel' : 'Select'}
                        </button>
                    )}
                    <button
                        onClick={() => setEditingBadge({})}
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
                    >
                        <Plus size={18} />
                        Create New
                    </button>
                </div>
            </div>

            <BulkDeleteBar
                selectedCount={selectedIds.length}
                onDelete={handleBulkDelete}
                onCancel={() => setSelectedIds([])}
                isDeleting={isBulkDeleting}
                itemName="Badges"
            />

            {editingBadge !== null ? (
                <BadgeEditor
                    badge={editingBadge}
                    onSave={handleSave}
                    onCancel={() => setEditingBadge(null)}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {badges.map((badge: any) => (
                        <div
                            key={badge.id}
                            onClick={(e) => {
                                if (isSelectionMode) {
                                    handleToggleSelect(badge.id);
                                }
                            }}
                            className={`bg-white rounded-xl border p-5 flex flex-col gap-3 relative transition-all ${
                                selectedIds.includes(badge.id)
                                    ? 'border-orange-500 border-2 shadow-lg'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            } ${isSelectionMode ? 'cursor-pointer' : ''}`}
                        >
                            {isSelectionMode && (
                                <div className={`absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                                    selectedIds.includes(badge.id)
                                        ? 'bg-orange-500'
                                        : 'border-2 border-gray-300 bg-white'
                                }`}>
                                    {selectedIds.includes(badge.id) && <Check size={14} className="text-white" />}
                                </div>
                            )}

                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">{badge.icon || '🏆'}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                                        <p className="text-xs text-gray-500">{badge.category || 'Uncategorized'}</p>
                                    </div>
                                </div>

                                {!isSelectionMode && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingBadge(badge); }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} className="text-gray-600" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(badge.id); }}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} className="text-red-500" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-gray-600">{badge.description || 'No description'}</p>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-500">XP Reward</span>
                                <span className="font-bold text-orange-600">{badge.xpReward || 0} XP</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {badges.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <Award size={64} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No badges found</h3>
                    <p className="text-gray-500 mb-4">Create your first badge to reward users</p>
                    <button
                        onClick={() => setEditingBadge({})}
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors mx-auto"
                    >
                        <Plus size={18} />
                        Create First Badge
                    </button>
                </div>
            )}
        </div>
    );
};

interface BadgeEditorProps {
    badge: any;
    onSave: (data: any) => void;
    onCancel: () => void;
}

const BadgeEditor: React.FC<BadgeEditorProps> = ({ badge, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: badge?.name || '',
        description: badge?.description || '',
        icon: badge?.icon || '🏆',
        xpReward: badge?.xpReward || 0,
        category: badge?.category || 'badge',
        active: badge?.active ?? true,
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }
        const payload = {
            ...(badge?.id ? { id: badge.id } : {}),
            ...formData,
        };
        onSave(payload);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle size={20} className="text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                    {badge?.id ? 'Edit Badge' : 'Create New Badge'}
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        placeholder="Badge name..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                        placeholder="Describe what this badge rewards..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Icon (Emoji)</label>
                        <input
                            type="text"
                            value={formData.icon}
                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-center text-2xl"
                            placeholder="🏆"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">XP Reward</label>
                        <input
                            type="number"
                            value={formData.xpReward}
                            onChange={e => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                            min="0"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                    >
                        <option value="badge">Badge (Permanent)</option>
                        <option value="achievement">Achievement</option>
                        <option value="milestone">Milestone</option>
                        <option value="special">Special</option>
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, active: !formData.active })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                formData.active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                        {formData.active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                    >
                        <Check size={18} />
                        Save Badge
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        <X size={18} />
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminBadges;

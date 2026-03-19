import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle, Check, X } from 'lucide-react';
import { api } from '../../services/api';
import BulkDeleteBar from '../../components/BulkDeleteBar';

const BadgeManager = () => {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingBadge, setEditingBadge] = useState(null); // null = list, object = edit mode

    // Bulk Selection State
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
            setBadges(data || []);
        } catch (err) {
            console.error('Failed to fetch badges:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this badge?')) return;
        try {
            await api.admin.deleteBadge(id);
            fetchBadges();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const handleSave = async (data) => {
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

    if (loading) return <div>Loading Badges...</div>;

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>System Badges & Warnings</h2>

                <div style={{ display: 'flex', gap: '12px' }}>
                    {!editingBadge && (
                        <button
                            onClick={toggleSelectionMode}
                            style={{
                                display: 'flex', gap: '8px', alignItems: 'center',
                                background: isSelectionMode ? '#eee' : 'white',
                                border: '1px solid #ddd',
                                color: '#444',
                                padding: '10px 16px', borderRadius: '8px',
                                fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            {isSelectionMode ? 'Cancel' : 'Select'}
                        </button>
                    )}

                    <button
                        onClick={() => setEditingBadge({})}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#F97316', color: 'white', border: 'none',
                            padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        <Plus size={16} /> Create New
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

            {editingBadge ? (
                <BadgeEditor
                    badge={editingBadge}
                    onSave={handleSave}
                    onCancel={() => setEditingBadge(null)}
                />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {badges.map(badge => (
                        <div
                            key={badge.id}
                            onClick={(e) => {
                                if (isSelectionMode) {
                                    handleToggleSelect(badge.id);
                                }
                            }}
                            style={{
                                background: 'white',
                                border: selectedIds.includes(badge.id) ? '2px solid #F97316' : '1px solid #eee',
                                borderRadius: '12px', padding: '16px',
                                display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative',
                                cursor: isSelectionMode ? 'pointer' : 'default'
                            }}
                        >
                            {/* Checkbox Overlay */}
                            {isSelectionMode && (
                                <div style={{
                                    position: 'absolute', top: '12px', right: '12px',
                                    width: '24px', height: '24px', borderRadius: '6px',
                                    border: selectedIds.includes(badge.id) ? 'none' : '2px solid #ddd',
                                    background: selectedIds.includes(badge.id) ? '#F97316' : 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {selectedIds.includes(badge.id) && <Check size={16} color="white" />}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px', height: '40px', background: '#fff7ed', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316'
                                    }}>
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px' }}>{badge.name}</h3>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{badge.trigger_type}</div>
                                    </div>
                                </div>

                                {!isSelectionMode && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => setEditingBadge(badge)}
                                            style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#666' }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(badge.id)}
                                            style={{ padding: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p style={{ fontSize: '14px', color: '#444', margin: '8px 0' }}>{badge.description}</p>

                            <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                                Condition: {JSON.stringify(badge.trigger_condition)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const BadgeEditor = ({ badge, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '', description: '', icon: 'Award', trigger_type: 'interaction_count',
        trigger_condition: '{"count": 15}', message_template: "You've reached {{count}} interactions...",
        is_active: true, category: 'badge', ...badge
    });

    // Handle complex JSON input
    const [jsonError, setJsonError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (typeof payload.trigger_condition === 'string') {
                payload.trigger_condition = JSON.parse(payload.trigger_condition);
            }
            onSave(payload);
        } catch (err) {
            setJsonError('Invalid JSON Format');
        }
    };

    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #eee' }}>
            <h3 style={{ marginTop: 0 }}>{badge.id ? 'Edit Badge' : 'New Badge'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Name</label>
                    <input
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Description</label>
                    <input
                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Category</label>
                        <select
                            value={formData.category || 'warning'} onChange={e => setFormData({ ...formData, category: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                        >
                            <option value="warning">Warning (Transient)</option>
                            <option value="badge">Badge (Permanent)</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Trigger Type</label>
                        <select
                            value={formData.trigger_type} onChange={e => setFormData({ ...formData, trigger_type: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                        >
                            <option value="interaction_count">Interaction Count</option>
                            <option value="topic_depth">Topic Depth (Future)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Condition (JSON)</label>
                    <input
                        value={typeof formData.trigger_condition === 'object' ? JSON.stringify(formData.trigger_condition) : formData.trigger_condition}
                        onChange={e => {
                            setFormData({ ...formData, trigger_condition: e.target.value });
                            setJsonError(null);
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontFamily: 'monospace' }}
                    />
                    {jsonError && <div style={{ color: 'red', fontSize: '12px' }}>{jsonError}</div>}
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Message Template</label>
                    <textarea
                        value={formData.message_template} onChange={e => setFormData({ ...formData, message_template: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', height: '80px' }}
                    />
                    <div style={{ fontSize: '11px', color: '#666' }}>Use <code>{'{{count}}'}</code> variable.</div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="submit" style={{ padding: '10px 24px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
                    <button type="button" onClick={onCancel} style={{ padding: '10px 24px', background: '#eee', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default BadgeManager;

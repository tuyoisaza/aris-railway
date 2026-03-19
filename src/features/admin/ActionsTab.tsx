import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit, Trash, Save, X, Activity } from 'lucide-react';

const ActionsTab = () => {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<string | null>(null); // Action being edited (or 'new')
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        setLoading(true);
        try {
            const data = await api.agora.getActions();
            setActions(data);
        } catch (err) {
            console.error('Failed to load actions', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (action) => {
        setEditing(action.slug);
        setFormData({ ...action });
    };

    const handleNew = () => {
        setEditing('new');
        setFormData({
            slug: '',
            name: '',
            agent_id: 'teacher',
            intent_placeholder: 'Describe what you want to do...',
            description: '',
            icon: 'Activity',
            input_type: 'text',
            enabled: true,
            requires_confirmation: false,
            result_route: '/dashboard'
        });
    };

    const handleSave = async () => {
        try {
            if (editing === 'new') {
                await api.agora.createAction(formData);
            } else {
                await api.agora.updateAction(editing, formData);
            }
            setEditing(null);
            fetchActions();
        } catch (err) {
            alert('Failed to save action: ' + err.message);
        }
    };

    const handleDelete = async (slug) => {
        if (!confirm(`Are you sure you want to delete action "${slug}"?`)) return;
        try {
            await api.agora.deleteAction(slug);
            fetchActions();
        } catch (err) {
            alert('Failed to delete action');
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    if (loading && !actions.length) return <div>Loading actions...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Registered Actions</h3>
                <button
                    onClick={handleNew}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', background: '#F97316', color: '#fff',
                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    <Plus size={16} /> New Action
                </button>
            </div>

            {editing && (
                <div style={{
                    background: '#fff', border: '1px solid #F97316', borderRadius: '8px', padding: '20px',
                    marginBottom: '20px', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.1)'
                }}>
                    <h4 style={{ marginTop: 0 }}>{editing === 'new' ? 'Create New Action' : 'Edit Action'}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Slug (ID)</label>
                            <input
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                disabled={editing !== 'new'}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Display Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Agent ID</label>
                            <select
                                name="agent_id"
                                value={formData.agent_id}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                <option value="teacher">Teacher</option>
                                <option value="cartographer">Cartographer</option>
                                <option value="lugh">Lugh (Skills)</option>
                                <option value="daedalus">Daedalus (Projects)</option>
                                <option value="librarian">Librarian</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Result Route</label>
                            <input
                                name="result_route"
                                value={formData.result_route}
                                onChange={handleChange}
                                placeholder="/topic/:id"
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Description</label>
                            <input
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Intent Placeholder</label>
                            <input
                                name="intent_placeholder"
                                value={formData.intent_placeholder}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="enabled"
                                    checked={formData.enabled}
                                    onChange={handleChange}
                                />
                                Enabled
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button
                            onClick={handleSave}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 24px', background: '#166534', color: '#fff',
                                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >
                            <Save size={16} /> Save
                        </button>
                        <button
                            onClick={() => setEditing(null)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 24px', background: '#eee', color: '#333',
                                border: 'none', borderRadius: '6px', cursor: 'pointer'
                            }}
                        >
                            <X size={16} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #ddd' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Name</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Slug</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Agent</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Route</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#666' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {actions.map((action) => (
                            <tr key={action.slug} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px', fontWeight: '500' }}>{action.name}</td>
                                <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>{action.slug}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                        {action.agent_id}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', color: '#666', fontSize: '12px' }}>{action.result_route}</td>
                                <td style={{ padding: '12px' }}>
                                    {action.enabled ? (
                                        <span style={{ color: '#166534', fontWeight: 'bold', fontSize: '12px' }}>Active</span>
                                    ) : (
                                        <span style={{ color: '#999', fontSize: '12px' }}>Disabled</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleEdit(action)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(action.slug)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                            title="Delete"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ActionsTab;

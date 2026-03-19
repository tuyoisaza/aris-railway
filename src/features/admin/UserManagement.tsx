import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trash2, Edit2, RotateCcw, UserPlus, Check, X } from 'lucide-react';

interface User {
    id?: string;
    email?: string;
    password?: string;
    name?: string;
    plan?: string;
    is_super_admin?: boolean;
}

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<User>({});

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getUsers();
            if (Array.isArray(data)) setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        try {
            await api.admin.deleteUser(id);
            fetchUsers();
        } catch (e) {
            alert('Failed to delete user');
        }
    };

    const handleResetPassword = async (id) => {
        if (!confirm('Send password reset email to this user?')) return;
        try {
            await api.admin.resetUserPassword(id);
            alert('Reset email sent.');
        } catch (e) {
            alert('Failed to send reset email');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingUser.id) {
                // Update
                await api.admin.updateUser(editingUser.id, formData);
            } else {
                // Create
                await api.admin.createUser(formData);
            }
            setEditingUser(null);
            fetchUsers();
        } catch (e) {
            console.error(e);
            alert('Failed to save user');
        }
    };

    if (editingUser) {
        return (
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #ddd', maxWidth: '500px' }}>
                <h3>{editingUser.id ? 'Edit User' : 'Create User'}</h3>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {!editingUser.id && (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email || ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Password</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password || ''}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Name</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Plan</label>
                        <select
                            value={formData.plan || 'free'}
                            onChange={e => setFormData({ ...formData, plan: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        >
                            <option value="free">Free</option>
                            <option value="paid">Paid</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_super_admin || false}
                                onChange={e => setFormData({ ...formData, is_super_admin: e.target.checked })}
                            />
                            Is Super Admin
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#F97316', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                        <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2>User Management</h2>
                <button
                    onClick={() => { setEditingUser({}); setFormData({}); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#F97316', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    <UserPlus size={16} /> Create User
                </button>
            </div>
            {loading ? <div>Loading users...</div> : (
                <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #ddd' }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Name</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Plan</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Role</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#666' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', fontSize: '14px' }}>{u.email}</td>
                                    <td style={{ padding: '12px', fontSize: '14px' }}>{u.name}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#fff7ed', color: '#c2410c', fontSize: '12px', fontWeight: 'bold' }}>{u.plan}</span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {u.is_super_admin && <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>Super Admin</span>}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button onClick={() => { setEditingUser(u); setFormData(u); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }} title="Edit"><Edit2 size={16} /></button>
                                            <button onClick={() => handleResetPassword(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }} title="Reset Password"><RotateCcw size={16} /></button>
                                            <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserManagement;

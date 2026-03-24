import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { RefreshCw, Edit2, Trash2, Users, Shield, RotateCcw, Plus, X, Check } from 'lucide-react';

interface User {
    id?: string;
    email?: string;
    password?: string;
    name?: string;
    plan?: string;
    role?: string;
    createdAt?: string;
}

const AdminUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState<User>({});

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getUsers();
            setUsers(data?.data || data || []);
        } catch (err) {
            console.error('[Admin/Users] Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        try {
            await api.admin.deleteUser(id);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleResetPassword = async (id: string) => {
        if (!confirm('Send password reset email to this user?')) return;
        try {
            await api.admin.resetUserPassword(id);
            alert('Reset email sent.');
        } catch (err) {
            alert('Failed to send reset email');
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({ ...user });
        setShowCreateForm(false);
    };

    const handleNew = () => {
        setShowCreateForm(true);
        setEditingUser(null);
        setFormData({ plan: 'free', role: 'user' });
    };

    const handleSave = async () => {
        try {
            if (editingUser?.id) {
                await api.admin.updateUser(editingUser.id, formData);
            } else {
                await api.admin.createUser(formData);
            }
            setEditingUser(null);
            setShowCreateForm(false);
            setFormData({});
            fetchUsers();
        } catch (err) {
            alert('Failed to save user');
        }
    };

    const handleCancel = () => {
        setEditingUser(null);
        setShowCreateForm(false);
        setFormData({});
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading users...</div>
            </div>
        );
    }

    if (editingUser || showCreateForm) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            {editingUser ? <Edit2 size={20} className="text-orange-600" /> : <Plus size={20} className="text-orange-600" />}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {editingUser ? 'Edit User' : 'Create New User'}
                        </h2>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
                        {!editingUser && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email || ''}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        value={formData.password || ''}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                        placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                placeholder="Display name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Plan</label>
                                <select
                                    value={formData.plan || 'free'}
                                    onChange={e => setFormData({ ...formData, plan: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                                >
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                                <select
                                    value={formData.role || 'user'}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                            >
                                <Check size={18} />
                                Save User
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                <X size={18} />
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <div className="flex gap-3">
                    <button
                        onClick={fetchUsers}
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
                        Create User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-4">
                                    <span className="font-medium text-gray-900">{user.email}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-gray-700">{user.name || '-'}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                        user.plan === 'pro' || user.plan === 'enterprise'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {user.plan || 'free'}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    {user.role === 'admin' ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                            <Shield size={12} />
                                            Admin
                                        </span>
                                    ) : (
                                        <span className="text-gray-500 text-sm">User</span>
                                    )}
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-gray-500 text-sm">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Edit User"
                                        >
                                            <Edit2 size={16} className="text-gray-600" />
                                        </button>
                                        <button
                                            onClick={() => handleResetPassword(user.id!)}
                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Reset Password"
                                        >
                                            <RotateCcw size={16} className="text-blue-600" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id!)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} className="text-red-500" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="text-center py-16">
                        <Users size={64} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-500 mb-4">Create your first user to get started</p>
                        <button
                            onClick={handleNew}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
                        >
                            <Plus size={18} />
                            Create First User
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;

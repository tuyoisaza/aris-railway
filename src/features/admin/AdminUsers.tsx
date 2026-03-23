import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RefreshCw, Edit2, Trash2, Users, Shield } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.admin.deleteUser(id);
            fetchUsers();
        } catch (err) {
            console.error('[Admin/Users] Error deleting user:', err);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left">Email</th>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Role</th>
                            <th className="px-4 py-3 text-left">Plan</th>
                            <th className="px-4 py-3 text-left">Created</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user: any) => (
                            <tr key={user.id} className="border-t">
                                <td className="px-4 py-3">{user.email}</td>
                                <td className="px-4 py-3">{user.name || '-'}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{user.plan}</td>
                                <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-gray-100 rounded">
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 hover:bg-red-100 text-red-600 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;

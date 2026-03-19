import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Trash, Loader, Edit, Plus, X, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

interface UserProfile {
    id: string;
    email?: string;
    full_name?: string;
    avatar_url?: string;
    subscription_status?: string;
    is_super_admin?: boolean;
    created_at: string;
}

interface UserForm {
    email: string;
    full_name: string;
    subscription_status: string;
    is_super_admin: boolean;
}

const emptyForm: UserForm = {
    email: '',
    full_name: '',
    subscription_status: 'free',
    is_super_admin: false
};

const AdminUsers = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ title: string; desc: string; action: () => void }>({ title: '', desc: '', action: () => { } });

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState<UserForm>(emptyForm);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingUser(null);
        setFormData(emptyForm);
        setShowForm(true);
    };

    const handleEdit = (user: UserProfile) => {
        setEditingUser(user);
        setFormData({
            email: user.email || '',
            full_name: user.full_name || '',
            subscription_status: user.subscription_status || 'free',
            is_super_admin: !!user.is_super_admin
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingUser(null);
        setFormData(emptyForm);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;

            if (editingUser) {
                // Update existing user
                const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        full_name: formData.full_name,
                        email: formData.email,
                        subscription_status: formData.subscription_status,
                        is_super_admin: formData.is_super_admin
                    })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Update failed');
                }

                alert('User updated successfully!');
            } else {
                // Create new user (Invite)
                if (!formData.email) {
                    alert('Email is required');
                    setSaving(false);
                    return;
                }

                const res = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Invite failed');
                }

                alert('User invited successfully! Check email for link.');
            }

            handleCancel();
            fetchUsers();
        } catch (e: any) {
            alert('Save failed: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (user: UserProfile) => {
        setAlertConfig({
            title: `Delete User ${user.full_name || user.email}?`,
            desc: "This action cannot be undone. It will permanently remove the user's account and all associated data.",
            action: () => executeDelete(user.id)
        });
        setAlertOpen(true);
    };

    const executeDelete = async (id: string) => {
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;

            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Delete failed');

            // Refresh list
            fetchUsers();
        } catch (e: any) {
            alert('Delete failed: ' + e.message);
        }
    };

    const toggleSubscription = async (user: UserProfile) => {
        const newStatus = user.subscription_status === 'active' ? 'free' : 'active';

        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;

            const res = await fetch(`/api/admin/users/${user.id}/subscription`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Update failed');

            fetchUsers();
        } catch (e: any) {
            alert('Status update failed: ' + e.message);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
            <AdminNav />
            <div className="brutal-container py-8">
                <header className="mb-8 border-b-4 border-slate-900 pb-4 flex justify-between items-center">
                    <div>
                        <h1 className="brutal-title text-3xl">Manage Users</h1>
                        <p className="font-mono text-slate-500">Overview of registered users and subscriptions.</p>
                    </div>
                    <Button
                        onClick={handleCreateNew}
                        className="brutal-btn bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                    >
                        <Plus size={18} className="mr-2" /> New User
                    </Button>
                </header>

                {/* Create/Edit Form */}
                {showForm && (
                    <Card className="brutal-card mb-8 bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]">
                        <CardHeader className="border-b-2 border-slate-200 flex flex-row justify-between items-center">
                            <h2 className="font-bold text-xl flex items-center gap-2">
                                {editingUser ? <Edit size={20} /> : <Plus size={20} />}
                                {editingUser ? 'Edit User' : 'Invite New User'}
                            </h2>
                            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="brutal-label">Email *</label>
                                    <Input
                                        type="email"
                                        className="brutal-input"
                                        placeholder="user@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={!!editingUser} // Can't change email easily
                                    />
                                    {editingUser && <p className="text-xs text-slate-400 mt-1">Email cannot be changed after creation</p>}
                                </div>
                                <div>
                                    <label className="brutal-label">Full Name</label>
                                    <Input
                                        type="text"
                                        className="brutal-input"
                                        placeholder="John Doe"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                {!editingUser && (
                                    <div className="col-span-2 bg-[var(--color-bg-secondary)] p-3 rounded text-sm text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                                        An email invite will be sent to this address to set their password.
                                    </div>
                                )}
                                <div>
                                    <label className="brutal-label">Subscription Status</label>
                                    <select
                                        className="brutal-input w-full"
                                        value={formData.subscription_status}
                                        onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                                    >
                                        <option value="free">Free</option>
                                        <option value="active">Active (Paid)</option>
                                        <option value="trialing">Trialing</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="brutal-label">User Type</label>
                                    <select
                                        className="brutal-input w-full"
                                        value={formData.is_super_admin ? 'admin' : 'user'}
                                        onChange={(e) => setFormData({ ...formData, is_super_admin: e.target.value === 'admin' })}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                                        Admins can access `/admin/*`.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="brutal-btn bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                                >
                                    {saving ? <Loader className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                                    {editingUser ? 'Save Changes' : 'Send Invite'}
                                </Button>
                                <Button onClick={handleCancel} variant="outline" className="brutal-btn border-[var(--color-border)] text-[var(--color-text)]">Cancel</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="mb-6 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by email or name..."
                            className="brutal-input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-lg px-4 py-2 border-2 border-slate-900">
                            Total Users: {users.length}
                        </Badge>
                    </div>
                </div>

                <Card className="brutal-card bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]">
                    <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                        <div className="grid grid-cols-12 gap-4 font-bold text-sm uppercase text-[var(--color-text-tertiary)]">
                            <div className="col-span-3">User</div>
                            <div className="col-span-3">Email</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Joined</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
                                <Loader className="animate-spin" size={20} /> Loading users...
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No users found.</div>
                        ) : (
                            <div className="divide-y divide-[var(--color-border)]">
                                {filteredUsers.map(user => (
                                    <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[var(--color-bg-secondary)] transition-colors group">
                                        <div className="col-span-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-bold text-xs text-[var(--color-text-tertiary)]">
                                                        {user.full_name?.[0] || '?'}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-[var(--color-text)]">{user.full_name || 'Unknown'}</div>
                                                <div className="text-xs text-[var(--color-text-tertiary)] truncate font-mono max-w-[150px]" title={user.id}>{user.id.substring(0, 8)}...</div>
                                            </div>
                                        </div>
                                        <div className="col-span-3 text-sm text-[var(--color-text-secondary)] truncate" title={user.email}>
                                            {user.email || 'No Email'}
                                        </div>
                                        <div className="col-span-2 cursor-pointer" onClick={() => toggleSubscription(user)}>
                                            <Badge
                                                variant={user.subscription_status === 'active' ? 'default' : 'secondary'}
                                                className="uppercase text-[10px] hover:scale-105 transition-transform select-none"
                                                title="Click to toggle status"
                                            >
                                                {user.subscription_status || 'Free'}
                                            </Badge>
                                        </div>
                                        <div className="col-span-2 text-sm text-[var(--color-text-tertiary)]">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] rounded"
                                                title="Edit User"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(user)}
                                                className="p-2 text-[var(--color-text-tertiary)] hover:text-red-600 hover:bg-[var(--color-bg-secondary)] rounded"
                                                title="Delete User"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                    <AlertDialogContent className="bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-lg rounded-lg">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-bold text-xl uppercase">{alertConfig.title}</AlertDialogTitle>
                            <AlertDialogDescription className="text-[var(--color-text-secondary)] font-mono text-sm">
                                {alertConfig.desc}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-[var(--color-bg-secondary)] text-[var(--color-text)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg)]">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={alertConfig.action}
                                className="bg-red-600 text-white rounded-lg hover:bg-red-700 border border-transparent"
                            >
                                Confirm Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div >
        </>
    );
};

export default AdminUsers;

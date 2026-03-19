import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, MoreHorizontal, Shield, Trash2, KeyRound } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
    id: string;
    email: string;
    full_name: string;
    subscription_status: string;
    is_super_admin: boolean;
    created_at: string;
    last_sign_in_at: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filterPlan, setFilterPlan] = useState<string>('all');

    useEffect(() => {
        fetchUsers();
    }, [filterPlan]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            let url = '/api/admin/users?';
            if (filterPlan !== 'all') url += `plan=${filterPlan}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, isSuperAdmin: boolean) => {
        if (!confirm(`Are you sure you want to ${isSuperAdmin ? 'promote' : 'demote'} this user?`)) return;

        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isSuperAdmin })
            });

            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePasswordReset = async (userId: string) => {
        if (!confirm("Send password reset email?")) return;

        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            await fetch(`/api/admin/users/${userId}/reset-password`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert("Reset email sent.");
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to deactivate/delete this user? This action is typically irreversible.")) return;

        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-[var(--font-main)] text-[var(--color-text)]">User Management</h1>
                    <p className="text-[var(--color-text-secondary)]">Manage accounts, roles, and access.</p>
                </div>
                <div className="flex gap-2">
                    <select
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm"
                        value={filterPlan}
                        onChange={(e) => setFilterPlan(e.target.value)}
                    >
                        <option value="all">All Plans</option>
                        <option value="free">Free</option>
                        <option value="active">Active (Paid)</option>
                        <option value="practitioner">Practitioner</option>
                    </select>
                    <Button onClick={fetchUsers} disabled={loading} variant="outline" size="sm">
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-[var(--color-text)]">
                        <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">User</th>
                                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Plan</th>
                                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Role</th>
                                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Joined</th>
                                <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold mr-3">
                                                {u.full_name?.[0] || u.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium">{u.full_name || 'No Name'}</div>
                                                <div className="text-[var(--color-text-secondary)] text-xs">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${u.subscription_status === 'active' || u.subscription_status === 'practitioner' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                            {u.subscription_status?.toUpperCase() || 'FREE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {u.is_super_admin ? (
                                            <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full w-fit">
                                                <Shield size={12} className="mr-1" /> SUPER ADMIN
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-500">User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[var(--color-text-secondary)]">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleUpdateRole(u.id, !u.is_super_admin)}>
                                                    {u.is_super_admin ? 'Revoke Super Admin' : 'Make Super Admin'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handlePasswordReset(u.id)}>
                                                    <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDelete(u.id)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Deactivate User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

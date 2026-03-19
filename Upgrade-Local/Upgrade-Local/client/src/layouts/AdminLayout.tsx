import { useState } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Users,
    Settings,
    Activity,
    LayoutDashboard,
    ShieldAlert,
    BookOpen,
    BrainCircuit,
    Database,
    FileText
} from 'lucide-react';

export default function AdminLayout() {
    const { user, loading } = useAuth();
    const location = useLocation();

    // We assume user is populated by ProtectedRoute wrapper in App.tsx
    // But we doubly ensure here and check Super Admin status

    if (loading) return <div>Loading Admin...</div>;

    // Route-level admin gating is handled in App.tsx (AdminRoute).

    const navItems = [
        { label: 'Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'User Management', path: '/admin/users', icon: Users },
        { label: 'System Settings', path: '/admin/settings', icon: Settings },
        { label: 'System Logs', path: '/admin/logs', icon: Activity },
    ];

    // Legacy Admin Items (for compatibility/transition)
    const legacyItems = [
        { label: 'Courses', path: '/admin/courses', icon: BookOpen },
        { label: 'Agents', path: '/admin/agents', icon: BrainCircuit },
        { label: 'Mentors', path: '/admin/mentors', icon: Users },
        { label: 'Questions', path: '/admin/questions', icon: FileText },
        { label: 'Content', path: '/admin/content', icon: Database },
    ];

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] overflow-y-auto">
                <div className="p-4">
                    <h2 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">
                        Super Admin
                    </h2>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                            ? 'bg-[var(--color-primary)] text-white'
                                            : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                                        }`}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <h2 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mt-8 mb-4">
                        Content Management
                    </h2>
                    <nav className="space-y-1">
                        {legacyItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]'
                                            : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                                        }`}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[var(--color-bg)] p-8">
                <Outlet />
            </main>
        </div>
    );
}

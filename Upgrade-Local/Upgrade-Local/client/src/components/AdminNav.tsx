import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    UserCircle,
    Bot,
    Settings,
    HelpCircle
} from 'lucide-react';

const adminLinks = [
    { path: '/admin', label: 'Hub', icon: LayoutDashboard },
    { path: '/admin/courses', label: 'Courses', icon: BookOpen },
    { path: '/admin/mentors', label: 'Mentors', icon: UserCircle },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/agents', label: 'Agents', icon: Bot },
    { path: '/admin/questions', label: 'Questions', icon: HelpCircle },
    { path: '/admin/content', label: 'Content', icon: Bot },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminNav() {
    const location = useLocation();

    return (
        <nav className="bg-[var(--color-surface)] border-b border-[var(--color-border)] mb-6">
            <div className="max-w-[1400px] mx-auto px-6 py-2">
                <div className="flex items-center gap-1 overflow-x-auto">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-400 mr-2">Admin:</span>
                    {adminLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wide rounded transition-colors ${isActive
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)]'
                                    }`}
                            >
                                <Icon size={14} />
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}

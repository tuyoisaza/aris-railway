import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sun, Moon, User, Globe, CreditCard, Download } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

export default function Profile() {
    const { user } = useAuth();
    const { theme, setTheme } = useGlobal();
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'agora', label: 'Agora', icon: Globe },
        { id: 'subscription', label: 'Subscription', icon: CreditCard },
        { id: 'data_export', label: 'Data Export', icon: Download },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-20">
            <div className="max-w-5xl mx-auto px-6 py-10">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <Button variant="ghost" className="p-0 hover:bg-transparent text-[var(--color-text)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                        </Button>
                        <h1 className="text-3xl font-bold text-[var(--color-text)] font-[family-name:var(--font-main)]">Account</h1>
                    </div>
                    <p className="text-[var(--color-text-secondary)]">Manage your profile and preferences</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all
                                    ${isActive
                                        ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]'}
                                `}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Profile Content */}
                {activeTab === 'profile' && (
                    <div className="space-y-6">

                        {/* User Card */}
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-sm)] flex flex-col md:flex-row items-start md:items-center gap-8">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || ''} />
                                <AvatarFallback className="text-3xl font-bold bg-[var(--color-primary)] text-white">
                                    {user?.email?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-2">
                                <h2 className="text-2xl font-bold text-[var(--color-text)]">{user?.user_metadata?.full_name || 'User'}</h2>
                                <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
                                    <span>Age: 47</span>
                                    <span>Joined: 27/12/2025</span>
                                </div>
                                <div className="text-[var(--color-text-secondary)]">{user?.email}</div>
                                <div className="pt-2">
                                    <span className="inline-block px-3 py-1 bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider rounded-full">
                                        Student
                                    </span>
                                </div>
                            </div>

                            <Button variant="outline" className="border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text)]">
                                Edit
                            </Button>
                        </div>

                        {/* Preferences Card */}
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-sm)]">
                            <h3 className="text-lg font-bold text-[var(--color-text)] mb-6">Preferences</h3>

                            {/* Theme Toggle */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`
                                        flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all
                                        ${theme === 'light'
                                            ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]'
                                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'}
                                    `}
                                >
                                    <Sun className="w-8 h-8" />
                                    <span className="font-medium">Light</span>
                                </button>

                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`
                                        flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all
                                        ${theme === 'dark'
                                            ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]'
                                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'}
                                    `}
                                >
                                    <Moon className="w-8 h-8" />
                                    <span className="font-medium">Dark</span>
                                </button>
                            </div>

                            {/* Language */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-[var(--color-text)]">Language</h4>
                                <div className="w-full md:w-1/2">
                                    <LanguageSelector />
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}

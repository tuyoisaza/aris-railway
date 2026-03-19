import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Axis {
    id: string;
    title_key: string;
    desc_key: string;
    sort_order: number;
}

interface UserTestProgress {
    score: number;
    levelTitle: string;
    completedAt: string;
}

interface UserData {
    profile: any;
    tests: Record<string, UserTestProgress>;
    journal: any[];
    subscription: any;
}

export default function Dashboard() {
    const { user, session, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [axes, setAxes] = useState<Axis[]>([]);

    useEffect(() => {
        if (authLoading) return;

        async function fetchData() {
            const token = session?.access_token;
            if (!token) {
                // Should be handled by ProtectedRoute, but safety check
                return;
            }

            const headers = { 'Authorization': `Bearer ${token}` };

            // 0. Check for invite claim
            const inviteCode = localStorage.getItem('invite_code');
            if (inviteCode) {
                console.log("Claiming invite:", inviteCode);
                try {
                    const res = await fetch('/api/invites/claim', {
                        method: 'POST',
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: inviteCode })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        alert(`Invite Claimed: ${data.message || 'Success'}`); // Replace with Toast later
                    } else {
                        console.warn("Invite Claim Failed:", data.error);
                    }
                } catch (e) {
                    console.error("Invite claim exception", e);
                } finally {
                    localStorage.removeItem('invite_code');
                }
            }

            try {
                // Parallel API calls
                const [userRes, axesRes] = await Promise.all([
                    fetch('/api/user', { headers }),
                    fetch('/api/axes') // Public
                ]);

                if (userRes.ok && axesRes.ok) {
                    const uData = await userRes.json();
                    const aData = await axesRes.json();
                    setUserData(uData);
                    setAxes(aData);
                }
            } catch (err) {
                console.error("Dashboard Load Error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [session, authLoading]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center font-mono">
                LOADING UPGRADE OS...
            </div>
        );
    }

    return (
        <div className="brutal-container py-12">
            <header className="brutal-header mb-12">
                <div>
                    <h1 className="brutal-title text-4xl mb-2 text-[var(--color-text)]">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="brutal-badge">{t('dashboard_status')}</span>
                        <span className="text-sm text-[var(--color-text-secondary)]">ID: {user?.id.substring(0, 8)}</span>
                    </div>
                </div>

                <Card className="brutal-card p-4 min-w-[200px] bg-[var(--color-surface)] border-[var(--color-border)]">
                    <div className="text-xs text-[var(--color-text-tertiary)] uppercase">{t('dashboard_current_level')}</div>
                    <div className="text-xl font-bold text-[var(--color-primary)]">
                        {userData?.tests && Object.keys(userData.tests).length > 0
                            ? t('dashboard_level_in_progress')
                            : t('dashboard_level_uninitiated')}
                    </div>
                </Card>
            </header>

            {/* SECTION: ASSESSMENTS (THE 3 TESTS) */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold uppercase mb-6 flex items-center gap-2 text-[var(--color-text)]">
                    <span className="w-4 h-4 bg-[var(--color-primary)] block"></span>
                    {t('dashboard_self_diagnostics')}
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {axes.map(axis => {
                        const progress = userData?.tests?.[axis.id];
                        const isDone = !!progress;

                        return (
                            <Card key={axis.id} className={`brutal-card flex flex-col ${isDone ? 'bg-[var(--color-surface)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="bg-[var(--color-primary)] text-white text-xs py-1 px-2 mb-2 inline-block uppercase">
                                            {t('dashboard_axis')} {axis.sort_order}
                                        </div>
                                        {isDone && <span className="text-xl">✅</span>}
                                    </div>
                                    <CardTitle className="uppercase text-xl text-[var(--color-text)]">{axis.title_key.replace('axis_', '')}</CardTitle>
                                    <CardDescription className="opacity-80 text-[var(--color-text-secondary)]">
                                        {isDone
                                            ? `${t('dashboard_completed_on')} ${new Date(progress.completedAt).toLocaleDateString()}`
                                            : t('dashboard_pending')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    {isDone ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-[var(--color-text)]">
                                                <span>{t('dashboard_score')}</span>
                                                <span className="font-bold">{progress.score}/100</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-[var(--color-text)]">
                                                <span>{t('dashboard_level')}</span>
                                                <span className="font-bold text-[var(--color-primary)]">{progress.levelTitle}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[var(--color-text-secondary)] italic">
                                            {t('dashboard_diagnostic_desc')}
                                        </p>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className={`w-full brutal-btn ${!isDone ? 'primary' : ''}`}
                                        onClick={() => navigate(`/test/${axis.id}`)}
                                    >
                                        {isDone ? t('dashboard_retake') : t('dashboard_start')}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* SECTION: JOURNAL */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold uppercase mb-6 flex items-center gap-2 text-[var(--color-text)]">
                    <span className="w-4 h-4 bg-slate-400 block"></span>
                    Decision Journal
                </h2>
                <Card className="brutal-card bg-[var(--color-surface)] border-dashed border-[var(--color-border)]">
                    <CardContent className="py-12 text-center">
                        <p className="text-[var(--color-text-secondary)] mb-4">{t('journal_no_entries_dashboard')}</p>
                        <Button variant="outline" className="brutal-btn" onClick={() => navigate('/journal')}>
                            {t('journal_log_new')}
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

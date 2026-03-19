import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import JournalInsights from '@/components/Journal/JournalInsights';
import { useSearchParams } from 'react-router-dom';

export default function Journal() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [decision, setDecision] = useState('');
    const [context, setContext] = useState('');
    const [outcome, setOutcome] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEntries();

        // Check for URL params to pre-fill (e.g. starting a project from a course)
        const paramTitle = searchParams.get('title');
        const paramContext = searchParams.get('context');

        if (paramTitle) setDecision(paramTitle);
        if (paramContext) setContext(paramContext);
        if (paramTitle && paramContext) {
            // Optional: Pre-fill outcome prompt for projects
            setOutcome('Goal: Execute this micro-practice daily for 7 days. \nSuccess Criteria: Observable shift in behavior.');
        }
    }, [searchParams]);

    const fetchEntries = async () => {
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) return;

            const res = await fetch('/api/user', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEntries(data.journal || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;

            const res = await fetch('/api/user/journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    decision,
                    context,
                    outcome,
                    reviewDate: new Date().toISOString()
                })
            });

            if (res.ok) {
                setDecision('');
                setContext('');
                setOutcome('');
                fetchEntries();
            }
        } catch (e) {
            alert('Failed to save entry');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-12 px-4 md:px-6">
            <header className="mb-10 text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Decision Journal</h1>
                <p className="text-muted-foreground">Log your decisions. Calibrate over time.</p>
            </header>

            <JournalInsights />

            <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div>
                    <Card className="bg-card/50 backdrop-blur border-border/50">
                        <CardHeader>
                            <h2 className="font-semibold text-lg tracking-tight">New Entry</h2>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Decision</label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={decision}
                                        onChange={e => setDecision(e.target.value)}
                                        placeholder="What decision are you making?"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Context</label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        rows={3}
                                        value={context}
                                        onChange={e => setContext(e.target.value)}
                                        placeholder="What is the situation?"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Expected Outcome</label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        rows={3}
                                        value={outcome}
                                        onChange={e => setOutcome(e.target.value)}
                                        placeholder="What do you expect to happen?"
                                        required
                                    />
                                </div>
                                <Button className="w-full" disabled={submitting}>
                                    {submitting ? 'Logging...' : 'Log Decision'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h2 className="font-semibold text-lg tracking-tight mb-4 flex items-center gap-2">History</h2>
                    <div className="space-y-4">
                        {entries.map((entry: any) => (
                            <Card key={entry.id} className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-medium">{entry.decision}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{new Date(entry.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{entry.context}</p>
                                </CardContent>
                            </Card>
                        ))}
                        {entries.length === 0 && !loading && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No entries recorded yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

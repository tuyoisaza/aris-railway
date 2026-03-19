import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalysisData {
    trends: string[];
    insight: string;
}

export default function JournalInsights() {
    const { session } = useAuth();
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalysis() {
            try {
                const res = await fetch('/api/analytics/journal', {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (e) {
                console.error("Failed to fetch analytics", e);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalysis();
    }, [session]);

    if (loading) return <div className="text-sm text-zinc-500 animate-pulse">Generating insights...</div>;
    if (!data) return null;

    // Mock chart data for visualization (real data would come from analysis if structured)
    const chartData = [
        { day: 'Mon', clarity: 65 },
        { day: 'Tue', clarity: 50 },
        { day: 'Wed', clarity: 80 },
        { day: 'Thu', clarity: 75 },
        { day: 'Fri', clarity: 90 },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* AI Insight Card */}
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-indigo-400 flex items-center gap-2">
                        <Sparkles size={16} />
                        AI Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm mb-4 leading-relaxed text-zinc-300">
                        {data.insight}
                    </p>
                    <div className="space-y-2">
                        {data.trends.map((trend, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-zinc-400 bg-zinc-800/50 p-2 rounded">
                                <TrendingUp size={12} className="mt-0.5 text-emerald-500" />
                                {trend}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Visual Trends Card */}
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                        <TrendingUp size={16} />
                        Decision Clarity Trend
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                            <YAxis stroke="#71717a" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="clarity" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

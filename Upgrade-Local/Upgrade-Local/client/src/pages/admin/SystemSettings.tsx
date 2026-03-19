import { useState, useEffect } from 'react';
import { useGlobal } from '@/context/GlobalContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch'; // Assuming we have shadcn switch, or standard input
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Terminal, RefreshCw, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Helper for UI Switch if not present
function Toggle({ checked, onCheckedChange, label }: { checked: boolean; onCheckedChange: (c: boolean) => void; label: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[var(--color-text)] font-medium">{label}</span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2
                    ${checked ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}
                `}
            >
                <span
                    aria-hidden="true"
                    className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                        ${checked ? 'translate-x-5' : 'translate-x-0'}
                    `}
                />
            </button>
        </div>
    );
}

export default function AdminSettings() {
    const { debugMode, toggleDebugMode } = useGlobal(); // GlobalContext state (local mirror)
    const [serverDebugMode, setServerDebugMode] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);

    // Log Viewer State
    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            // Protected Admin API
            const { data, error } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            const res = await fetch('/api/admin/system/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const settings = await res.json();
            if (settings.debug_mode !== undefined) {
                setServerDebugMode(settings.debug_mode);
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        }
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            const res = await fetch('/api/admin/system/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    settings: {
                        debug_mode: serverDebugMode
                    }
                })
            });

            if (res.ok) {
                alert("Settings saved successfully.");
                // Update Global Context to match
                // We might need to force a refresh on the context or just wait for next poll
                // Since context pulls from /api/settings (public), it should eventually sync.
                // But let's verify.
            } else {
                alert("Failed to save settings.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            // Wait, I created /api/admin/system/logs? The routes file admin.routes.ts had /system/settings.
            // But checking admin.routes.ts... 
            // I created /users, /users/:id..., /system/settings (GET/PUT).
            // I DID NOT create /system/logs in admin.routes.ts!
            // I MISSED IT in the admin.routes.ts step.
            // I need to add it.
            // For now, let's implement the UI and I'll go back and fix the backend route.

            const res = await fetch('/api/admin/system/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLogsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-[var(--font-main)] text-[var(--color-text)]">System Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configuration Card */}
                <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings size={20} /> Global Configuration
                        </CardTitle>
                        <CardDescription>Control system-wide behaviors.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)]">
                            <Toggle
                                label="Global Debug Mode"
                                checked={serverDebugMode}
                                onCheckedChange={setServerDebugMode}
                            />
                            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                                When enabled, detailed system logs are recorded and debug tools are visible in the UI.
                                <span className="font-bold text-amber-500 block mt-1">⚠️ Performance Impact: High</span>
                            </p>
                        </div>

                        <Button
                            onClick={handleSaveSettings}
                            disabled={loading}
                            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
                        >
                            <Save size={16} className="mr-2" />
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </CardContent>
                </Card>

                {/* System Logs Viewer */}
                <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-sm flex flex-col h-[500px]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Terminal size={20} /> System Logs
                            </CardTitle>
                            <CardDescription>View recent system activity.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={logsLoading}>
                            <RefreshCw size={16} className={logsLoading ? 'animate-spin' : ''} />
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0 relative">
                        <div className="bg-slate-950 text-slate-200 font-mono text-xs p-4 h-full overflow-y-auto w-full absolute inset-0">
                            {logs.length === 0 ? (
                                <div className="text-slate-500 italic">No logs found or fetch required.</div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className="mb-2 border-b border-slate-800 pb-1">
                                        <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className={`mx-2 font-bold ${log.level === 'error' ? 'text-red-400' :
                                                log.level === 'warn' ? 'text-amber-400' :
                                                    'text-blue-400'
                                            }`}>
                                            {log.level.toUpperCase()}
                                        </span>
                                        <span className="text-slate-300">{log.action}</span>
                                        {log.details && (
                                            <pre className="mt-1 text-slate-600 overflow-x-auto">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { Settings } from 'lucide-react';

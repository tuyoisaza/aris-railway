import { useGlobal, LogEntry } from '@/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import AdminNav from '@/components/AdminNav';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export default function AdminLogs() {
    const { debugMode, toggleDebugMode, logs, clearLogs } = useGlobal();

    const getLevelColor = (level: LogEntry['level']) => {
        switch (level) {
            case 'error': return 'text-red-500';
            case 'warn': return 'text-amber-500';
            case 'debug': return 'text-blue-500';
            default: return 'text-[var(--color-text)]';
        }
    };

    return (
        <>
            <AdminNav />
            <div className="brutal-container py-12">
                <header className="mb-12 border-b-4 border-[var(--color-border)] pb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="brutal-title text-4xl mb-2 text-[var(--color-text)]">System Logs</h1>
                            <p className="text-[var(--color-text-secondary)]">Audit Trails & Debug Controls</p>
                        </div>
                        {debugMode && logs.length > 0 && (
                            <Button variant="outline" onClick={clearLogs} className="border-red-500 text-red-500 hover:bg-red-50">
                                Clear Logs
                            </Button>
                        )}
                    </div>
                </header>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Debug Control Card */}
                    <Card className={`md:col-span-1 brutal-card ${debugMode ? 'border-[var(--color-primary)] bg-[var(--color-surface)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
                        <CardHeader>
                            <CardTitle className="uppercase text-xl flex items-center gap-2 text-[var(--color-text)]">
                                🔧 Debug Mode
                                {debugMode && <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-1 rounded">ACTIVE</span>}
                            </CardTitle>
                            <CardDescription className="text-[var(--color-text-secondary)]">
                                Controls visibility of development tools and bypasses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--color-text)]">Enable Dev Tools</span>
                                <button
                                    onClick={toggleDebugMode}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${debugMode ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${debugMode ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                            <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
                                When enabled, the "Dev Mode Bypass" button will be visible on the Login page, allowing access without Supabase auth.
                                <br /><br />
                                Also enables <strong>Verbose Logging</strong> below.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Console Logs Panel */}
                    <Card className="md:col-span-2 brutal-card bg-[var(--color-surface)] border-[var(--color-border)] h-[600px] flex flex-col">
                        <CardHeader className="border-b border-[var(--color-border)]">
                            <CardTitle className="uppercase text-xl text-[var(--color-text)] flex justify-between">
                                <span>Live Console Stream</span>
                                <span className="text-sm font-mono text-[var(--color-text-secondary)]">
                                    {logs.length} events
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden relative">
                            {!debugMode ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10 backdrop-blur-[1px]">
                                    <p className="text-[var(--color-text-secondary)] bg-[var(--color-surface)] px-4 py-2 rounded-lg border border-[var(--color-border)] shadow-sm">
                                        Enable Debug Mode to stream logs
                                    </p>
                                </div>
                            ) : null}

                            <div className="h-full overflow-auto p-4 font-mono text-xs space-y-1">
                                {logs.length === 0 ? (
                                    <div className="text-[var(--color-text-tertiary)] italic">Waiting for logs...</div>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="flex gap-2 hover:bg-black/5 p-1 rounded transition-colors">
                                            <span className="text-[var(--color-text-tertiary)] shrink-0">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className={`uppercase font-bold shrink-0 w-12 ${getLevelColor(log.level)}`}>
                                                [{log.level}]
                                            </span>
                                            <span className="text-[var(--color-text)] break-all">
                                                {log.message}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

import { useState, useEffect } from 'react';
import AdminNav from '@/components/AdminNav';
import { api } from '@/lib/api';

export default function AdminSettings() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const data = await api.admin.getStatus();
                setStatus(data);
            } catch (error) {
                console.error('Failed to load status:', error);
            } finally {
                setLoading(false);
            }
        };
        loadStatus();
    }, []);

    const handleClearCache = async () => {
        try {
            await api.admin.clearCache();
            alert('Cache cleared successfully');
        } catch (error) {
            console.error('Failed to clear cache:', error);
            alert('Failed to clear cache');
        }
    };

    const handleReload = async () => {
        if (confirm('This will restart the server. Continue?')) {
            try {
                await api.admin.reload();
                alert('Reload signal sent. Server will restart.');
            } catch (error) {
                // Expected - server restarts
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[var(--color-bg)] to-[var(--color-card)]">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <AdminNav />
                <div className="mt-8">
                    <h1 className="text-2xl font-bold mb-6">System Settings</h1>
                    
                    {/* Server Status */}
                    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Server Status</h2>
                        {loading ? (
                            <p className="text-[var(--color-text-secondary)]">Loading...</p>
                        ) : status ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-[var(--color-bg)] rounded-lg">
                                    <p className="text-sm text-[var(--color-text-secondary)]">Status</p>
                                    <p className="text-xl font-mono text-green-500">{status.status}</p>
                                </div>
                                <div className="p-4 bg-[var(--color-bg)] rounded-lg">
                                    <p className="text-sm text-[var(--color-text-secondary)]">Uptime</p>
                                    <p className="text-xl font-mono">{status.uptime}</p>
                                </div>
                                <div className="p-4 bg-[var(--color-bg)] rounded-lg">
                                    <p className="text-sm text-[var(--color-text-secondary)]">Node Version</p>
                                    <p className="text-xl font-mono">{status.nodeVersion}</p>
                                </div>
                                <div className="p-4 bg-[var(--color-bg)] rounded-lg">
                                    <p className="text-sm text-[var(--color-text-secondary)]">Memory (Heap)</p>
                                    <p className="text-xl font-mono">{Math.round(status.memory?.heapUsed / 1024 / 1024)}MB</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-red-500">Failed to load status</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6">
                        <h2 className="text-lg font-semibold mb-4">System Actions</h2>
                        <div className="flex gap-4">
                            <button
                                onClick={handleClearCache}
                                className="px-4 py-2 bg-amber-500/20 text-amber-600 rounded-lg hover:bg-amber-500/30 transition-colors"
                            >
                                Clear Cache
                            </button>
                            <button
                                onClick={handleReload}
                                className="px-4 py-2 bg-red-500/20 text-red-600 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                                Reload Server
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

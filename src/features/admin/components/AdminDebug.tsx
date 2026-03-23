import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { RefreshCw, Bug, Terminal, Clock, X, Plus } from 'lucide-react';

const DURATION_OPTIONS = [
    { label: '5 minutes', value: 5 },
    { label: '15 minutes', value: 15 },
    { label: '1 hour', value: 60 },
    { label: '4 hours', value: 240 },
];

const AdminDebug = () => {
    const [debugEnabled, setDebugEnabled] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [duration, setDuration] = useState(15);
    const [reason, setReason] = useState('');

    useEffect(() => {
        fetchDebugSettings();
    }, []);

    const fetchDebugSettings = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getDebugSettings();
            setDebugEnabled(data?.enabled || false);
            setSessions(data?.sessions || []);
        } catch (err) {
            console.error('[Admin/Debug] Error fetching debug settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        setActivating(true);
        try {
            await api.admin.activateDebug('ADMIN', duration, reason || 'Admin activated debug mode');
            setReason('');
            await fetchDebugSettings();
        } catch (err) {
            console.error('[Admin/Debug] Error activating debug:', err);
        } finally {
            setActivating(false);
        }
    };

    const handleDeactivate = async (sessionId?: string) => {
        try {
            await api.admin.deactivateDebug(sessionId);
            await fetchDebugSettings();
        } catch (err) {
            console.error('[Admin/Debug] Error deactivating debug:', err);
        }
    };

    const formatTimeRemaining = (expiresAt: string) => {
        const exp = new Date(expiresAt);
        const now = new Date();
        const diff = exp.getTime() - now.getTime();
        if (diff <= 0) return 'Expired';
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m remaining`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ${mins % 60}m remaining`;
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Debug Settings</h1>
                <button
                    onClick={fetchDebugSettings}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                    <div className="flex items-center gap-3">
                        <Bug size={24} />
                        <div>
                            <h3 className="font-semibold">Debug Mode</h3>
                            <p className="text-sm text-gray-500">
                                Enable detailed logging and debug information
                            </p>
                        </div>
                    </div>
                    {debugEnabled ? (
                        <button
                            onClick={() => handleDeactivate()}
                            className="px-6 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700"
                        >
                            Disable All
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-800">
                                Disabled
                            </span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full p-2 border rounded-lg"
                        >
                            {DURATION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Why are you enabling debug mode?"
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>
                </div>

                <button
                    onClick={handleActivate}
                    disabled={activating || debugEnabled}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium ${
                        activating || debugEnabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    <Plus size={16} />
                    {activating ? 'Activating...' : 'Activate Debug Session'}
                </button>

                {sessions.length > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock size={20} />
                            <h3 className="font-semibold">Active Sessions</h3>
                        </div>
                        <div className="space-y-3">
                            {sessions.map(session => (
                                <div key={session.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div>
                                        <div className="font-medium">{session.scope} Scope</div>
                                        <div className="text-sm text-gray-600">{session.reason || 'No reason provided'}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Expires: {formatTimeRemaining(session.expiresAt)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeactivate(session.id)}
                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Terminal size={20} />
                    <h3 className="font-semibold">Debug Features</h3>
                </div>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${debugEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        Verbose console logging
                    </li>
                    <li className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${debugEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        API request/response logging
                    </li>
                    <li className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${debugEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        Performance metrics display
                    </li>
                    <li className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${debugEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        Error stack traces
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default AdminDebug;
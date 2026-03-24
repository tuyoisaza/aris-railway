import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { API_URL } from '../../../services/api/base-client';
import { RefreshCw, Server, Download, Power, AlertTriangle, Terminal, Settings } from 'lucide-react';

const LOG_LEVELS = [
    { value: 0, label: 'None' },
    { value: 1, label: 'Alerts' },
    { value: 2, label: 'Log' },
    { value: 3, label: 'Verbose' },
];

const AdminSystemStatus = () => {
    const [services, setServices] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [logLevel, setLogLevel] = useState(3);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [isRestarting, setIsRestarting] = useState(false);
    const [restartStatus, setRestartStatus] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 2000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const servicesData = await api.admin.getServices();
            setServices(servicesData || []);
            await fetchLogs();
        } catch (err) {
            console.error('[Admin/SystemStatus] Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const logsData = await api.admin.getLogs();
            setLogs(logsData || []);
            const levelData = await api.admin.getLogLevel();
            if (levelData?.level !== undefined) setLogLevel(levelData.level);
        } catch (err) {
            console.error('[Admin/SystemStatus] Error fetching logs:', err);
        }
    };

    const changeLogLevel = async (level: number) => {
        try {
            await api.admin.setLogLevel(level);
            setLogLevel(level);
        } catch (err) {
            console.error('[Admin/SystemStatus] Error setting log level:', err);
        }
    };

    const handleRestart = async () => {
        if (!confirm('This will verify server connections. Proceed?')) return;
        setIsRestarting(true);
        setRestartStatus(null);
        try {
            const data = await api.admin.getRestartStatus();
            if (data?.success) {
                setRestartStatus(`Restart check complete. DB: ${data.status?.database}`);
            } else {
                setRestartStatus('Restart check completed with issues');
            }
        } catch (err) {
            setRestartStatus('Restart check failed');
        } finally {
            setIsRestarting(false);
        }
    };

    const handleClearCache = () => {
        if (!confirm('This will clear all local data (tokens, cache) and reload. You will need to log in again. Proceed?')) return;
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    const downloadLogs = () => {
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const downloadDatabaseDump = async () => {
        try {
            const headers = await import('../../../services/api/base-client').then(m => m.getHeaders());
            const res = await fetch(`${API_URL}/admin/systemstatus/dump`, { headers });
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `db-dump-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        } catch (err) {
            alert('Failed to download database dump');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading system status...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">System Status & Controls</h1>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Server size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">Services</h2>
                            <p className="text-sm text-gray-500">System components and their current status</p>
                        </div>
                    </div>
                </div>
                <div className="divide-y divide-gray-100">
                    {services.map((service: any, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                    service.status === 'operational' ? 'bg-green-500' :
                                    service.status === 'missing_config' ? 'bg-yellow-500' :
                                    'bg-red-500'
                                }`} />
                                <span className="font-medium text-gray-900">{service.name}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                service.status === 'operational' ? 'bg-green-100 text-green-700' :
                                service.status === 'missing_config' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {service.message}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Settings size={20} className="text-orange-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900">Server Controls</h2>
                        <p className="text-sm text-gray-500">Manage server and client state</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <button
                        onClick={downloadDatabaseDump}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        <Download size={18} />
                        Download DB
                    </button>
                    <button
                        onClick={handleClearCache}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-amber-700 rounded-lg font-medium hover:bg-amber-50 transition-colors"
                    >
                        <AlertTriangle size={18} />
                        Clear Cache
                    </button>
                    <button
                        onClick={handleRestart}
                        disabled={isRestarting}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                        <Power size={18} />
                        {isRestarting ? 'Checking...' : 'Restart Services'}
                    </button>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-600">Log Level:</span>
                        <select
                            value={logLevel}
                            onChange={(e) => changeLogLevel(parseInt(e.target.value))}
                            className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        >
                            {LOG_LEVELS.map(level => (
                                <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {restartStatus && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                        {restartStatus}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                                <Terminal size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">System Logs</h2>
                                <p className="text-sm text-gray-500">Recent server log entries</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={e => setAutoRefresh(e.target.checked)}
                                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                Auto-refresh
                            </label>
                            <button
                                onClick={downloadLogs}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                <Download size={14} />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
                <div className="max-h-96 overflow-y-auto bg-gray-900 text-gray-100 p-4 font-mono text-xs">
                    {logs.length === 0 ? (
                        <div className="text-gray-500 text-center py-8">No logs available</div>
                    ) : (
                        logs.map((log: any, i) => (
                            <div key={i} className="mb-1 pb-1 border-b border-gray-800">
                                <span className="text-gray-500 mr-2">
                                    [{new Date(log.timestamp).toLocaleTimeString()}]
                                </span>
                                {log.module && (
                                    <span className="text-blue-400 font-semibold mr-2">
                                        [{log.module}]
                                    </span>
                                )}
                                <span className={`font-semibold mr-2 ${
                                    log.severity === 'ERROR' ? 'text-red-400' :
                                    log.severity === 'WARN' ? 'text-yellow-400' :
                                    log.severity === 'DEBUG' ? 'text-gray-500' :
                                    'text-green-400'
                                }`}>
                                    [{log.severity}]
                                </span>
                                {log.context && (
                                    <span className="text-gray-400 mr-2">
                                        [{log.context}]
                                    </span>
                                )}
                                <span className={log.severity === 'ERROR' ? 'text-red-300' : 'text-gray-300'}>
                                    {log.message}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSystemStatus;

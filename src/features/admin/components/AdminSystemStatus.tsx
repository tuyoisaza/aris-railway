import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { RefreshCw, Server, Download, Power } from 'lucide-react';

const AdminSystemStatus = () => {
    const [services, setServices] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [logLevel, setLogLevel] = useState(3);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

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
        } catch (err) {
            console.error('[Admin/SystemStatus] Error fetching services:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const logsData = await api.admin.getLogs();
            setLogs(logsData || []);
            const levelData = await api.admin.getLogLevel();
            if (levelData?.level) setLogLevel(levelData.level);
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

    const downloadLogs = () => {
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString()}.json`;
        a.click();
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">System Status</h1>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Server size={20} />
                        <h2 className="text-lg font-semibold">Services</h2>
                    </div>
                    <div className="space-y-3">
                        {services.map((service: any, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium">{service.name}</span>
                                <span className={`px-3 py-1 rounded-full text-sm ${
                                    service.status === 'operational' ? 'bg-green-100 text-green-800' :
                                    service.status === 'missing_config' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {service.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Power size={20} />
                        <h2 className="text-lg font-semibold">Server Controls</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">Log Level</span>
                            <div className="flex gap-2 mt-2">
                                {[0, 1, 2, 3].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => changeLogLevel(level)}
                                        className={`px-3 py-1 rounded ${
                                            logLevel === level ? 'bg-blue-600 text-white' : 'bg-gray-200'
                                        }`}
                                    >
                                        {['None', 'Alerts', 'Log', 'Verbose'][level]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">System Logs</h2>
                    <div className="flex gap-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={e => setAutoRefresh(e.target.checked)}
                            />
                            Auto-refresh
                        </label>
                        <button
                            onClick={downloadLogs}
                            className="flex items-center gap-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className="max-h-96 overflow-y-auto font-mono text-sm bg-gray-900 text-gray-100 p-4 rounded-lg">
                    {logs.map((log: any, i) => (
                        <div key={i} className="mb-1">
                            <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                            <span className={`${
                                log.severity === 'ERROR' ? 'text-red-400' :
                                log.severity === 'WARN' ? 'text-yellow-400' :
                                log.severity === 'DEBUG' ? 'text-gray-400' :
                                'text-green-400'
                            }`}>[{log.severity}]</span>{' '}
                            <span className="text-blue-400">[{log.module}]</span> {log.message}
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-gray-500">No logs available</div>}
                </div>
            </div>
        </div>
    );
};

export default AdminSystemStatus;

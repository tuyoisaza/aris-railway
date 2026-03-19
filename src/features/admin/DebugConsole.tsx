import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Terminal, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';

const DebugConsole = () => {
    const [debugEnabled, setDebugEnabled] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [logLevel, setLogLevel] = useState(3);

    useEffect(() => {
        fetchDebugStatus();
        fetchLogs();
        fetchLogLevel();
    }, []);

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 2000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const fetchDebugStatus = async () => {
        const data = await api.admin.getDebugSettings();
        setDebugEnabled(data.global_debug);
    };

    const fetchLogs = async () => {
        try {
            // Use legacy logs endpoint as requested by user ("what works in LOGS")
            const data = await api.admin.getLogs();
            if (Array.isArray(data)) {
                setLogs(data);
            }
        } catch (err) {
            console.error('Failed to fetch logs', err);
        }
    };

    const fetchLogLevel = async () => {
        try {
            const data = await api.admin.getLogLevel();
            setLogLevel(data.level);
        } catch (err) {
            console.error(err);
        }
    };

    const changeLogLevel = async (newLevel) => {
        try {
            const data = await api.admin.setLogLevel(parseInt(newLevel));
            if (data.success) {
                setLogLevel(data.level);
                fetchLogs();
            }
        } catch (err) {
            alert('Failed to set log level');
        }
    };

    const toggleDebug = async () => {
        setLoading(true);
        try {
            const newVal = !debugEnabled;
            await api.admin.setDebugMode(newVal);
            setDebugEnabled(newVal);

            if (newVal) {
                localStorage.setItem('aris_debug_token', 'true');
            } else {
                localStorage.removeItem('aris_debug_token');
            }
        } catch (e) {
            alert(`Failed to update debug mode: ${e.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #ddd' }}>
                <div>
                    <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={20} color={debugEnabled ? '#ef4444' : '#666'} />
                        Global Debug Mode
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                        When enabled, detailed system logs are captured and Debug UI is visible.
                    </p>
                </div>
                <div>
                    <button
                        onClick={toggleDebug}
                        disabled={loading}
                        style={{
                            padding: '8px 24px',
                            borderRadius: '20px',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            background: debugEnabled ? '#ef4444' : '#e5e7eb',
                            color: debugEnabled ? '#fff' : '#374151',
                            transition: 'all 0.2s'
                        }}
                    >
                        {debugEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Terminal size={18} /> System Logs</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <select
                        value={logLevel}
                        onChange={(e) => changeLogLevel(e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}
                    >
                        <option value="0">NO LOG (0)</option>
                        <option value="1">JUST ALERTS (1)</option>
                        <option value="2">LOG (2)</option>
                        <option value="3">VERBOSE (3)</option>
                    </select>

                    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
                        Auto-Refresh
                    </label>
                    <button onClick={fetchLogs} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}><RefreshCw size={14} /></button>
                    <button
                        onClick={() => setLogs([])}
                        style={{ padding: '4px 8px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div style={{
                background: '#1e1e1e',
                color: '#d1d5db',
                fontFamily: 'monospace',
                fontSize: '12px',
                borderRadius: '8px',
                height: '600px',
                overflowY: 'auto',
                padding: '16px',
                border: '1px solid #374151'
            }}>
                {logs.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>No logs available.</div>
                ) : (
                    logs.map((log, i) => {
                        // Adapter for Legacy Log format
                        // Expected: severity, message, timestamp, context, module
                        let color = '#d1d5db';
                        if (log.severity === 'ERROR') color = '#ef4444';
                        if (log.severity === 'WARN') color = '#f59e0b';
                        if (log.severity === 'DEBUG') color = '#9ca3af';

                        return (
                            <div key={i} style={{ marginBottom: '4px', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
                                <span style={{ color: '#6b7280', marginRight: '8px' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                {log.module && <span style={{ color: '#3b82f6', fontWeight: 'bold', width: '60px', display: 'inline-block' }}>[{log.module}]</span>}
                                <span style={{ color: color, fontWeight: 'bold', width: '60px', display: 'inline-block' }}>{log.severity}</span>
                                {log.context && <span style={{ color: '#a8a29e', marginRight: '8px' }}>[{log.context}]</span>}
                                <span style={{ color: color }}>{log.message}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DebugConsole;

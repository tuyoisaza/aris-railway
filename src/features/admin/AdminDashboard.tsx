import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import BadgeManager from './BadgeManager';
import ActionsTab from './ActionsTab';
import UserManagement from './UserManagement';
import DebugConsole from './DebugConsole';
import { Activity, Server, RefreshCw, Power, Download, FileText, AlertTriangle, Info, Bug, Award, Zap, Users, Terminal } from 'lucide-react'; // Assuming lucide-react is installed

const AGENTS = [
    { id: 'teacher', name: 'The Teacher' },
    { id: 'cartographer', name: 'The Cartographer (Chat)' },
    { id: 'cartographer_rel', name: 'The Cartographer (Map)' },
    { id: 'librarian', name: 'The Librarian' },
    { id: 'scout', name: 'The Scout' },
    { id: 'thoth', name: 'Thoth: The Organizer' }
];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [prompts, setPrompts] = useState({});
    const [activeAgent, setActiveAgent] = useState('teacher');
    const [activeTab, setActiveTab] = useState('agents');    // State for services
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRestarting, setIsRestarting] = useState(false);

    // State for Agent Testing
    const [editedPrompt, setEditedPrompt] = useState('');
    const [editedInstruction, setEditedInstruction] = useState(''); // New State for Instruction/Reply Format
    const [editedModel, setEditedModel] = useState('gpt-4o');
    const [editedTemp, setEditedTemp] = useState<string | number>(0.7);

    // Test Chat State
    const [testMessage, setTestMessage] = useState('');
    const [testHistory, setTestHistory] = useState([]); // Array of {role, content}
    const [testing, setTesting] = useState(false);

    // Logs State
    const [logs, setLogs] = useState([]);
    const [logLevel, setLogLevel] = useState(3); // Default Verbose
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        if (activeTab === 'agents') fetchPrompts();
        if (activeTab === 'status') fetchServices();
        if (activeTab === 'logs') {
            fetchLogs();
            fetchLogLevel();
        }
    }, [activeTab]);

    useEffect(() => {
        let interval;
        if (activeTab === 'logs' && autoRefresh) {
            interval = setInterval(fetchLogs, 2000);
        }
        return () => clearInterval(interval);
    }, [activeTab, autoRefresh]);

    useEffect(() => {
        if (prompts[activeAgent]) {
            setEditedPrompt(prompts[activeAgent].prompt_text || '');
            setEditedInstruction(prompts[activeAgent].instruction_text || '');
            setEditedModel(prompts[activeAgent].model || 'gpt-4o');
            setEditedTemp(prompts[activeAgent].temperature || 0.7);
            setTestHistory([]); // Reset history when switching agents
        }
    }, [activeAgent, prompts]);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getPrompts();
            const promptMap = {};
            if (Array.isArray(data)) {
                data.forEach(p => promptMap[p.agent_id] = p);
            }
            setPrompts(promptMap);
        } catch (err) {
            console.error(err);
            alert('Failed to load prompts');
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getServices();
            if (Array.isArray(data)) {
                setServices(data);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to check services');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
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

    const handleRestart = async () => {
        if (!confirm("This will reload server configuration and verify connections. Proceed?")) return;

        setIsRestarting(true);
        try {
            const data = await api.admin.restart();
            if (data.success) {
                alert(`Soft restart complete.\nDB Status: ${data.status.database}`);
                fetchServices();
            } else {
                alert('Restart failed: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error communicating with backend");
        } finally {
            setIsRestarting(false);
        }
    };

    const handleClearCache = () => {
        if (!confirm("This will clear all local data (tokens, cache) and reload the application. You will likely need to log in again. Proceed?")) return;
        localStorage.clear();
        sessionStorage.clear();
        // Maybe keep a specific flag if needed, but 'clear all' is safest for 'cache clearing' request
        window.location.reload();
    };

    const handleSave = async () => {
        try {
            await api.admin.updatePrompt(activeAgent, {
                prompt_text: editedPrompt,
                instruction_text: editedInstruction,
                model: editedModel,
                temperature: parseFloat(editedTemp.toString())
            });
            alert('Prompt saved!');
            fetchPrompts();
        } catch (err) {
            alert('Error saving prompt');
        }
    };

    const handleTest = async (e) => {
        e.preventDefault();
        setTesting(true);

        const currentMessage = testMessage;
        const newHistory = [...testHistory, { role: 'user', content: testMessage }];
        setTestHistory(newHistory);
        setTestMessage('');

        try {
            const data = await api.admin.chatTest(activeAgent, currentMessage, testHistory);

            if (data.response) {
                setTestHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
            } else if (data.error) {
                setTestHistory(prev => [...prev, { role: 'system', content: `Error: ${data.error}` }]);
            }
        } catch (err) {
            setTestHistory(prev => [...prev, { role: 'system', content: `Error: ${err.message}` }]);
        } finally {
            setTesting(false);
        }
    };

    if (loading) return <div style={{ padding: 40 }}>Loading Admin...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Agent Brain Console</h1>
                    <p style={{ color: '#666' }}>Manage system prompts and services.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', background: '#f5f5f5', padding: '4px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setActiveTab('agents')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: activeTab === 'agents' ? '#fff' : 'transparent',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'agents' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Agents
                    </button>
                    <button
                        onClick={() => setActiveTab('actions')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: activeTab === 'actions' ? '#fff' : 'transparent',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: activeTab === 'actions' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        <Zap size={16} /> Actions
                    </button>
                    <button
                        onClick={() => setActiveTab('status')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: activeTab === 'status' ? '#fff' : 'transparent',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'status' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        System Status
                    </button>

                    <button
                        onClick={() => setActiveTab('badges')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: activeTab === 'badges' ? '#fff' : 'transparent',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'badges' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Badges
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: activeTab === 'users' ? '#fff' : 'transparent',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: activeTab === 'users' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        <Users size={16} /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('debug')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: activeTab === 'debug' ? '#fff' : 'transparent',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: activeTab === 'debug' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        <Terminal size={16} /> Debug
                    </button>
                    <div style={{ width: '1px', background: '#ccc', margin: '0 4px' }}></div>
                    <button
                        onClick={() => navigate('/guided-actions')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: 'transparent',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: '#F97316'
                        }}
                    >
                        Guided Actions &rarr;
                    </button>
                </div>
            </div>

            {activeTab === 'actions' && <ActionsTab />}
            {activeTab === 'badges' && <BadgeManager />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'debug' && <DebugConsole />}


            {activeTab === 'status' && (
                <div style={{ maxWidth: '800px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px' }}>
                        <button
                            onClick={fetchServices}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            <RefreshCw size={16} /> Refresh
                        </button>
                        <button
                            onClick={() => window.open('http://localhost:3000/api/admin/dump')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', color: '#333' }}
                        >
                            <Download size={16} /> Download DB
                        </button>
                        <button
                            onClick={handleClearCache}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', color: '#B45309' }}
                        >
                            <AlertTriangle size={16} /> Clear Client Cache
                        </button>
                        <button
                            onClick={handleRestart}
                            disabled={isRestarting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                background: isRestarting ? '#eee' : '#fee2e2',
                                color: isRestarting ? '#888' : '#ef4444',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isRestarting ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            <Power size={16} /> {isRestarting ? 'Restarting...' : 'Restart Services'}
                        </button>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #ddd' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Service Name</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Status</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Message</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((service, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '16px', fontWeight: '500' }}>{service.name}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                background: service.status === 'operational' ? '#dcfce7' : '#fee2e2',
                                                color: service.status === 'operational' ? '#166534' : '#991b1b'
                                            }}>
                                                {service.status === 'operational' ? 'Operational' : 'Issue Detected'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>
                                            {service.message || '-'}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {service.link && (
                                                <a
                                                    href={service.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#F97316', fontWeight: 'bold', textDecoration: 'none' }}
                                                >
                                                    Open &rarr;
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'agents' && (
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    {/* Sidebar */}
                    <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {AGENTS.map(agent => (
                            <button
                                key={agent.id}
                                onClick={() => setActiveAgent(agent.id)}
                                style={{
                                    padding: '12px',
                                    textAlign: 'left',
                                    background: activeAgent === agent.id ? '#F97316' : '#fff',
                                    color: activeAgent === agent.id ? '#fff' : '#333',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: activeAgent === agent.id ? 'bold' : 'normal'
                                }}
                            >
                                {agent.name}
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div style={{ flex: 1, display: 'flex', gap: '24px' }}>

                        {/* Editor Column */}
                        <div style={{ flex: 1 }}>
                            <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '24px' }}>
                                <h2 style={{ marginTop: 0 }}>System Prompt</h2>

                                <textarea
                                    value={editedPrompt}
                                    onChange={(e) => setEditedPrompt(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '400px',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        border: '1px solid #ccc',
                                        fontFamily: 'monospace',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        marginBottom: '16px'
                                    }}
                                />

                                <h3 style={{ marginTop: '24px' }}>Reply Logic / Output Format</h3>
                                <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                                    Instructions for JSON formatting, specific constraints, or interaction protocols (e.g. JSON options).
                                    This is valid for agents that support structural instructions (like Teacher).
                                </p>
                                <textarea
                                    value={editedInstruction}
                                    onChange={(e) => setEditedInstruction(e.target.value)}
                                    placeholder="Enter structural instructions here (e.g. JSON format)..."
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        border: '1px solid #ccc',
                                        fontFamily: 'monospace',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        marginBottom: '16px',
                                        background: '#f8fafc'
                                    }}
                                />

                                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Model</label>
                                        <select
                                            value={editedModel}
                                            onChange={(e) => setEditedModel(e.target.value)}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                        >
                                            <option value="gpt-4o">gpt-4o</option>
                                            <option value="gpt-4o-mini">gpt-4o-mini</option>
                                            <option value="gpt-4">gpt-4</option>
                                            <option value="gpt-5-nano">GPT-5 Nano</option>
                                            <option value="gpt-4.1-nano">GPT-4.1 Nano</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Temperature</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="2"
                                            value={editedTemp}
                                            onChange={(e) => setEditedTemp(e.target.value)}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    style={{
                                        background: '#F97316',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>

                        {/* Test Chat Column */}
                        <div style={{ width: '350px' }}>
                            <div style={{ background: '#F9F9F9', border: '1px solid #ddd', borderRadius: '12px', padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ marginTop: 0 }}>Test Interaction</h3>
                                <p style={{ fontSize: '13px', color: '#666' }}>Chat with the currently saved version of this agent.</p>

                                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', border: '1px solid #eee', background: '#fff', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {testHistory.length > 0 ? testHistory.map((msg, i) => (
                                        <div key={i} style={{
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '85%'
                                        }}>
                                            <div style={{
                                                fontWeight: 'bold',
                                                fontSize: '11px',
                                                color: msg.role === 'user' ? '#333' : '#F97316',
                                                marginBottom: '2px',
                                                textAlign: msg.role === 'user' ? 'right' : 'left'
                                            }}>
                                                {msg.role === 'user' ? 'YOU' : 'AGENT'}
                                            </div>
                                            <div style={{
                                                background: msg.role === 'user' ? '#eee' : '#fff0e5',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ color: '#ccc', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>Start a conversation...</div>
                                    )}
                                </div>

                                <form onSubmit={handleTest}>
                                    <input
                                        value={testMessage}
                                        onChange={(e) => setTestMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid #ccc',
                                            marginBottom: '8px'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={testing || !testMessage}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: testing ? '#ccc' : '#333',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: testing ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {testing ? 'Thinking...' : 'Send'}
                                    </button>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Save, Send, RefreshCw } from 'lucide-react';

const AGENTS = [
    { id: 'teacher', name: 'The Teacher' },
    { id: 'cartographer', name: 'The Cartographer (Chat)' },
    { id: 'cartographer_rel', name: 'The Cartographer (Map)' },
    { id: 'librarian', name: 'The Librarian' },
    { id: 'scout', name: 'The Scout' },
    { id: 'thoth', name: 'Thoth: The Organizer' },
    { id: 'daedalus', name: 'Daedalus: Project Architect' },
    { id: 'ogma', name: 'Ogma: Memory Keeper' },
    { id: 'lugh', name: 'Lugh: Skill Curriculum' },
    { id: 'skill', name: 'Skill Classifier' }
];

const AdminAgents = () => {
    const [prompts, setPrompts] = useState({});
    const [activeAgent, setActiveAgent] = useState('teacher');
    const [loading, setLoading] = useState(true);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [editedModel, setEditedModel] = useState('gpt-4o');
    const [editedTemp, setEditedTemp] = useState<string>('0.7');
    const [testMessage, setTestMessage] = useState('');
    const [testHistory, setTestHistory] = useState([]);
    const [testing, setTesting] = useState(false);
    const [testResponse, setTestResponse] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPrompts();
    }, []);

    useEffect(() => {
        if (prompts[activeAgent]) {
            setEditedPrompt(prompts[activeAgent].promptText || prompts[activeAgent].prompt_text || '');
            setEditedModel(prompts[activeAgent].model || 'gpt-4o');
            setEditedTemp(String(prompts[activeAgent].temperature || 0.7));
            setTestHistory([]);
        }
    }, [activeAgent, prompts]);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getPrompts();
            if (data?.error) {
                alert('Failed to load prompts: ' + data.error);
                return;
            }
            const promptMap = {};
            if (data?.data && Array.isArray(data.data)) {
                data.data.forEach(p => promptMap[p.agentId || p.agent_id] = p);
            } else if (Array.isArray(data)) {
                data.forEach(p => promptMap[p.agentId || p.agent_id] = p);
            }
            setPrompts(promptMap);
        } catch (err) {
            console.error('[Admin/Agents] Error loading prompts:', err);
        } finally {
            setLoading(false);
        }
    };

    const savePrompt = async () => {
        setSaving(true);
        try {
            await api.admin.updatePrompt(activeAgent, {
                promptText: editedPrompt,
                model: editedModel,
                temperature: parseFloat(String(editedTemp))
            });
            alert('Prompt saved!');
        } catch (err) {
            alert('Failed to save: ' + (err.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const testAgent = async () => {
        if (!testMessage.trim()) return;
        setTesting(true);
        setTestHistory([...testHistory, { role: 'user', content: testMessage }]);
        try {
            const result = await api.admin.chatTest(activeAgent, testMessage, testHistory);
            if (result.response) {
                setTestResponse(result.response);
                setTestHistory([...testHistory, { role: 'user', content: testMessage }, { role: 'assistant', content: result.response }]);
            } else {
                setTestResponse('No response received');
            }
        } catch (err) {
            setTestResponse('Error: ' + (err.message || 'Unknown error'));
        } finally {
            setTesting(false);
            setTestMessage('');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Agent Prompt Editor</h1>
            
            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 space-y-2">
                    {AGENTS.map(agent => (
                        <button
                            key={agent.id}
                            onClick={() => setActiveAgent(agent.id)}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                                activeAgent === agent.id 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            {agent.name}
                        </button>
                    ))}
                </div>

                <div className="col-span-3 space-y-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Edit Prompt: {AGENTS.find(a => a.id === activeAgent)?.name}</h2>
                            <button
                                onClick={savePrompt}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Model</label>
                                <select
                                    value={editedModel}
                                    onChange={e => setEditedModel(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="gpt-4o">gpt-4o</option>
                                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Temperature</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="2"
                                    value={editedTemp}
                                    onChange={e => setEditedTemp(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={fetchPrompts}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                    <RefreshCw size={16} />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <textarea
                            value={editedPrompt}
                            onChange={e => setEditedPrompt(e.target.value)}
                            rows={12}
                            className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                            placeholder="Enter system prompt..."
                        />
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-lg font-semibold mb-4">Test Agent</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={testMessage}
                                onChange={e => setTestMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), testAgent())}
                                placeholder="Type a test message..."
                                className="w-full px-3 py-2 border rounded-lg"
                                disabled={testing}
                            />
                            <button
                                onClick={testAgent}
                                disabled={testing || !testMessage.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Send size={16} />
                                {testing ? 'Testing...' : 'Send'}
                            </button>
                            {testResponse && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium mb-2">Response:</h4>
                                    <pre className="whitespace-pre-wrap text-sm">{testResponse}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAgents;

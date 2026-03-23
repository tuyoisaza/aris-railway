import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RefreshCw, Bug, Terminal } from 'lucide-react';

const AdminDebug = () => {
    const [debugEnabled, setDebugEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDebugSettings();
    }, []);

    const fetchDebugSettings = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getDebugSettings();
            setDebugEnabled(data?.enabled || false);
        } catch (err) {
            console.error('[Admin/Debug] Error fetching debug settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleDebug = async () => {
        try {
            await api.admin.setDebugMode(!debugEnabled);
            setDebugEnabled(!debugEnabled);
        } catch (err) {
            console.error('[Admin/Debug] Error toggling debug:', err);
        }
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

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Bug size={24} />
                        <div>
                            <h3 className="font-semibold">Debug Mode</h3>
                            <p className="text-sm text-gray-500">
                                Enable detailed logging and debug information
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggleDebug}
                        className={`px-6 py-2 rounded-lg font-medium ${
                            debugEnabled
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-800'
                        }`}
                    >
                        {debugEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>

                <div className="mt-6">
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
        </div>
    );
};

export default AdminDebug;

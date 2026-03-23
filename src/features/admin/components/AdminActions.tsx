import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RefreshCw } from 'lucide-react';

const AdminActions = () => {
    const [actions, setActions] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('actions');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [actionsData, activityData] = await Promise.all([
                api.admin.getActions(),
                api.admin.getActivity()
            ]);
            setActions(actionsData?.data || actionsData || []);
            setActivity(activityData?.data || activityData || []);
        } catch (err) {
            console.error('[Admin/Actions] Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Actions & Activity</h1>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('actions')}
                    className={`px-4 py-2 rounded-lg ${
                        activeTab === 'actions' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                >
                    Actions
                </button>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-4 py-2 rounded-lg ${
                        activeTab === 'activity' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                >
                    Activity Logs
                </button>
            </div>

            {activeTab === 'actions' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-left">Entity</th>
                                <th className="px-4 py-3 text-left">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {actions.map((action: any, i) => (
                                <tr key={i} className="border-t">
                                    <td className="px-4 py-3">{action.type}</td>
                                    <td className="px-4 py-3">{action.entityType || '-'}</td>
                                    <td className="px-4 py-3">{new Date(action.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                            {actions.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                        No actions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left">Action</th>
                                <th className="px-4 py-3 text-left">Entity</th>
                                <th className="px-4 py-3 text-left">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity.map((log: any, i) => (
                                <tr key={i} className="border-t">
                                    <td className="px-4 py-3">{log.action}</td>
                                    <td className="px-4 py-3">{log.entityType || '-'}</td>
                                    <td className="px-4 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                            {activity.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                        No activity logs found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminActions;

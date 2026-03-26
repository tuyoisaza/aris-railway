import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { RefreshCw, Zap, Activity, User } from 'lucide-react';

const AdminGuidedActions = () => {
    const [actions, setActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getGuidedActions?.();
            setActions(data?.data || data || []);
        } catch (err) {
            console.error('[Admin/GuidedActions] Error fetching actions:', err);
            setActions([]);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (type: string) => {
        if (type.includes('conversation') || type.includes('topic')) {
            return <Zap size={18} className="text-orange-500" />;
        }
        if (type.includes('project')) {
            return <Activity size={18} className="text-blue-500" />;
        }
        return <Zap size={18} className="text-gray-500" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading guided actions...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Guided Actions Log</h1>
                    <p className="text-gray-500 mt-1">Recent guided action executions</p>
                </div>
                <button
                    onClick={fetchActions}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID</th>
                            <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {actions.map((action: any, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        {getActionIcon(action.type)}
                                        <span className="font-medium text-gray-900">{action.type}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-gray-600">
                                        {action.entityType ? (
                                            <span className="inline-flex items-center gap-1">
                                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                                                    {action.entityType}
                                                </span>
                                                {action.entityId && action.entityId.length > 8 && (
                                                    <span className="text-xs text-gray-400">
                                                        {action.entityId.substring(0, 8)}...
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-sm text-gray-500 font-mono">
                                        {action.userId && action.userId.length > 8 ? action.userId.substring(0, 8) + '...' : (action.userId || '-')}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-sm text-gray-500">
                                        {action.createdAt ? new Date(action.createdAt).toLocaleString() : '-'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {actions.length === 0 && (
                    <div className="text-center py-16">
                        <Zap size={64} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No guided actions found</h3>
                        <p className="text-gray-500">Guided action executions will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminGuidedActions;

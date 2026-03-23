import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RefreshCw, Zap } from 'lucide-react';

const AdminGuidedActions = () => {
    const [actions, setActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getGuidedActions();
            setActions(data?.data || data || []);
        } catch (err) {
            console.error('[Admin/GuidedActions] Error fetching actions:', err);
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
                <h1 className="text-2xl font-bold">Guided Actions</h1>
                <button
                    onClick={fetchActions}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

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
                    </tbody>
                </table>
                {actions.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Zap size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No guided actions found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminGuidedActions;

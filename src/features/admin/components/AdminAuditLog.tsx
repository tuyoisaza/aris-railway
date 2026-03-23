import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { RefreshCw, FileText, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminAuditLog = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
    const [filters, setFilters] = useState({
        userId: '',
        action: '',
        startDate: '',
        endDate: ''
    });
    const [availableActions, setAvailableActions] = useState<string[]>([]);

    useEffect(() => {
        fetchActions();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, filters]);

    const fetchActions = async () => {
        try {
            const data = await api.admin.getAuditActions();
            setAvailableActions(data?.data || []);
        } catch (err) {
            console.error('[Admin/Audit] Error fetching actions:', err);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getAuditLogs({
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            });
            setLogs(data?.data?.data || []);
            if (data?.data?.pagination) {
                setPagination(prev => ({ ...prev, ...data.data.pagination }));
            }
        } catch (err) {
            console.error('[Admin/Audit] Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const actionColors: Record<string, string> = {
        LOGIN_SUCCESS: 'bg-green-100 text-green-800',
        LOGIN_FAILURE: 'bg-red-100 text-red-800',
        SIGNUP: 'bg-blue-100 text-blue-800',
        LOGOUT: 'bg-gray-100 text-gray-800',
        ROLE_CHANGE: 'bg-purple-100 text-purple-800'
    };

    const getActionColor = (action: string) => actionColors[action] || 'bg-gray-100 text-gray-800';

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Audit Log</h1>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-lg shadow mb-4 p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter size={16} />
                        <span className="text-sm font-medium">Filters:</span>
                    </div>
                    <select
                        value={filters.action}
                        onChange={(e) => handleFilterChange('action', e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm"
                    >
                        <option value="">All Actions</option>
                        {availableActions.map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm"
                        placeholder="Start Date"
                    />
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm"
                        placeholder="End Date"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No audit logs found</p>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log: any) => (
                                <tr key={log.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div>
                                            <div className="font-medium">{log.user?.name || '-'}</div>
                                            <div className="text-xs text-gray-500">{log.userEmail || log.user?.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {log.targetType && log.targetId ? (
                                            <div>
                                                <div>{log.targetType}</div>
                                                <div className="text-xs text-gray-500">{log.targetId}</div>
                                            </div>
                                        ) : log.metadata ? (
                                            <span className="text-xs text-gray-500">{log.metadata}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {log.ipAddress || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {pagination.pages > 1 && (
                    <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 border rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-3 py-1 text-sm">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages}
                                className="px-3 py-1 border rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAuditLog;

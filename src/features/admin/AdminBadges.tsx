import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RefreshCw, Plus, Edit2, Trash2, Award } from 'lucide-react';

const AdminBadges = () => {
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBadge, setEditingBadge] = useState<any>(null);

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        setLoading(true);
        try {
            const data = await api.admin.getBadges();
            setBadges(data?.data || data || []);
        } catch (err) {
            console.error('[Admin/Badges] Error fetching badges:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this badge?')) return;
        try {
            await api.admin.deleteBadge(id);
            fetchBadges();
        } catch (err) {
            console.error('[Admin/Badges] Error deleting badge:', err);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Badge Management</h1>
                <button
                    onClick={fetchBadges}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {badges.map((badge: any) => (
                    <div key={badge.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{badge.icon}</span>
                                <div>
                                    <h3 className="font-semibold">{badge.name}</h3>
                                    <p className="text-sm text-gray-500">{badge.category || 'Uncategorized'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingBadge(badge)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(badge.id)}
                                    className="p-2 hover:bg-red-100 text-red-600 rounded"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">XP Reward:</span>
                            <span className="font-medium">{badge.xpReward || 0}</span>
                        </div>
                    </div>
                ))}
            </div>

            {badges.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Award size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No badges found</p>
                </div>
            )}
        </div>
    );
};

export default AdminBadges;

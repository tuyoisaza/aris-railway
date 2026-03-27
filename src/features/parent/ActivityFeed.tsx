import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Rocket, Medal, Clock, AlertCircle, Users } from 'lucide-react';

const ActivityFeed = ({ familyId }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!familyId) return;

        const fetchActivity = async () => {
            setLoading(true);
            try {
                const data = await api.getFamilyActivity(familyId);
                if (data && data.recentEvents) {
                    setActivities(data.recentEvents);
                } else if (Array.isArray(data)) {
                    setActivities(data);
                } else {
                    setActivities([]);
                }
            } catch (error) {
                console.error("Failed to fetch activity:", error);
                setActivities([]);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [familyId]);

    if (loading) return <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', padding: '20px', textAlign: 'center' }}>Loading activity...</div>;

    if (!activities || activities.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-tertiary)' }}>
                <Clock size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div style={{ fontSize: '13px' }}>No recent activity.</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>Start a conversation to see activity here.</div>
            </div>
        );
    }

    const getIcon = (type) => {
        switch (type) {
            case 'project': return <Rocket size={14} color="var(--color-primary)" />;
            case 'badge': return <Medal size={14} color="#F59E0B" />;
            case 'member': return <Users size={14} color="#8b5cf6" />;
            default: return <Clock size={14} color="var(--color-text-tertiary)" />;
        }
    };

    const getBorderColor = (type) => {
        switch (type) {
            case 'project': return 'var(--color-primary)';
            case 'badge': return '#F59E0B';
            case 'member': return '#8b5cf6';
            default: return 'var(--color-border)';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activities.map((item, index) => (
                <div key={item.id || index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--color-bg-secondary)',
                    borderLeft: `3px solid ${getBorderColor(item.type)}`
                }}>
                    <div style={{
                        marginTop: '2px',
                        background: '#fff',
                        borderRadius: '50%',
                        padding: '6px',
                        display: 'flex',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {getIcon(item.type)}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.title || item.action || 'Activity'}</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                            </span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                            {item.description || item.message || ''}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityFeed;

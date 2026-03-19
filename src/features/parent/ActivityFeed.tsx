import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Rocket, Medal, Clock, AlertCircle } from 'lucide-react';

const ActivityFeed = ({ familyId }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!familyId) return;

        const fetchActivity = async () => {
            setLoading(true);
            try {
                const data = await api.getFamilyActivity(familyId);
                setActivities(data || []);
            } catch (error) {
                console.error("Failed to fetch activity:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [familyId]);

    if (loading) return <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', padding: '20px', textAlign: 'center' }}>Loading activity...</div>;

    if (activities.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-tertiary)' }}>
                <Clock size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div style={{ fontSize: '13px' }}>No recent activity.</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activities.map((item, index) => (
                <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--color-bg-secondary)',
                    borderLeft: item.type === 'project' ? '3px solid var(--color-primary)' : '3px solid #F59E0B'
                }}>
                    <div style={{
                        marginTop: '2px',
                        background: '#fff',
                        borderRadius: '50%',
                        padding: '6px',
                        display: 'flex',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {item.type === 'project' && <Rocket size={14} color="var(--color-primary)" />}
                        {item.type === 'badge' && <Medal size={14} color="#F59E0B" />}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.title}</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                                {new Date(item.date).toLocaleDateString()}
                            </span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                            <span style={{ fontWeight: '500', color: 'var(--color-text)' }}>{item.user}</span>
                            {item.type === 'project' && <> started a new project.</>}
                            {item.type === 'badge' && <> earned a new badge.</>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityFeed;

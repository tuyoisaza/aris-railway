import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Bot, Zap, Server, Award, Users, Bug, Compass, Flag, FileText } from 'lucide-react';

const tabs = [
    { path: '/admin/agents', label: 'Agents', icon: Bot },
    { path: '/admin/actions', label: 'Actions', icon: Zap },
    { path: '/admin/systemstatus', label: 'System Status', icon: Server },
    { path: '/admin/badges', label: 'Badges', icon: Award },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/debug', label: 'Debug', icon: Bug },
    { path: '/admin/guidedactions', label: 'Guided Actions', icon: Compass },
    { path: '/admin/featureflags', label: 'Feature Flags', icon: Flag },
    { path: '/admin/audit', label: 'Audit Log', icon: FileText },
];

const AdminLayout = () => {
    const { t } = useTranslation();
    const location = useLocation();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <div style={{
                borderBottom: '1px solid var(--color-border)',
                background: 'white',
                padding: '0 24px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    height: '60px',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    <Shield size={24} color="var(--color-primary)" />
                    <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--color-text)' }}>
                        Admin Dashboard
                    </h1>
                </div>
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    overflowX: 'auto',
                    paddingBottom: '8px'
                }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = location.pathname === tab.path;
                        return (
                            <Link
                                key={tab.path}
                                to={tab.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    background: isActive ? 'var(--color-primary-light)' : 'transparent',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;

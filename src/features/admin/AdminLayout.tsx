import React, { useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Shield, Bot, Zap, Server, Award, Users, Bug, Compass, Flag, FileText, Lock, AlertTriangle } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

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
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useGlobal();

    useEffect(() => {
        if (!user) {
            navigate('/?login_required=admin');
            return;
        }

        if (user.role !== 'admin' && user.plan !== 'pro') {
            navigate('/?access_denied=admin');
            return;
        }
    }, [user, navigate]);

    if (!user) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: '#e5e7eb',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <Lock size={32} color="#9ca3af" />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                        Authentication Required
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                        Please log in to access the admin dashboard
                    </p>
                    <button
                        onClick={() => navigate('/?login_required=admin')}
                        style={{
                            padding: '10px 24px',
                            background: '#F97316',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Log In
                    </button>
                </div>
            </div>
        );
    }

    if (user.role !== 'admin' && user.plan !== 'pro') {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5'
            }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: '#fee2e2',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <AlertTriangle size={32} color="#ef4444" />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                        Access Denied
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                        You don't have permission to access the admin dashboard.
                    </p>
                    <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
                        Requires <strong>admin</strong> role or <strong>pro</strong> plan.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '10px 24px',
                            background: '#e5e7eb',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
            {/* Header */}
            <div style={{
                borderBottom: '1px solid #e5e7eb',
                background: '#fff',
                padding: '0 40px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    height: '70px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Shield size={24} color="#F97316" />
                        <div>
                            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                                Agent Brain Console
                            </h1>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                                Manage system prompts and services.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            padding: '4px 12px',
                            background: user.role === 'admin' ? '#f3e8ff' : '#fff7ed',
                            color: user.role === 'admin' ? '#7c3aed' : '#c2410c',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600'
                        }}>
                            {user.role === 'admin' ? 'Admin' : 'Pro'}
                        </span>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                            {user.email}
                        </span>
                    </div>
                </div>

                {/* Tab Bar */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    maxWidth: '1400px',
                    margin: '0 auto',
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
                                    fontWeight: '600',
                                    color: isActive ? '#F97316' : '#6b7280',
                                    background: isActive ? '#fff7ed' : 'transparent',
                                    border: isActive ? '1px solid #fed7aa' : '1px solid transparent',
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

            {/* Content */}
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '24px 40px'
            }}>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;

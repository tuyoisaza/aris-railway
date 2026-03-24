import React, { useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Bot, Zap, Server, Award, Users, Bug, Compass, Flag, FileText, Lock, AlertTriangle } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';

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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} className="text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                    <p className="text-gray-500">Please log in to access the admin dashboard</p>
                    <button
                        onClick={() => navigate('/?login_required=admin')}
                        className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                    >
                        Log In
                    </button>
                </div>
            </div>
        );
    }

    if (user.role !== 'admin' && user.plan !== 'pro') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500 mb-4">
                        You don't have permission to access the admin dashboard.
                        Admin access requires the <strong>admin</strong> role or <strong>pro</strong> plan.
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                        Current role: {user.role} | Current plan: {user.plan}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

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
                    justifyContent: 'space-between',
                    height: '60px',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Shield size={24} color="var(--color-primary)" />
                        <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--color-text)' }}>
                            Admin Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {user.role === 'admin' ? 'Admin' : 'Pro'}
                        </span>
                        <span>{user.email}</span>
                    </div>
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

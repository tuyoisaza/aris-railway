import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Shield, Bot, Zap, Server, Award, Users, Bug, Compass, Flag, FileText, Lock, AlertTriangle, ChevronLeft, ChevronRight, Home, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobal } from '../../context/GlobalContext';

const tabs = [
    { path: '/admin/agents', label: 'Agents', icon: Bot, color: '#6366f1' },
    { path: '/admin/actions', label: 'Actions', icon: Zap, color: '#f59e0b' },
    { path: '/admin/systemstatus', label: 'System', icon: Server, color: '#10b981' },
    { path: '/admin/badges', label: 'Badges', icon: Award, color: '#ec4899' },
    { path: '/admin/users', label: 'Users', icon: Users, color: '#8b5cf6' },
    { path: '/admin/debug', label: 'Debug', icon: Bug, color: '#ef4444' },
    { path: '/admin/guidedactions', label: 'Guided', icon: Compass, color: '#06b6d4' },
    { path: '/admin/featureflags', label: 'Flags', icon: Flag, color: '#84cc16' },
    { path: '/admin/audit', label: 'Audit', icon: FileText, color: '#f97316' },
];

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useGlobal();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
                background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)'
            }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                        textAlign: 'center',
                        padding: '48px',
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 8px 32px rgba(249,115,22,0.3)'
                    }}>
                        <Lock size={40} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
                        Authentication Required
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', fontSize: '16px' }}>
                        Please log in to access the admin dashboard
                    </p>
                    <button
                        onClick={() => navigate('/?login_required=admin')}
                        style={{
                            padding: '14px 32px',
                            background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '16px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(249,115,22,0.3)'
                        }}
                    >
                        Log In
                    </button>
                </motion.div>
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
                background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)'
            }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                        textAlign: 'center',
                        padding: '48px',
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        maxWidth: '400px'
                    }}
                >
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 8px 32px rgba(239,68,68,0.3)'
                    }}>
                        <AlertTriangle size={40} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
                        Access Denied
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '12px', fontSize: '16px' }}>
                        You don't have permission to access the admin dashboard.
                    </p>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>
                        Requires <span style={{ color: '#f97316', fontWeight: '600' }}>admin</span> role or <span style={{ color: '#f97316', fontWeight: '600' }}>pro</span> plan.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '14px 32px',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '16px',
                            cursor: 'pointer'
                        }}
                    >
                        Go Home
                    </button>
                </motion.div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f1a' }}>
            {/* Sidebar */}
            <motion.aside
                animate={{ width: sidebarCollapsed ? '80px' : '260px' }}
                style={{
                    background: 'linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    zIndex: 100,
                    overflow: 'hidden'
                }}
            >
                {/* Logo */}
                <div style={{
                    padding: sidebarCollapsed ? '20px 16px' : '24px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                            flexShrink: 0
                        }}>
                            <Shield size={22} color="#fff" />
                        </div>
                        <AnimatePresence>
                            {!sidebarCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>
                                        Admin Console
                                    </h1>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                        System Management
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
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
                                    gap: '12px',
                                    padding: sidebarCollapsed ? '12px' : '12px 16px',
                                    marginBottom: '4px',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                                    background: isActive ? `linear-gradient(135deg, ${tab.color}20 0%, ${tab.color}10 100%)` : 'transparent',
                                    borderLeft: isActive ? `3px solid ${tab.color}` : '3px solid transparent',
                                    transition: 'all 0.2s ease',
                                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    background: isActive ? `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}99 100%)` : 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Icon size={16} color={isActive ? '#fff' : 'rgba(255,255,255,0.5)'} />
                                </div>
                                <AnimatePresence>
                                    {!sidebarCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500', whiteSpace: 'nowrap' }}
                                        >
                                            {tab.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Link
                        to="/"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: sidebarCollapsed ? '12px' : '12px 16px',
                            marginBottom: '8px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            color: 'rgba(255,255,255,0.5)',
                            transition: 'all 0.2s ease',
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
                        }}
                    >
                        <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Home size={16} color="rgba(255,255,255,0.5)" />
                        </div>
                        <AnimatePresence>
                            {!sidebarCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}
                                >
                                    Back to App
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>

                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: sidebarCollapsed ? '12px' : '12px 16px',
                            marginBottom: '8px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            color: '#ef4444',
                            background: 'rgba(239,68,68,0.1)',
                            border: 'none',
                            width: sidebarCollapsed ? '56px' : '100%',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
                        }}
                    >
                        <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'rgba(239,68,68,0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <LogOut size={16} color="#ef4444" />
                        </div>
                        <AnimatePresence>
                            {!sidebarCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}
                                >
                                    Logout
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    style={{
                        position: 'absolute',
                        right: '-12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '24px',
                        height: '24px',
                        background: '#2d2d44',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.5)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </motion.aside>

            {/* Main Content */}
            <motion.main
                animate={{ marginLeft: sidebarCollapsed ? '80px' : '260px' }}
                style={{
                    flex: 1,
                    minHeight: '100vh',
                    background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)'
                }}
            >
                {/* Header */}
                <header style={{
                    position: 'sticky',
                    top: 0,
                    background: 'rgba(15,15,26,0.8)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    padding: '20px 32px',
                    zIndex: 50
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#fff' }}>
                                {tabs.find(t => t.path === location.pathname)?.label || 'Dashboard'}
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                background: user.role === 'admin' ? 'rgba(139,92,246,0.2)' : 'rgba(249,115,22,0.2)',
                                borderRadius: '12px',
                                border: `1px solid ${user.role === 'admin' ? 'rgba(139,92,246,0.3)' : 'rgba(249,115,22,0.3)'}`
                            }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    background: user.role === 'admin' ? '#8b5cf6' : '#f97316',
                                    borderRadius: '50%',
                                    boxShadow: `0 0 8px ${user.role === 'admin' ? '#8b5cf6' : '#f97316'}`
                                }} />
                                <span style={{ fontSize: '13px', fontWeight: '600', color: user.role === 'admin' ? '#a78bfa' : '#fb923c' }}>
                                    {user.role === 'admin' ? 'Admin' : 'Pro'}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    color: '#fff',
                                    fontSize: '14px'
                                }}>
                                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>
                                    {user.name || user.email?.split('@')[0]}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div style={{ padding: '32px' }}>
                    <Outlet />
                </div>
            </motion.main>
        </div>
    );
};

export default AdminLayout;

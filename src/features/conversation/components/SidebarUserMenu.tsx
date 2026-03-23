import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Shield, Settings, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const popupMenuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--color-text)',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.2s'
};

interface SidebarUserMenuProps {
    isOpen: boolean;
    user: any;
    onClose: () => void;
    logout: () => void;
}

const SidebarUserMenu: React.FC<SidebarUserMenuProps> = ({ isOpen, user, onClose, logout }) => {
    const { t } = useTranslation();

    return (
        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--color-border)', position: 'relative' }}>
            <div
                onClick={onClose}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    background: isOpen ? 'var(--color-bg-secondary)' : 'transparent',
                    transition: 'background 0.2s'
                }}
            >
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--color-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    fontWeight: '600'
                }}>
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.email}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            bottom: '70px',
                            left: '16px',
                            right: '16px',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            overflow: 'hidden',
                            zIndex: 60
                        }}
                    >
                        <button
                            onClick={() => window.location.href = '/account'}
                            style={popupMenuItemStyle}
                        >
                            <User size={16} />
                            {t('menu.account')}
                        </button>

                        {user?.role === 'admin' && (
                            <button
                                onClick={() => window.location.href = '/admin'}
                                style={popupMenuItemStyle}
                            >
                                <Shield size={16} color="var(--color-primary)" />
                                {t('menu.admin')}
                            </button>
                        )}

                        <button
                            onClick={() => window.location.href = '/settings'}
                            style={popupMenuItemStyle}
                        >
                            <Settings size={16} />
                            {t('menu.settings')}
                        </button>

                        <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 8px' }} />

                        <button
                            onClick={logout}
                            style={{ ...popupMenuItemStyle, color: '#ef4444' }}
                        >
                            <LogOut size={16} />
                            {t('menu.logout')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SidebarUserMenu;

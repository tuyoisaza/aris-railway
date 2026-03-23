import React from 'react';
import { X, Plus, Briefcase, Sword } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarHeaderProps {
    onClose: () => void;
    onNewChat: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onClose, onNewChat }) => {
    const { t } = useTranslation();

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-secondary)' }}
                >
                    <X size={24} />
                </button>
                <button
                    onClick={onNewChat}
                    style={{
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--color-primary-light)',
                        borderRadius: '8px',
                        color: 'var(--color-primary)'
                    }}
                >
                    <Plus size={18} />
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{t('menu.newChat')}</span>
                </button>
            </div>

            <div
                onClick={() => window.location.href = '/projects'}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'var(--color-text)',
                    fontWeight: '600',
                    fontSize: '14px'
                }}
            >
                <Briefcase size={18} color="var(--color-primary)" />
                <span>My Projects</span>
            </div>

            <div
                onClick={() => window.location.href = '/skills'}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'var(--color-text)',
                    fontWeight: '600',
                    fontSize: '14px'
                }}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <Sword size={18} color="var(--color-primary)" />
                <span>Skills</span>
            </div>
        </>
    );
};

export default SidebarHeader;

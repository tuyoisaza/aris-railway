import React, { useState } from 'react';
import { Menu, X, Users } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import LanguageSelector from '../components/LanguageSelector';
import ProfileMenu from './ProfileMenu';
import MenuOverlay from './MenuOverlay';
import FamilyCollaboration from '../features/collaboration/FamilyCollaboration';

import { useTranslation } from 'react-i18next';

const MainLayout = ({ children }) => {
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
    const location = useLocation();
    const { user, logout, family } = useGlobal();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Helper: Check if user has family access
    const hasFamilyAccess = () => {
        if (!user) return false;
        // Simulation for specific user
        if (user.email === 'thetboard@gmail.com') return true;
        // Plan check
        const allowedPlans = ['family', 'plus', 'pro'];
        return allowedPlans.includes(user.plan);
    };

    // Menu items based on the secondary sections
    const menuItems = [
        { label: t('menu.conversation'), path: '/' },
        { label: t('menu.learningMap'), path: '/map' },
        { label: t('menu.skills'), path: '/skills' },
        ...(hasFamilyAccess() ? [{ label: t('menu.parentDashboard'), path: '/parent' }] : []),
        { label: t('menu.projects'), path: '/projects' },
        { label: t('menu.settings'), path: '/settings' },
    ];

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--color-bg)' }}>
            {/* Version Badge - Top Left */}
            <div style={{
                position: 'fixed',
                top: '12px',
                left: '16px',
                zIndex: 60,
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: '500',
                opacity: 0.7,
                border: '1px solid var(--color-border)'
            }}>
                v595b1a5
            </div>
            {/* Top Right Controls Container */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 60, display: 'flex', gap: '16px', alignItems: 'center' }}>

                {/* Family Collaboration Button */}
                {family?.id && (
                    <button
                        onClick={() => setIsCollaborationOpen(true)}
                        style={{
                            background: 'var(--color-primary-light)',
                            border: '1px solid var(--color-primary)',
                            color: 'var(--color-primary)',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--color-primary)';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--color-primary-light)';
                            e.currentTarget.style.color = 'var(--color-primary)';
                        }}
                    >
                        <Users size={16} />
                        Collaborate
                    </button>
                )}

                <LanguageSelector />

                <ProfileMenu user={user} logout={logout} t={t} />

                {/* Hamburger Menu Button */}
                <button
                    onClick={toggleMenu}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex'
                    }}
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Main Content Area */}
            <main style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
                {children}
            </main>

            <MenuOverlay
                isOpen={isMenuOpen}
                menuItems={menuItems}
                currentPath={location.pathname}
                onClose={() => setIsMenuOpen(false)}
            />

            {/* Family Collaboration Modal */}
            <FamilyCollaboration
                isOpen={isCollaborationOpen}
                onClose={() => setIsCollaborationOpen(false)}
                onSessionStart={(session) => {
                    console.log('Collaboration session started:', session);
                }}
            />
        </div>
    );
};

export default MainLayout;

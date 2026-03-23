import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConversationHeaderProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    isFocusMode: boolean;
    setIsFocusMode: (mode: boolean) => void;
    showPinModal: boolean;
    setShowPinModal: (show: boolean) => void;
    userPin?: string;
    familyPin?: string;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
    isSidebarOpen,
    setIsSidebarOpen,
    isFocusMode,
    setIsFocusMode,
    showPinModal,
    setShowPinModal,
    userPin,
    familyPin
}) => {
    const { t } = useTranslation();

    const handleFocusToggle = () => {
        if (isFocusMode) {
            setIsFocusMode(false);
        } else {
            setShowPinModal(true);
        }
    };

    return (
        <>
            {!isFocusMode && (
                <>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            left: '20px',
                            zIndex: 50,
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            padding: '10px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            color: 'var(--color-text)'
                        }}
                    >
                        <div style={{ width: '24px', height: '2px', background: 'currentColor', marginBottom: '4px' }}></div>
                        <div style={{ width: '16px', height: '2px', background: 'currentColor', marginBottom: '4px' }}></div>
                        <div style={{ width: '24px', height: '2px', background: 'currentColor' }}></div>
                    </button>

                    <button
                        onClick={handleFocusToggle}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 30,
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '20px',
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            opacity: isFocusMode ? 0.5 : 1
                        }}
                    >
                        {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        <span style={{ fontSize: '12px', fontWeight: '600' }}>
                            {isFocusMode ? 'Exit Focus' : 'Focus'}
                        </span>
                    </button>
                </>
            )}
        </>
    );
};

export default ConversationHeader;

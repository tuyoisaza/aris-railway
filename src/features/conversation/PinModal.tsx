import React from 'react';

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userPin?: string;
    familyPin?: string;
}

/**
 * PinModal Component
 * 
 * Modal for entering Focus Mode PIN verification.
 * Extracted from ConversationPage.tsx to reduce file size.
 */
const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess, userPin, familyPin }) => {
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const enteredPin = e.target.value;

        // Check User PIN first (if set), then Family PIN
        if ((userPin && enteredPin === userPin) || (!userPin && familyPin && enteredPin === familyPin)) {
            onSuccess();
        } else if (!userPin && !familyPin && enteredPin.length === 4) {
            // Fallback: If no PIN is set anywhere, use '0000' as default
            if (enteredPin === '0000') {
                onSuccess();
                alert("No PIN was set, so 0000 was used. Please set a PIN in settings.");
            }
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'var(--color-bg-primary)',
                padding: '32px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                width: '90%',
                maxWidth: '320px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ margin: 0, textAlign: 'center' }}>Enter Focus PIN</h3>
                <input
                    type="password"
                    placeholder="****"
                    maxLength={4}
                    autoFocus
                    style={{
                        fontSize: '32px',
                        letterSpacing: '8px',
                        textAlign: 'center',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        outline: 'none',
                        width: '100%'
                    }}
                    onChange={handleChange}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: 'center' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinModal;

import React from 'react';
import { Trash } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    onConfirm: () => void;
}

/**
 * DeleteConfirmationModal Component
 * 
 * Confirmation dialog for delete actions.
 * Extracted from ParentDashboard.tsx to reduce file size.
 */
const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    title,
    onClose,
    onConfirm
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff',
                    padding: '24px',
                    borderRadius: '16px',
                    width: '320px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    textAlign: 'center'
                }}
            >
                <div style={{
                    width: '48px', height: '48px', background: '#fee2e2', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px auto', color: '#ef4444'
                }}>
                    <Trash size={24} />
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>Delete Invite?</h3>
                <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    Are you sure you want to delete the invite for <strong>"{title}"</strong>?
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)',
                            background: '#fff', color: 'var(--color-text)', fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                            background: '#ef4444', color: '#fff', fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Delete
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default DeleteConfirmationModal;

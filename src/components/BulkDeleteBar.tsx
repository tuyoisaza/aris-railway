import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, Network } from 'lucide-react';

interface BulkDeleteBarProps {
    selectedCount: number;
    onDelete: () => void;
    onMerge?: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
    isMerging?: boolean;
    itemName?: string; // e.g. "Projects", "Skills"
}

const BulkDeleteBar: React.FC<BulkDeleteBarProps> = ({
    selectedCount,
    onDelete,
    onMerge,
    onCancel,
    isDeleting = false,
    isMerging = false,
    itemName = 'Items'
}) => {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 100, // Above other content
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        padding: '12px 24px',
                        borderRadius: '100px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div style={{
                        fontWeight: '600',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <div style={{
                            background: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                        }}>
                            {selectedCount}
                        </div>
                        <span style={{ fontSize: '14px' }}>
                            {itemName} Selected
                        </span>
                    </div>

                    <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }} />

                    {onMerge && selectedCount > 1 && (
                        <button
                            onClick={onMerge}
                            disabled={isMerging || isDeleting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: (isMerging || isDeleting) ? 'wait' : 'pointer',
                                opacity: (isMerging || isDeleting) ? 0.8 : 1
                            }}
                        >
                            {isMerging ? (
                                <span>Merging...</span>
                            ) : (
                                <>
                                    <Network size={16} />
                                    Merge
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={onDelete}
                        disabled={isDeleting || isMerging}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: (isDeleting || isMerging) ? 'wait' : 'pointer',
                            opacity: (isDeleting || isMerging) ? 0.8 : 1
                        }}
                    >
                        {isDeleting ? (
                            <span>Deleting...</span>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Delete
                            </>
                        )}
                    </button>

                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-tertiary)',
                            padding: '4px',
                            display: 'flex'
                        }}
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BulkDeleteBar;

import React from 'react';
import { useTranslation } from 'react-i18next';

interface MoveModalProps {
    isOpen: boolean;
    folders: any[];
    moveTargetIds: string[];
    chatToMove: any;
    onMove: (folderId: string | null) => void;
    onClose: () => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
    isOpen,
    folders,
    moveTargetIds,
    chatToMove,
    onMove,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'var(--color-surface)',
                padding: '20px',
                borderRadius: '12px',
                width: '300px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)'
            }}>
                <h3 style={{ marginTop: 0, color: 'var(--color-text)' }}>
                    {moveTargetIds.length > 0 ? `Move ${moveTargetIds.length} Conversations` : 'Move to Folder'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    <button
                        onClick={() => onMove(null)}
                        style={{
                            padding: '10px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            background: 'var(--color-bg-secondary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: 'var(--color-text)'
                        }}
                    >
                        No Folder (Unorganized)
                    </button>
                    {folders.map(f => (
                        <button
                            key={f.id}
                            onClick={() => onMove(f.id)}
                            style={{
                                padding: '10px',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                background: 'var(--color-surface)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                color: 'var(--color-text)'
                            }}
                        >
                            📁 {f.title}
                        </button>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    style={{
                        marginTop: '16px',
                        width: '100%',
                        padding: '8px',
                        border: 'none',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: 'var(--color-text)'
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

interface RenameModalProps {
    isOpen: boolean;
    type: 'folder' | 'chat';
    currentTitle: string;
    newTitle: string;
    onChange: (title: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
    isOpen,
    type,
    currentTitle,
    newTitle,
    onChange,
    onConfirm,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '24px',
                width: '300px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--color-text)' }}>
                    Rename {type === 'folder' ? 'Folder' : 'Chat'}
                </h3>
                <input
                    value={newTitle}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        marginBottom: '16px',
                        fontSize: '14px',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)'
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onConfirm();
                        if (e.key === 'Escape') onClose();
                    }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--color-text)'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!newTitle.trim()}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            background: 'var(--color-primary)',
                            color: '#fff',
                            cursor: newTitle.trim() ? 'pointer' : 'not-allowed',
                            opacity: newTitle.trim() ? 1 : 0.5
                        }}
                    >
                        Rename
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DeleteConfirmModalProps {
    isOpen: boolean;
    title: string;
    onConfirm: () => void;
    onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    title,
    onConfirm,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '24px',
                width: '320px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--color-text)' }}>Confirm Delete</h3>
                <p style={{ marginBottom: '20px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    Are you sure you want to delete "{title}"? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--color-text)'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            background: '#ef4444',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

interface SummaryModalProps {
    isOpen: boolean;
    content: string;
    isLoading: boolean;
    onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
    isOpen,
    content,
    isLoading,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '24px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '80vh',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--color-text)' }}>Conversation Summary</h3>
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                    background: 'var(--color-bg)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: 'var(--color-text)'
                }}>
                    {isLoading ? 'Generating summary...' : content}
                </div>
                <button
                    onClick={onClose}
                    style={{
                        marginTop: '16px',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '8px',
                        background: 'var(--color-primary)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

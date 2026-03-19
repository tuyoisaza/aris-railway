import React, { useState } from 'react';
import { X, Copy, Trash } from 'lucide-react';

interface Invitation {
    id: string;
    email: string;
    status: string;
    link: string;
}

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendInvite: (email: string) => Promise<any>;
    onCopyLink: (link: string) => void;
    onRemoveInvite: (id: string, email: string) => void;
    invitations: Invitation[];
}

/**
 * AddMemberModal Component
 * 
 * Modal for inviting new family members.
 * Extracted from ParentDashboard.tsx to reduce file size.
 */
const AddMemberModal: React.FC<AddMemberModalProps> = ({
    isOpen,
    onClose,
    onSendInvite,
    onCopyLink,
    onRemoveInvite,
    invitations
}) => {
    const [inviteEmail, setInviteEmail] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        await onSendInvite(inviteEmail);
        setInviteEmail('');
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }}>
            <div className="card" style={{ width: '400px', padding: '24px', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>

                <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Add Family Member</h3>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="Enter email"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                        />
                    </div>
                    <button className="btn-primary" style={{ width: '100%' }} type="submit">
                        Generate Invite Link
                    </button>
                </form>

                {invitations.length > 0 && (
                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border-light)' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>Active Invites</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {invitations.map(inv => (
                                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>{inv.email}</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => onCopyLink(inv.link)}
                                            style={{ border: 'none', background: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            title="Copy Link"
                                        >
                                            <Copy size={12} />
                                        </button>
                                        <button
                                            onClick={() => onRemoveInvite(inv.id, inv.email)}
                                            style={{ border: 'none', background: 'none', color: 'var(--color-error, #ef4444)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            title="Remove Invite"
                                        >
                                            <Trash size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddMemberModal;

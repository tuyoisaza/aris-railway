import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { api } from '../../services/api';

const JoinFamily = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { user } = useGlobal();

    const [status, setStatus] = useState('loading'); // loading, success, error, needs_login
    const [message, setMessage] = useState('Validating invitation...');
    const [familyName, setFamilyName] = useState('');

    useEffect(() => {
        const processInvite = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid invitation link.');
                return;
            }

            // Check if user is logged in
            if (!user?.id) {
                setStatus('needs_login');
                setMessage('Please log in or sign up to accept this invitation.');
                // Store token for after login
                localStorage.setItem('pending_invite_token', token);
                return;
            }

            try {
                // Call API to accept invite
                const result = await api.acceptInvite(token, user.id);

                if (result?.success) {
                    setStatus('success');
                    setFamilyName(result.familyName || 'the family');
                    setMessage(`You've joined ${result.familyName || 'the family'}!`);

                    // Redirect to home after 3 seconds
                    setTimeout(() => navigate('/'), 3000);
                } else {
                    setStatus('error');
                    setMessage(result?.error || 'This invitation is invalid or has expired.');
                }
            } catch (err) {
                console.error('Error accepting invite:', err);
                setStatus('error');
                setMessage('Something went wrong. Please try again.');
            }
        };

        processInvite();
    }, [token, user, navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'var(--color-bg-primary)'
        }}>
            <div className="card" style={{
                padding: '48px',
                textAlign: 'center',
                maxWidth: '400px',
                width: '100%'
            }}>
                {/* Icon */}
                <div style={{ marginBottom: '24px' }}>
                    {status === 'loading' && (
                        <Loader2 size={64} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                    )}
                    {status === 'success' && (
                        <CheckCircle size={64} color="#22c55e" />
                    )}
                    {status === 'error' && (
                        <XCircle size={64} color="#ef4444" />
                    )}
                    {status === 'needs_login' && (
                        <Users size={64} color="var(--color-primary)" />
                    )}
                </div>

                {/* Title */}
                <h1 style={{
                    margin: '0 0 16px',
                    fontSize: '24px',
                    fontWeight: '700',
                    color: status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : 'var(--color-text)'
                }}>
                    {status === 'loading' && 'Processing Invitation'}
                    {status === 'success' && 'Welcome to the Family!'}
                    {status === 'error' && 'Invitation Failed'}
                    {status === 'needs_login' && 'Join Family'}
                </h1>

                {/* Message */}
                <p style={{
                    margin: '0 0 24px',
                    color: 'var(--color-text-secondary)',
                    fontSize: '16px',
                    lineHeight: '1.5'
                }}>
                    {message}
                </p>

                {/* Actions */}
                {status === 'needs_login' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => navigate('/')}
                        >
                            Log In / Sign Up
                        </button>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                            After logging in, you'll be automatically added to the family.
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
                        Redirecting to home...
                    </p>
                )}

                {status === 'error' && (
                    <button
                        className="btn-secondary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => navigate('/')}
                    >
                        Go to Home
                    </button>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default JoinFamily;

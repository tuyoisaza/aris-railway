import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

const UpdatePasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle');
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setStatus('error');
            setMsg('Passwords do not match');
            return;
        }
        
        if (password.length < 8) {
            setStatus('error');
            setMsg('Password must be at least 8 characters');
            return;
        }

        setStatus('loading');

        try {
            const result = await api.updatePassword(password);
            
            if (result.error) {
                setStatus('error');
                setMsg(result.error);
            } else {
                setStatus('success');
                setMsg('Password updated successfully!');
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            }
        } catch (err) {
            setStatus('error');
            setMsg('An unexpected error occurred');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <Lock size={32} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800' }}>New Password</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                        Enter your new secure password below.
                    </p>
                </div>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '20px', background: '#ecfdf5', borderRadius: '8px', color: '#047857' }}>
                        <p>{msg}</p>
                        <p>Redirecting to dashboard...</p>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>New Password</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min 8 chars"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-alt)',
                                    fontSize: '16px'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Confirm Password</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-alt)',
                                    fontSize: '16px'
                                }}
                            />
                        </div>

                        {status === 'error' && (
                            <div style={{ fontSize: '14px', color: '#dc2626' }}>
                                {msg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                background: 'var(--color-primary)',
                                color: '#fff',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '16px',
                                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {status === 'loading' ? 'Updating...' : 'Update Password'}
                            {!status && <ArrowRight size={18} />}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UpdatePasswordPage;

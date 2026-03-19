import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        const res = await api.requestPasswordReset(email);

        if (res.success) {
            setStatus('success');
            setMsg(res.message);
        } else {
            setStatus('error');
            setMsg(res.error || t('common.error'));
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
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '24px',
                        padding: 0,
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={16} /> {t('auth.backToLogin')}
                </button>

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
                        <Mail size={32} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800' }}>{t('auth.resetPassword')}</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                        {t('auth.resetInstructions')}
                    </p>
                </div>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '20px', background: '#ecfdf5', borderRadius: '8px', color: '#047857' }}>
                        <p>{msg}</p>
                        <p style={{ fontSize: '14px', marginTop: '12px' }}>{t('auth.checkEmail')}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>{t('auth.emailAddress')}</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
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
                                opacity: status === 'loading' ? 0.7 : 1
                            }}
                        >
                            {status === 'loading' ? t('auth.sending') : t('auth.sendResetLink')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chrome } from 'lucide-react'; // Using Chrome icon as Google proxy
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useGlobal } from '../../context/GlobalContext';
import { supabase } from '../../services/supabase';

const LoginModal = ({ isOpen, onLogin }) => {
    const { t } = useTranslation();
    const { updateUser } = useGlobal();
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin // Redirect back to wherever we are
                }
            });
            if (error) throw error;
        } catch (err) {
            setError(t('auth.google') + ' ' + t('auth.login') + ' Failed: ' + err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation for Signup
        if (isSignup && password !== confirmPassword) {
            setError(t('auth.confirmPassword') + ' - Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            let data;
            if (isSignup) {
                data = await api.signup(email, password, name);
                if (data.error) throw new Error(data.error);
                alert(t('common.success') + '! Please check your email to confirm, then login.');
                setIsSignup(false);
            } else {
                data = await api.login(email, password);
                if (data.error) throw new Error(data.error);

                // Success
                if (data.user) {
                    updateUser({
                        name: data.user.user_metadata?.name || 'User',
                        email: data.user.email,
                        id: data.user.id
                    });
                    onLogin();
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)' }}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        style={{
                            background: 'var(--color-surface)',
                            padding: '40px',
                            borderRadius: '24px',
                            width: '90%',
                            maxWidth: '400px',
                            zIndex: 101,
                            textAlign: 'center',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                            color: 'var(--color-text)'
                        }}
                    >
                        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                            {isSignup ? t('auth.signup') : t('auth.login')}
                        </h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
                            {isSignup ? t('auth.noAccount').replace('?', '') : t('auth.haveAccount').replace('?', '')}
                        </p>

                        <button
                            onClick={handleGoogleLogin}
                            type="button"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)',
                                fontSize: '16px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                marginBottom: '24px',
                                transition: 'all 0.2s',
                                color: 'var(--color-text)'
                            }}
                            className="hover:bg-gray-50"
                        >
                            <Chrome size={20} /> {/* Proxy for Google G logo */}
                            {t('auth.orContinueWith')} {t('auth.google')}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                            <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                            <span style={{ color: '#aaa', fontSize: '14px' }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {isSignup && (
                                <input
                                    type="text"
                                    placeholder={t('auth.name')}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            )}
                            <input
                                type="email"
                                placeholder={t('auth.email')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <input
                                type="password"
                                placeholder={t('auth.password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            {isSignup && (
                                <input
                                    type="password"
                                    placeholder={t('auth.confirmPassword')}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            )}

                            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: 'var(--color-primary)',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {loading ? t('common.loading') : (isSignup ? t('auth.signup') : t('auth.login'))}
                            </button>
                        </form>

                        <button
                            onClick={() => setIsSignup(!isSignup)}
                            style={{
                                marginTop: '16px',
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            {isSignup ? t('auth.haveAccount') : t('auth.noAccount')}
                        </button>

                        {/* DEBUG SECTION */}
                        {localStorage.getItem('aris_debug_token') && (
                            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed #ccc' }}>
                                <p style={{ fontSize: '10px', color: 'red', fontWeight: 'bold', marginBottom: '8px' }}>DEBUG MODE ACTIVE</p>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm('Clear all local storage?')) {
                                                localStorage.clear();
                                                window.location.reload();
                                            }
                                        }}
                                        style={{ fontSize: '11px', padding: '4px 8px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', color: '#b91c1c' }}
                                    >
                                        Clear Local Data
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Quick fill for dev (optional, hardcoded for now just as example)
                                            setEmail('admin@aris.com');
                                            setPassword('password');
                                        }}
                                        style={{ fontSize: '11px', padding: '4px 8px', background: '#e0f2fe', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer', color: '#1d4ed8' }}
                                    >
                                        Quick Fill
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LoginModal;

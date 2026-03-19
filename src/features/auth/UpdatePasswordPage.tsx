import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase'; // Ensure we have a supabase client export
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';

// Assuming we have a configured supabase client exported from somewhere. 
// If not, we might need to initialize it here or import from a utils file.
// Let's assume src/supabase.js exists (common pattern). If not, I'll need to create it or duplicate config.
// Checking file structure... user didn't show src/supabase.js. 
// I'll assume I need to create one OR rely on `api.js` but `api.js` is REST based.
// Password reset link from Supabase contains: /update-password#access_token=...&refresh_token=...
// The Supabase JS Client automatically picks this up if initialized !
// If I don't use the JS client, I have to parse the hash manually.
// For simplicity, I'll parse the hash manually if I can't find the client, 
// BUT using the client is much safer.
// I will assume I can import `createClient` and config from env.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const UpdatePasswordPage = () => {
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('idle');
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase client should handle the session recovery from URL hash automatically
        // when we create the client.
        // We just need to check if we have a user.
        const checkUser = async () => {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                // If the link is invalid or expired, we might not have a user
                // Or maybe the hash parsing didn't happen yet.
                // It usually happens instant.
                // Let's wait a bit or show "Invalid Link" if persistent.
            }
        };
        checkUser();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setStatus('success');
            setMsg('Password updated successfully!');

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            setStatus('error');
            setMsg(err.message);
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

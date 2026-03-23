import React, { useState } from 'react';
import { Mic, Send, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTranslation } from 'react-i18next';

const ChatInput = ({ onSend, onMicClick }) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onSend(text);
            setText('');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            padding: '20px',
            background: 'linear-gradient(to top, var(--color-bg) 80%, rgba(0,0,0,0))',
            zIndex: 20
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                position: 'relative'
            }}>
                <form onSubmit={handleSubmit} style={{
                    background: 'var(--color-surface)',
                    borderRadius: '32px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 8px 8px 20px',
                    gap: '12px',
                    color: 'var(--color-text)'
                }}>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={t('inputPlaceholder')}
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            fontSize: '16px',
                            fontFamily: 'inherit',
                            background: 'transparent',
                            color: 'var(--color-text)'
                        }}
                    />

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>
                            <Paperclip size={20} />
                        </button>

                        {text.trim() ? (
                            <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                type="submit"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'var(--color-primary)',
                                    color: '#fff',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <Send size={18} />
                            </motion.button>
                        ) : (
                            <button
                                type="button"
                                onClick={onMicClick}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text)',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <Mic size={20} />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatInput;

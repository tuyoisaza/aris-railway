import React, { useState, useRef } from 'react';
import { Mic, Send, Paperclip, X, Image, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTranslation } from 'react-i18next';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ChatInput = ({ onSend, onMicClick }) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            alert('File size must be less than 10MB');
            return;
        }

        setAttachment(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => setAttachmentPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setAttachmentPreview(null);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachment = () => {
        setAttachment(null);
        setAttachmentPreview(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim() && !attachment) return;

        if (attachment) {
            onSend(text, attachment);
            setAttachment(null);
            setAttachmentPreview(null);
        } else {
            onSend(text);
        }
        setText('');
    };

    const getFileIcon = () => {
        if (!attachment) return <Paperclip size={20} />;
        if (attachment.type.startsWith('image/')) return <Image size={20} />;
        return <FileText size={20} />;
    };

    const getFileTypeLabel = () => {
        if (!attachment) return '';
        if (attachment.type.startsWith('image/')) return 'Image';
        if (attachment.type.includes('pdf')) return 'PDF';
        if (attachment.type.includes('text')) return 'Text';
        return 'File';
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
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.txt,.doc,.docx"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {attachment && (
                    <div style={{
                        marginBottom: '8px',
                        padding: '12px',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        {attachmentPreview ? (
                            <img 
                                src={attachmentPreview} 
                                alt="Attachment preview" 
                                style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    objectFit: 'cover',
                                    borderRadius: '8px' 
                                }} 
                            />
                        ) : (
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'var(--color-primary-light)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-primary)'
                            }}>
                                {getFileIcon()}
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {attachment.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                                {getFileTypeLabel()} • {(attachment.size / 1024).toFixed(1)} KB
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={removeAttachment}
                            style={{
                                background: 'var(--color-bg-tertiary)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--color-text-secondary)'
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

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
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                color: attachment ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                                transition: 'color 0.2s'
                            }}
                        >
                            {getFileIcon()}
                        </button>

                        {text.trim() || attachment ? (
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

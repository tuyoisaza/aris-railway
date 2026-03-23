import React from 'react';
import { Volume2, Square, Loader2, Copy, Check } from 'lucide-react';
import { VoiceService } from '../../../services/voice';
import { useTranslation } from 'react-i18next';
import MarkdownRenderer from '../MarkdownRenderer';
import ChatOptions from '../ChatOptions';

interface ChatMessageProps {
    msg: any;
    idx: number;
    speakingMessageIndex: number | null;
    copiedIndex: number | null;
    language: string;
    onCopy: (text: string, idx: number) => void;
    onSend: (text: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
    msg,
    idx,
    speakingMessageIndex,
    copiedIndex,
    language,
    onCopy,
    onSend
}) => {
    const { t } = useTranslation();
    const isUser = msg.role === 'user';
    const content = msg.text || msg.content || '';

    const handleCopy = () => {
        onCopy(content, idx);
    };

    const handleSpeak = () => {
        if (speakingMessageIndex === idx) {
            VoiceService.stop();
        } else {
            VoiceService.speak(content, null, language);
        }
    };

    const handleRead = () => {
        if (speakingMessageIndex === idx) {
            VoiceService.stop();
        } else {
            VoiceService.speak(content, null, language);
        }
    };

    return (
        <div style={{
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            maxWidth: isUser ? '80%' : '95%',
            padding: '16px 20px',
            borderRadius: '20px',
            borderBottomRightRadius: isUser ? '4px' : '20px',
            borderBottomLeftRadius: isUser ? '20px' : '4px',
            background: isUser ? 'var(--color-primary)' : 'var(--color-bubble-ai)',
            color: isUser ? '#fff' : 'var(--color-text)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        }}>
            <div style={{ width: '100%' }}>
                {content ? (
                    <MarkdownRenderer content={content} />
                ) : (
                    <span style={{ opacity: 0.5 }}>Empty message</span>
                )}
            </div>

            {msg.options && Array.isArray(msg.options) && (
                <ChatOptions options={msg.options} onSelect={onSend} />
            )}

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '8px'
            }}>
                {copiedIndex === idx ? (
                    <span style={{ fontSize: '12px', opacity: 0.7 }}><Check size={14} /></span>
                ) : (
                    <button
                        onClick={handleCopy}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)',
                            display: 'flex', alignItems: 'center', padding: '4px'
                        }}
                        title="Copy"
                    >
                        <Copy size={14} />
                    </button>
                )}

                {!isUser && (
                    <button
                        onClick={handleRead}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)',
                            display: 'flex', alignItems: 'center', padding: '4px'
                        }}
                        title={speakingMessageIndex === idx ? "Stop" : "Read aloud"}
                    >
                        {speakingMessageIndex === idx ? (
                            <Square size={14} fill="currentColor" />
                        ) : (
                            <Volume2 size={14} />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;

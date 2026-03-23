import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ChatMessage from './ChatMessage';
import ArisCircle from '../../presence/ArisCircle';

interface MessageListProps {
    messages: any[];
    circleState: 'idle' | 'listening' | 'thinking' | 'speaking';
    speakingMessageIndex: number | null;
    copiedIndex: number | null;
    isFocusMode: boolean;
    liveTranscript: string;
    language: string;
    onCopy: (text: string, idx: number) => void;
    onSend: (text: string) => void;
    onCircleClick: () => void;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    circleState,
    speakingMessageIndex,
    copiedIndex,
    isFocusMode,
    liveTranscript,
    language,
    onCopy,
    onSend,
    onCircleClick
}) => {
    const { t } = useTranslation();

    return (
        <>
            {messages.map((msg, idx) => (
                <ChatMessage
                    key={idx}
                    msg={msg}
                    idx={idx}
                    speakingMessageIndex={speakingMessageIndex}
                    copiedIndex={copiedIndex}
                    language={language}
                    onCopy={onCopy}
                    onSend={onSend}
                />
            ))}

            {!isFocusMode && circleState === 'thinking' && messages.length > 0 && (
                <div style={{
                    alignSelf: 'flex-start',
                    maxWidth: '80%',
                    padding: '16px 24px',
                    borderRadius: '20px',
                    borderBottomLeftRadius: '4px',
                    background: 'var(--color-bubble-ai)',
                    color: 'var(--color-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Loader2 size={18} className="spin-animation" />
                    <span style={{ fontSize: '14px', fontWeight: 500, opacity: 0.7 }}>
                        {t('voice.thinking')}
                    </span>
                </div>
            )}

            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px 0',
                marginTop: '20px'
            }}>
                <div
                    style={{
                        width: '80px',
                        height: '80px',
                        cursor: 'pointer',
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                    onClick={onCircleClick}
                >
                    <ArisCircle state={circleState} size={80} />

                    {circleState === 'listening' && liveTranscript && (
                        <div style={{
                            position: 'absolute',
                            bottom: '-120px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            color: 'var(--color-primary)',
                            fontWeight: '600',
                            fontSize: '14px',
                            animation: 'fadeIn 0.3s ease-out',
                            whiteSpace: 'pre-wrap',
                            maxWidth: '300px',
                            width: 'max-content',
                            textAlign: 'center',
                            lineHeight: '1.4',
                            zIndex: 30
                        }}>
                            {liveTranscript}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MessageList;

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { api } from '../../services/api';
import { useGlobal } from '../../context/GlobalContext';
import { VoiceService } from '../../services/voice';
import { websocketClient } from '../../services/websocket/WebSocketClient';
import '../../utils/cacheManager';
import '../../utils/debugConfig';

import ChatSidebar from './ChatSidebar';
import ChatInput from './ChatInput';
import PinModal from './PinModal';
import LoginModal from '../auth/LoginModal';
import ConversationHeader from './components/ConversationHeader';
import MessageList from './components/MessageList';
import InitialState from './components/InitialState';

const ConversationPage = () => {
    const { t } = useTranslation();
    const { messages, addMessage, activeConversationId, selectConversation, sendMessage, family, user, language, loadingConversation } = useGlobal();
    
    const [circleState, setCircleState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [familyPresence, setFamilyPresence] = useState<{[key: string]: any}>({});

    const recognitionRef = useRef<any>(null);
    const isSpeakingRef = useRef(false);
    const lastXpRef = useRef({});
    const hasSentInitialRef = useRef(false);
    const isLoadingConversationRef = useRef(false);
    const { id: urlId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribes = [
            websocketClient.subscribe('presence_update', () => setFamilyPresence(websocketClient.getFamilyPresence())),
            websocketClient.subscribe('user_status_change', () => setFamilyPresence(websocketClient.getFamilyPresence())),
            websocketClient.subscribe('connection_established', (data) => {
                setFamilyPresence(data.familyPresence || {});
            }),
            websocketClient.subscribe('xp_notification', (data) => {
                addMessage('system', `🌟 ${data.name || 'Family member'} earned +${data.xpAmount} XP in ${data.reason}!`, {
                    type: 'family_xp_gain',
                    xpAmount: data.xpAmount,
                    reason: data.reason,
                    userId: data.userId
                });
            }),
            websocketClient.subscribe('error', () => setCircleState('idle'))
        ];

        return () => unsubscribes.forEach(fn => fn());
    }, [addMessage]);

    useEffect(() => {
        if (urlId && urlId !== activeConversationId && !isLoadingConversationRef.current) {
            isLoadingConversationRef.current = true;
            selectConversation(urlId).finally(() => {
                isLoadingConversationRef.current = false;
            });
        }
    }, [urlId, activeConversationId]);

    useEffect(() => {
        if (activeConversationId && (!urlId || urlId !== activeConversationId)) {
            navigate(`/conversation/${activeConversationId}`, { replace: true });
        }
    }, [activeConversationId, urlId]);

    useEffect(() => {
        return () => {
            VoiceService.stop();
            if (recognitionRef.current) VoiceService.stopListening(recognitionRef.current);
        };
    }, []);

    useEffect(() => {
        if (circleState === 'speaking' && messages.length > 0) {
            setSpeakingMessageIndex(messages.length - 1);
        }
    }, [circleState, messages]);

    useEffect(() => {
        if (!user?.id) return;
        
        const checkXpGains = async () => {
            try {
                const notificationsData = await api.getSkillNotifications();
                const notifications = Array.isArray(notificationsData) ? notificationsData : [];
                
                for (const notification of notifications) {
                    addMessage('system', `🌟 +${notification.xpAmount} XP earned!`, {
                        type: 'xp_gain',
                        xpAmount: notification.xpAmount,
                        skill: notification.skillId || 'Skill'
                    });
                }
            } catch (error) {
                console.error('Failed to check XP gains:', error);
            }
        };

        if (Object.keys(lastXpRef.current).length === 0) {
            checkXpGains();
        }

        const interval = setInterval(checkXpGains, 5000);
        return () => clearInterval(interval);
    }, [user?.id, addMessage]);

    const handleCircleInteraction = () => {
        if (circleState === 'idle') {
            setCircleState('listening');
            setLiveTranscript('');
            recognitionRef.current = VoiceService.listen(
                (text, isFinal) => {
                    setLiveTranscript(text);
                    if (isFinal) {
                        processUserMessage(text, language);
                        setLiveTranscript('');
                    }
                },
                (error) => {
                    console.error("Voice Error:", error);
                    setCircleState('idle');
                    setLiveTranscript('');
                },
                () => {},
                language
            );
        } else if (circleState === 'listening') {
            VoiceService.stopListening(recognitionRef.current);
            recognitionRef.current = null;
        } else if (circleState === 'speaking') {
            VoiceService.stop();
            setCircleState('idle');
            isSpeakingRef.current = false;
            setSpeakingMessageIndex(null);
        } else if (circleState === 'thinking') {
            setCircleState('listening');
        }
    };

    const processUserMessage = async (text: string, lang: string) => {
        setCircleState('thinking');
        websocketClient.sendTypingIndicator(true);
        
        try {
            await sendMessage(text);
        } finally {
            setCircleState('idle');
            websocketClient.sendTypingIndicator(false);
        }
    };

    const handleSend = (text: string) => {
        setCircleState('thinking');
        websocketClient.sendTypingIndicator(true);
        
        sendMessage(text).then(() => {
            setCircleState('idle');
            websocketClient.sendTypingIndicator(false);
        });
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handlePinSuccess = () => {
        setIsFocusMode(true);
        setShowPinModal(false);
    };

    return (
        <>
            <ConversationHeader
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isFocusMode={isFocusMode}
                setIsFocusMode={setIsFocusMode}
                showPinModal={showPinModal}
                setShowPinModal={setShowPinModal}
                userPin={user?.pin || user?.preferences?.focusPin}
                familyPin={family?.pin}
            />

            <PinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={handlePinSuccess}
                userPin={user?.pin || user?.preferences?.focusPin}
                familyPin={family?.pin}
            />

            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingBottom: isFocusMode ? 0 : '100px',
                paddingTop: '60px'
            }}>
                {loadingConversation ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        color: 'var(--color-text-secondary)'
                    }}>
                        <Loader2 size={32} className="spin-animation" />
                        <span>Loading conversation...</span>
                    </div>
                ) : !isFocusMode && messages.length > 0 ? (
                    <div style={{
                        flex: 1,
                        width: '100%',
                        maxWidth: '800px',
                        overflowY: 'auto',
                        padding: '20px',
                        paddingBottom: '240px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        zIndex: 10
                    }}>
                        <MessageList
                            messages={messages}
                            circleState={circleState}
                            speakingMessageIndex={speakingMessageIndex}
                            copiedIndex={copiedIndex}
                            isFocusMode={isFocusMode}
                            liveTranscript={liveTranscript}
                            language={language}
                            onCopy={handleCopy}
                            onSend={handleSend}
                            onCircleClick={handleCircleInteraction}
                        />
                    </div>
                ) : (
                    <InitialState
                        circleState={circleState}
                        liveTranscript={liveTranscript}
                        onCircleClick={handleCircleInteraction}
                    />
                )}
            </div>

            {!isFocusMode && (
                <>
                    <ChatSidebar
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        onNewChat={() => window.location.href = '/conversation'}
                    />
                    <ChatInput onSend={handleSend} onMicClick={handleCircleInteraction} />
                </>
            )}
        </>
    );
};

export default ConversationPage;

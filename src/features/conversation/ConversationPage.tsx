
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Maximize2, Minimize2, Volume2, Square, Loader2, Copy, Check, Users, Wifi, WifiOff } from 'lucide-react';

import { api } from '../../services/api';
import { useGlobal } from '../../context/GlobalContext';
import { VoiceService } from '../../services/voice';
import { websocketClient } from '../../services/websocket/WebSocketClient';
import MilestoneIndicator from '../../components/MilestoneIndicator';
import '../../utils/cacheManager'; // Load cache utilities
import '../../utils/debugConfig'; // Load debug utilities
import { logMessageDebug } from '../../utils/chatDebug';

import ArisCircle from '../presence/ArisCircle';
import ChatSidebar from './ChatSidebar';
import ChatInput from './ChatInput';
import ChatOptions from './ChatOptions';
import PinModal from './PinModal';
import LoginModal from '../auth/LoginModal';
import ProjectProposalCard from '../projects/ProjectProposalCard';
import MarkdownRenderer from './MarkdownRenderer';

const ConversationPage = () => {
    const { t } = useTranslation();
    const { messages, addMessage, activeConversationId, selectConversation, sendMessage, clearMessages, family, user, language, loadingConversation } = useGlobal();
    const [circleState, setCircleState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const [familyPresence, setFamilyPresence] = useState<{[key: string]: any}>({});
    const [wsConnectionStatus, setWsConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

    // WebSocket integration
    useEffect(() => {
        // Subscribe to WebSocket events
        const unsubscribePresence = websocketClient.subscribe('presence_update', (data) => {
            setFamilyPresence(websocketClient.getFamilyPresence());
        });

        const unsubscribeUserStatus = websocketClient.subscribe('user_status_change', (data) => {
            setFamilyPresence(websocketClient.getFamilyPresence());
        });

        const unsubscribeConnection = websocketClient.subscribe('connection_established', (data) => {
            setFamilyPresence(data.familyPresence || {});
            setWsConnectionStatus('connected');
        });

        const unsubscribeXP = websocketClient.subscribe('xp_notification', (data) => {
            addMessage('system', `🌟 ${data.name || 'Family member'} earned +${data.xpAmount} XP in ${data.reason}!`, {
                type: 'family_xp_gain',
                xpAmount: data.xpAmount,
                reason: data.reason,
                userId: data.userId
            });
        });

        const unsubscribeError = websocketClient.subscribe('error', (data) => {
            console.error('WebSocket error:', data);
            setWsConnectionStatus('disconnected');
        });

        // Update connection status
        setWsConnectionStatus(websocketClient.getConnectionStatus());

        return () => {
            unsubscribePresence();
            unsubscribeUserStatus();
            unsubscribeConnection();
            unsubscribeXP();
            unsubscribeError();
        };
    }, [addMessage]);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleClearCache = () => {
        if (typeof (window as any).clearARISCache === 'function') {
            (window as any).clearARISCache();
        }
    };

    // State for voice interaction
    const recognitionRef = useRef(null);
    const { id: urlId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const hasSentInitialRef = useRef(false);

    // Sync URL -> State (Load chat by ID from URL)
    useEffect(() => {
        if (urlId && urlId !== activeConversationId) {
            console.log("[Conversation] URL ID differs from active, selecting:", urlId);
            selectConversation(urlId);
        }
    }, [urlId, activeConversationId, selectConversation]);

    // Sync State -> URL (Update URL when active ID changes)
    useEffect(() => {
        if (activeConversationId && (!urlId || urlId !== activeConversationId)) {
            console.log("[Conversation] Active ID changed, updating URL:", activeConversationId);
            navigate(`/conversation/${activeConversationId}`, { replace: true });
        }
    }, [activeConversationId, urlId, navigate]);
    const isSpeakingRef = useRef(false); // Track if TTS is active to handle interruption correctly
    const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
    const [liveTranscript, setLiveTranscript] = useState(''); // For "bit by bit" feedback
    const [hasWarned, setHasWarned] = useState(false);
    const lastXpRef = useRef({}); // Track last XP by skill_id to detect gains

    // (Logic moved to main useEffect below)


    // Hardcoded warning logic moved to BadgeService (backend)
    // useEffect(() => {
    //     const userCount = messages.filter(m => m.role === 'user').length;
    //     // Trigger warning at 15 interactions
    //     if (userCount >= 15 && !hasWarned) {
    //         addMessage('system', "You've reached 15 interactions. Aris suggests exploring a new topic to keep learning fresh!");
    //         setHasWarned(true);
    //     }
    // }, [messages, hasWarned, addMessage]);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            VoiceService.stop(); // Stop TTS
            if (recognitionRef.current) VoiceService.stopListening(recognitionRef.current);
        };
    }, []);

    // Auto-sync speaking index for UI feedback
    useEffect(() => {
        if (circleState === 'speaking' && messages.length > 0) {
            setSpeakingMessageIndex(messages.length - 1);
        }
    }, [circleState, messages]);

    const userPreferences = user?.preferences || {};
    // Default to enabled voice if user hasn't set preferences
    const voicePrefs = {
        enabled: true, // Enable voice by default
        uri: undefined,
        ...userPreferences.voice // Override with user settings if they exist
    };

    const handleCircleInteraction = () => {
        // Allow UI selector to drive language, even in active chats.
        // GlobalContext handles syncing language on chat load, so 'language' var is correct.
        let currentLang = language;

        // 1. If IDLE -> Start Listening
        if (circleState === 'idle') {
            setCircleState('listening');
            setLiveTranscript('');
            recognitionRef.current = VoiceService.listen(
                (text, isFinal) => {
                    setLiveTranscript(text);
                    if (isFinal) {
                        console.log("Transcribed Final:", text);
                        processUserMessage(text, currentLang);
                        setLiveTranscript('');
                    }
                },
                (error) => {
                    console.error("Voice Error:", error);
                    setCircleState('idle');
                    setLiveTranscript('');
                },
                () => {
                    // On End of recognition session (if stopped naturally or manually)
                },
                currentLang
            );
        }
        // 2. If LISTENING -> Stop Listening
        else if (circleState === 'listening') {
            VoiceService.stopListening(recognitionRef.current);
            recognitionRef.current = null;
        }
        // 3. If SPEAKING -> Stop Speaking (Cancel)
        else if (circleState === 'speaking') {
            VoiceService.stop();
            setCircleState('idle');
            isSpeakingRef.current = false;
            setSpeakingMessageIndex(null);
        }
        // 4. If THINKING -> Optional: Cancel or Start Over?
        // For now, let's allow "Start Over" (Interrupt thought)
        else if (circleState === 'thinking') {
            // Just restart listening
            setCircleState('idle');
        }
    };

const processUserMessage = async (text, lang) => {
        setCircleState('thinking');

        // Logic to get AI response...
        const responseText = await sendMessage(text);
        
        console.log('[ConversationPage] 🔊 VOICE RESPONSE ANALYSIS:', { 
            text: responseText, 
            length: responseText?.length,
            isEmpty: !responseText || responseText.trim() === '',
            timestamp: new Date().toISOString(),
            voiceEnabled: voicePrefs.enabled,
            language: lang
        });

        // Validate response before proceeding
        if (!responseText || responseText.trim() === '') {
            console.error('[ConversationPage] Empty response received, skipping voice synthesis');
            setCircleState('idle');
            return;
        }

        if (voicePrefs.enabled) {
            setCircleState('speaking');
            isSpeakingRef.current = true;

            // Speak response in the SAME language as the input
            VoiceService.speak(responseText, () => {
                console.log("Speech ended.");
                if (isSpeakingRef.current) {
                    setCircleState('idle');
                    isSpeakingRef.current = false;
                    setSpeakingMessageIndex(null);
                }
            }, lang, voicePrefs.uri);
        } else {
            setCircleState('idle');
        }
    };

    const handleNewChat = () => {
        // Force full reload to ensure clean state and avoid React Router / State race conditions
        window.location.href = '/conversation';
    };

    // Effect to handle navigation from other pages (e.g. Topic Layers)
    useEffect(() => {
        // Check both State and Query Params
        const state = location.state as { initialMessage?: string } | null;
        const searchParams = new URLSearchParams(location.search);
        const queryMessage = searchParams.get('initialMessage');

        const initialMessage = state?.initialMessage || queryMessage;

        if (initialMessage && !hasSentInitialRef.current) {
            console.log("[Conversation] Processing initial message:", initialMessage);
            hasSentInitialRef.current = true;

            // Ensure we treat this as a fresh start if requested via layer click
            if (messages.length > 0) {
                // Manually clear state instead of calling handleNewChat to avoid navigating away (and losing query params)
                setCircleState('idle');
                clearMessages();
                setIsSidebarOpen(false);
            }

            setTimeout(() => {
                processUserMessage(initialMessage, language);

                // Clear state/url so it doesn't re-run
                if (state?.initialMessage) {
                    window.history.replaceState({}, document.title);
                }
                if (queryMessage) {
                    // Remove param from URL without reloading
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, newUrl);
                }
            }, 500);
        }
    }, [location.state, location.search]);

    // XP Check useEffect
    useEffect(() => {
        const checkXpGains = async () => {
            if (!user?.id) return;

            try {
                // First check XP notifications (primary method)
                const notificationsData = await api.getSkillNotifications();
                const notifications = Array.isArray(notificationsData) 
                    ? notificationsData 
                    : Array.isArray(notificationsData?.data) 
                        ? notificationsData.data 
                        : [];
                
                for (const notification of notifications) {
                    addMessage('system', `🌟 +${notification.xpAmount} XP earned!`, {
                        type: 'xp_gain',
                        xpAmount: notification.xpAmount,
                        skill: notification.skillId || 'Skill'
                    });
                }

                // Also check skill progress for backup
                const skillsData = await api.getSkills();
                const skills = Array.isArray(skillsData) 
                    ? skillsData 
                    : Array.isArray(skillsData?.data) 
                        ? skillsData.data 
                        : [];
                const relevantSkills = Array.isArray(skills) ? skills.filter(skill => (skill.xp || 0) > 0) : [];
                
                for (const skill of relevantSkills) {
                    const skillXp = skill.xp || 0;
                    const skillId = skill.skillId || skill.id;
                    if (skillXp > (lastXpRef.current[skillId] || 0)) {
                        const xpGained = skillXp - (lastXpRef.current[skillId] || 0);
                        lastXpRef.current[skillId] = skillXp;
                        
                        if (notifications.length === 0) {
                            addMessage('system', `🌟 +${xpGained} XP earned!`, {
                                type: 'xp_gain',
                                xpAmount: xpGained,
                                skill: skill.skill?.title || 'Skill'
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to check XP gains:', error?.message || error);
            }
        };

        // Initialize XP tracking
        if (user?.id && Object.keys(lastXpRef.current).length === 0) {
            checkXpGains(); // Initial check
        }

        // Check XP gains every 5 seconds
        const interval = setInterval(checkXpGains, 5000);
        return () => clearInterval(interval);
    }, [user?.id, addMessage]);

    const handleMicClick = () => {
        // Trigger same logic as circle click
        handleCircleInteraction();
    };

    const handleSend = (text) => {
        // Debug Trigger for Listening UI Verification
        if (text.toLowerCase() === '/debug listen') {
            const testText = "This is a test transcript to verify positioning. It should wrap to multiple lines if it gets long enough, so we can check if it overlaps properly or if it sits nicely below the listening tag.";
            setCircleState('listening');
            setLiveTranscript(testText);
            console.log("Debug: Force listening state");
            return;
        }
        if (text.toLowerCase() === '/debug idle') {
            setCircleState('idle');
            setLiveTranscript('');
            return;
        }

        // Voice Debug Commands
        if (text.toLowerCase() === '/debug voice') {
            // Test text-to-speech
            setCircleState('speaking');
            isSpeakingRef.current = true;
            VoiceService.speak("Voice output is working! If you can hear this, the text-to-speech system is functioning correctly.", () => {
                setCircleState('idle');
                isSpeakingRef.current = false;
            }, language, undefined);
            return;
        }
        if (text.toLowerCase() === '/debug listen') {
            // Test speech recognition with forced listening state
            setCircleState('listening');
            setLiveTranscript('Listening for speech... Try saying something.');
            recognitionRef.current = VoiceService.listen(
                (text, isFinal) => {
                    setLiveTranscript(text + (isFinal ? ' [FINAL]' : ' [interim]'));
                    if (isFinal) {
                        setCircleState('idle');
                        setLiveTranscript('Speech recognition working! Final transcript: ' + text);
                    }
                },
                (error) => {
                    console.error("Voice Error:", error);
                    setCircleState('idle');
                    setLiveTranscript('Voice error: ' + error);
                },
                () => {
                    setCircleState('idle');
                    console.log("Voice test ended");
                },
                language
            );
            return;
        }

        // Debug Triggers for Events
        if (text.toLowerCase().startsWith('/event ')) {
            const type = text.split(' ')[1].toUpperCase();
            if (type === 'DEPTH' || type === 'BRANCH') {
                const milestoneType = type;
                const topicName = 'Quantum Mechanics'; // Placeholder
                const displayText = milestoneType === 'DEPTH' ? `${topicName} consolidated` : `${topicName} opened`;

                addMessage('system', displayText, {
                    type: 'milestone',
                    milestoneType: milestoneType,
                    topic: topicName
                });

                console.log("Debug Event Triggered via addMessage:", type);
            }
            return;
        }

        // Text input sends don't automatically trigger voice output in this design,
        // but if we want to, we can call processUserMessage.
        // For now, standard text send:
        setCircleState('thinking'); // Update to match rendering condition

        // Send typing indicator via WebSocket
        websocketClient.sendTypingIndicator(true);

        // We must await the response to clear the thinking state
        sendMessage(text).then(() => {
            setCircleState('idle');
            websocketClient.sendTypingIndicator(false);
        });
    };

    return (
        <>
            <LoginModal isOpen={!user?.id} onLogin={() => { }} />

            {/* Family Presence Indicator */}
            {Object.keys(familyPresence).length > 0 && (
                <div style={{
                    position: 'fixed',
                    top: '70px',
                    right: '20px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    zIndex: 40,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    <Users size={16} style={{ color: 'var(--color-text-secondary)' }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text)' }}>
                        {Object.values(familyPresence).filter((p: any) => websocketClient.isUserOnline(p.userId)).length} online
                    </span>
                </div>
            )}

            {/* WebSocket Connection Status */}
            <div style={{
                position: 'fixed',
                top: '70px',
                left: '80px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '8px 12px',
                zIndex: 40,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: wsConnectionStatus === 'connected' ? '#10b981' : '#ef4444'
            }}>
                {wsConnectionStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span style={{ fontWeight: '500' }}>
                    {wsConnectionStatus === 'connected' ? 'Live' : 'Offline'}
                </span>
            </div>

            {!isFocusMode && (
                <>
                    <ChatSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNewChat={handleNewChat} />
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            left: '20px',
                            zIndex: 50,
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            padding: '10px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            color: 'var(--color-text)'
                        }}
                    >
                        <div style={{ width: '24px', height: '2px', background: 'currentColor', marginBottom: '4px' }}></div>
                        <div style={{ width: '16px', height: '2px', background: 'currentColor', marginBottom: '4px' }}></div>
                        <div style={{ width: '24px', height: '2px', background: 'currentColor' }}></div>
                    </button>
                    <ChatInput onSend={handleSend} onMicClick={handleMicClick} />
                </>
            )}

            {/* Focus Mode Toggle */}
            <button
                onClick={() => {
                    if (isFocusMode) {
                        // Instead of prompt, show modal
                        setShowPinModal(true);
                    } else {
                        setIsFocusMode(true);
                    }
                }}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 30,
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    opacity: isFocusMode ? 0.5 : 1
                }}
            >
                {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                <span style={{ fontSize: '12px', fontWeight: '600' }}>{isFocusMode ? 'Exit Focus' : 'Focus'}</span>
            </button>

            {/* PIN Verification Modal */}
            <PinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={() => {
                    setIsFocusMode(false);
                    setShowPinModal(false);
                }}
                userPin={user?.pin || user?.preferences?.focusPin}
                familyPin={family?.pin}
            />

            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: isFocusMode ? 0 : '100px', paddingTop: '60px' }}>

                {/* Chat History */}
                {loadingConversation ? (
                    <div style={{
                        flex: 1,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
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
                        padding: '20px 20px 240px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        zIndex: 10
                    }}>
                        {messages.map((msg, idx) => {
                            // CLEAN IMPLEMENTATION: Rely on GlobalContext parsing
                            let isMilestone = false;
                            let milestoneData: any = {};

// 1. Check for Explicit Milestone Object
                            if (msg.type === 'milestone') {
                                isMilestone = true;
                                milestoneData = { ...msg };
                                
                                console.log('[ConversationPage] 🎯 MILESTONE (TYPE FIELD):', { 
                                    type: msg.type,
                                    milestoneType: msg.milestoneType,
                                    topic: msg.topic,
                                    timestamp: new Date().toISOString(),
                                    messageId: msg.id || 'unknown',
                                    rawMessage: msg
                                });
                            }
// 2. Legacy/Fallback
                            else if (msg.role === 'system' && msg.milestoneType) {
                                isMilestone = true;
                                milestoneData = { ...msg };
                                
                                console.log('[ConversationPage] 🎯 MILESTONE (SYSTEM ROLE):', { 
                                    role: msg.role,
                                    milestoneType: msg.milestoneType,
                                    topic: msg.topic,
                                    timestamp: new Date().toISOString(),
                                    messageId: msg.id || 'unknown',
                                    rawMessage: msg
                                });
                            }
                            // 3. Project Proposal (System Message Wrapper)
                            else if (msg.role === 'system' && msg.text && msg.text.startsWith('{')) {
                                try {
                                    const parsed = JSON.parse(msg.text);
                                    if (parsed.type === 'milestone') {
                                        isMilestone = true;
                                        milestoneData = parsed;
} else if (parsed.type === 'proposal') {
                                        // Skip rendering here - handled by metadata section below to prevent duplication
                                        console.log('[ConversationPage] Proposal detected via JSON, skipping render - will handle via metadata');
                                        return null;
} else if (parsed.type === 'show_badge' || parsed.type === 'BADGE' || parsed.action?.type === 'show_badge') {
                                        // Handle Badge Artifact
                                        console.log('[ConversationPage] 🎯 BADGE DETECTED:', { 
                                            parsed, 
                                            type: parsed.type, 
                                            action: parsed.action?.type,
                                            timestamp: new Date().toISOString(),
                                            messageId: msg.id || 'unknown'
                                        });
                                        
                                        const badge = parsed.payload || parsed.action?.payload || parsed.badge;
                                        
                                        if (!badge || typeof badge !== 'object') {
                                            console.error('[ConversationPage] Invalid badge data:', {
                                                parsed: parsed,
                                                badge: badge,
                                                payload: parsed.payload,
                                                actionPayload: parsed.action?.payload
                                            });
                                            
                                            // Fallback badge display
                                            return (
                                                <div key={idx} style={{ alignSelf: 'center', margin: '20px 0' }}>
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #6B7280 0%, #3B82F6 100%)',
                                                        color: 'white',
                                                        padding: '20px 30px',
                                                        borderRadius: '16px',
                                                        textAlign: 'center',
                                                        boxShadow: '0 4px 15px rgba(107, 114, 128, 0.3)'
                                                    }}>
                                                        <div style={{
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            marginBottom: '8px'
                                                        }}>
                                                            🏆 Achievement Unlocked!
                                                        </div>
                                                        <div style={{
                                                            fontSize: '14px',
                                                            opacity: 0.9
                                                        }}>
                                                            You've earned recognition for your progress.
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={idx} style={{ alignSelf: 'center', margin: '20px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                                <div style={{
                                                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                                                    color: 'white',
                                                    padding: '24px 40px',
                                                    borderRadius: '24px',
                                                    boxShadow: '0 10px 40px rgba(255, 107, 107, 0.4)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                    animation: 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                    border: '2px solid rgba(255,255,255,0.2)'
                                                }}>
                                                    <div style={{
                                                        fontSize: '48px',
                                                        background: 'rgba(255,255,255,0.2)',
                                                        borderRadius: '50%',
                                                        width: '80px',
                                                        height: '80px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                                    }}>{badge.icon || '🏆'}</div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{
                                                            fontWeight: '800',
                                                            fontSize: '24px',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '1px',
                                                            marginBottom: '4px'
}}>{badge.name || "New Badge!"}</div>
                                                        <div style={{
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            opacity: 0.9,
                                                            maxWidth: '200px',
                                                            lineHeight: '1.4'
                                                        }}>{badge.description || "Way to go!"}</div>
                                                        
                                                        {/* Debug info */}
                                                        {process.env.NODE_ENV === 'development' && (
                                                            <div style={{
                                                                fontSize: '10px',
                                                                color: '#666',
                                                                marginTop: '10px',
                                                                textAlign: 'center',
                                                                fontFamily: 'monospace'
                                                            }}>
                                                                DEBUG: {JSON.stringify(badge)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                } catch (e) {
                                    // Not JSON, ignore
                                }
                            }

                            // 1b. Check for Project Proposal (Metadata from GlobalContext)
                            if (msg.type === 'proposal' && msg.projectData) {
                                return (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
                                        {/* Optional Introduction Text */}
                                        {(msg.text || msg.content) && (
                                            <div style={{
                                                alignSelf: 'flex-start',
                                                maxWidth: '95%',
                                                padding: '16px 20px',
                                                borderRadius: '20px',
                                                borderTopLeftRadius: '2px',
                                                backgroundColor: '#FFFFFF',
                                                color: '#333333',
                                                lineHeight: '1.6',
                                                fontSize: '16px',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                            }}>
                                                <MarkdownRenderer content={msg.text || msg.content} />
                                            </div>
                                        )}

                                        {/* The Proposal Card */}
                                        <div style={{ alignSelf: 'center', margin: '8px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                            <div style={{ width: '60%', minWidth: '300px' }}>
                                                <ProjectProposalCard
                                                    projectData={msg.projectData}
                                                    onProposed={() => { }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            if (isMilestone) {
                                return (
                                    <MilestoneIndicator
                                        key={idx}
                                        type={milestoneData.milestoneType || 'DEPTH'}
                                        topic={milestoneData.topic || 'Topic'}
                                    />
                                );
                            }

                            const rawContent = msg.text || msg.content || '';

// Skip empty system messages or internal context messages
                            if (msg.role === 'system') {
                                if (!rawContent || !rawContent.trim()) {
                                    console.warn('[ConversationPage] Skipping empty system message:', {
                                        msg,
                                        rawContent,
                                        timestamp: new Date().toISOString()
                                    });
                                    return null;
                                }
                                if (rawContent.startsWith('[PROJECT CONTEXT]')) return null;
                            }

                            // ----------------------------------------------------------------------
                            // SYSTEM MESSAGE (PROJECT CONTEXT etc)
                            // ----------------------------------------------------------------------
                            if (msg.role === 'system') {
                                return (
                                    <div key={idx} style={{
                                        alignSelf: 'center',
                                        maxWidth: '85%',
                                        padding: '12px 24px',
                                        borderRadius: '50px',
                                        background: 'linear-gradient(135deg, #FF9933 0%, #FFCC33 100%)',
                                        color: '#fff',
                                        boxShadow: '0 4px 15px rgba(255, 153, 51, 0.3)',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text || msg.content}</div>

                                            {/* Footer Actions for System Message */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', opacity: 0.8 }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopy(msg.text || msg.content || '', idx);
                                                    }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'inherit', display: 'flex', alignItems: 'center' }}
                                                    title="Copy"
                                                >
                                                    {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                                                </button>
                                                {msg.role === 'ai' && ( /* Only if system is treated as AI for speech? Usually system is text only */
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const textToSpeak = msg.text || msg.content;
                                                            VoiceService.speak(textToSpeak, null, language, voicePrefs.uri);
                                                        }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'inherit', display: 'flex', alignItems: 'center' }}
                                                        title="Read aloud"
                                                    >
<Volume2 size={14} />
                                                    </button>
                                                )}
                                                
                                                {/* Debug: Cache clear button for development */}
{/* Debug Panel */}
                                                {(process.env.NODE_ENV === 'development' || (window as any).ARIS_DEBUG?.isEnabled()) && (
                                                    <div style={{
                                                        background: 'rgba(0,0,0,0.9)',
                                                        color: '#fff',
                                                        padding: '8px',
                                                        borderRadius: '4px',
                                                        fontSize: '10px',
                                                        fontFamily: 'monospace',
                                                        margin: '8px 0',
                                                        maxWidth: '300px',
                                                        border: '1px solid #666'
                                                    }}>
                                                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🎯 DEBUG MODE</div>
                                                        <div style={{ fontSize: '9px', opacity: 0.8 }}>
                                                            URL: ?debug=true OR ?superadmin=true<br/>
                                                            Reload page to disable
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {process.env.NODE_ENV === 'development' && (
                                                    <button
                                                        onClick={handleClearCache}
                                                        style={{
                                                            background: 'none',
                                                            border: '1px solid #666',
                                                            borderRadius: '4px',
                                                            padding: '4px 8px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            color: '#666',
                                                            marginLeft: '8px'
                                                        }}
                                                        title="Clear Cache"
                                                    >
                                                        🗑️ Clear Cache
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // ----------------------------------------------------------------------
                            // STANDARD CHAT MESSAGE (USER / AI)
                            // ----------------------------------------------------------------------
// Debug logging for message rendering issues
                                if (msg.role === 'ai') {
                                    logMessageDebug(msg, `Rendering AI Message #${idx}`);
                                }

                                return (
                                <div key={idx} style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: msg.role === 'user' ? '80%' : '95%',
                                    padding: '16px 20px',
                                    borderRadius: '20px',
                                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
                                    borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '20px',
                                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bubble-ai)',
                                    color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column', // CHANGE: Vertical layout for Text + Footer
                                    gap: '8px'
                                }}>

{/* Message Text */}
                                    <div style={{ width: '100%' }}>
                                        {/* Enhanced debugging for message content */}
                                        {(() => {
                                            const content = msg.text || msg.content || '';
                                            if (!content && msg.role === 'ai') {
                                                console.warn('[ConversationPage] AI message has no content:', {
                                                    msg,
                                                    hasText: !!msg.text,
                                                    hasContent: !!msg.content,
                                                    hasOptions: !!msg.options,
                                                    timestamp: new Date().toISOString()
                                                });
                                            }
                                            return <MarkdownRenderer content={content} />;
                                        })()}
                                    </div>

                                    {/* ARIS V2 Options */}
                                    {msg.options && Array.isArray(msg.options) && (
                                        <ChatOptions
                                            options={msg.options}
                                            onSelect={(opt) => handleSend(opt)}
                                        />
                                    )}

                                    {/* Action Footer */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end', // Align to right
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginTop: '4px',
                                        opacity: msg.role === 'ai' ? 0.6 : 0.8, // Subtle by default
                                        transition: 'opacity 0.2s',
                                        borderTop: msg.role === 'ai' ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.2)', // Divider
                                        paddingTop: '8px'
                                    }}>
                                        {/* Copy Button (All roles) */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(msg.text || msg.content || '', idx);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                color: 'inherit',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            title="Copy text"
                                        >
                                            {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                                        </button>

                                        {/* Read Aloud Button (AI Only) */}
                                        {msg.role === 'ai' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (speakingMessageIndex === idx) {
                                                        VoiceService.stop();
                                                        setSpeakingMessageIndex(null);
                                                    } else {
                                                        VoiceService.stop();
                                                        setSpeakingMessageIndex(idx);
                                                        const textToSpeak = msg.text || msg.content;
                                                        VoiceService.speak(textToSpeak, () => setSpeakingMessageIndex(null), language, voicePrefs.uri);
                                                    }
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    color: 'inherit',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                                title={speakingMessageIndex === idx ? "Stop reading" : "Read aloud"}
                                            >
                                                {speakingMessageIndex === idx ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Thinking Indicator at bottom of list if state is thinking */}
                        {!isFocusMode && circleState === 'thinking' && messages.length > 0 && (
                            <div style={{
                                width: '100%',
                                maxWidth: '800px',
                                padding: '0 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                zIndex: 10
                            }}>
                                <div style={{
                                    alignSelf: 'flex-start',
                                    maxWidth: '80%',
                                    padding: '16px 24px',
                                    borderRadius: '20px',
                                    borderBottomLeftRadius: '4px',
                                    background: 'var(--color-bubble-ai)',
                                    color: 'var(--color-text)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Loader2 size={18} className="spin-animation" />
                                    <span style={{ fontSize: '14px', fontWeight: 500, opacity: 0.7 }}>{t('voice.thinking')}</span>
                                </div>
                            </div>
                        )}

                        {/* Orb Container - Restored to Scroll Flow */}
                        <div style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '20px 0',
                            marginTop: '20px', // Consistent spacing
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                cursor: 'pointer',
                                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                                onClick={handleCircleInteraction}
                            >
                                <ArisCircle state={circleState} size={80} />

                                {/* Listening State Label */}
                                {circleState === 'listening' && liveTranscript && <div style={{
                                    position: 'absolute',
                                    bottom: '-120px', // Pushed down to clear the pill
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    color: 'var(--color-primary)',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    letterSpacing: '0.5px', // Reduced letter spacing
                                    // Removed uppercase
                                    animation: 'fadeIn 0.3s ease-out',
                                    whiteSpace: 'pre-wrap', // Allow wrapping
                                    maxWidth: '300px', // Keep width constraint
                                    width: 'max-content',
                                    textAlign: 'center',
                                    lineHeight: '1.4',
                                    zIndex: 30
                                }}>
                                    {liveTranscript}
                                </div>
                                }
                            </div>
                        </div>

                    </div>
                ) : (
                    !isFocusMode && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '40px' }}>
                            <h1 style={{ fontWeight: 300, color: 'var(--color-text-secondary)', zIndex: 10, whiteSpace: 'pre-line', textAlign: 'center' }}>{t('greeting')}</h1>

                            {/* Big Orb for Initial State */}
                            <div style={{
                                width: '300px',
                                height: '300px',
                                cursor: 'pointer',
                                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                                onClick={handleCircleInteraction}
                            >
                                <ArisCircle state={circleState} size={300} />

                                {/* Listening State Label */}
                                {circleState === 'listening' && liveTranscript && <div style={{
                                    position: 'absolute',
                                    bottom: '-80px', // Pushed down further (was -40px)
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    color: 'var(--color-primary)',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    letterSpacing: '0.5px',
                                    // Removed uppercase
                                    animation: 'fadeIn 0.3s ease-out',
                                    maxWidth: '600px',
                                    width: 'max-content',
                                    textAlign: 'center',
                                    zIndex: 30
                                }}>
                                    {liveTranscript}
                                </div>
                                }
                            </div>
                        </div>
                    )
                )}
            </div >
        </>
    );
};

export default ConversationPage;

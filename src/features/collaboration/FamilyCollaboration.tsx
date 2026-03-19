/**
 * Family Collaboration Session Component
 * Allows family members to start, join, and manage collaborative learning sessions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, Square, UserPlus, Settings, X, Clock, Award, Target } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { websocketClient } from '../../services/websocket/WebSocketClient';

interface CollaborativeSession {
    id: string;
    name: string;
    description: string;
    host_id: string;
    participants: string[];
    topic_id?: string;
    skill_id?: string;
    status: 'active' | 'paused' | 'completed';
    created_at: string;
    started_at?: string;
    ended_at?: string;
    goals?: {
        type: 'xp_target' | 'time_target' | 'completion_target';
        target: number;
        current: number;
        description: string;
    }[];
}

interface FamilyCollaborationProps {
    isOpen: boolean;
    onClose: () => void;
    onSessionStart?: (session: CollaborativeSession) => void;
}

const FamilyCollaboration: React.FC<FamilyCollaborationProps> = ({ 
    isOpen, 
    onClose, 
    onSessionStart 
}) => {
    const { user, family } = useGlobal();
    const [activeSession, setActiveSession] = useState<CollaborativeSession | null>(null);
    const [availableSessions, setAvailableSessions] = useState<CollaborativeSession[]>([]);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [sessionDescription, setSessionDescription] = useState('');
    const [selectedGoal, setSelectedGoal] = useState<'xp_target' | 'time_target' | 'completion_target'>('time_target');
    const [goalTarget, setGoalTarget] = useState('30'); // minutes by default
    const [familyPresence, setFamilyPresence] = useState<{[key: string]: any}>({});

    // WebSocket integration
    useEffect(() => {
        if (!isOpen) return;

        const unsubscribePresence = websocketClient.subscribe('presence_update', () => {
            setFamilyPresence(websocketClient.getFamilyPresence());
        });

        const unsubscribeUserStatus = websocketClient.subscribe('user_status_change', () => {
            setFamilyPresence(websocketClient.getFamilyPresence());
        });

        const unsubscribeSessionStart = websocketClient.subscribe('collaborative_action', (data) => {
            if (data.action === 'collaboration:session_start') {
                setActiveSession(data.data.session);
                onSessionStart?.(data.data.session);
            }
        });

        const unsubscribeSessionEnd = websocketClient.subscribe('collaborative_action', (data) => {
            if (data.action === 'collaboration:session_end' && activeSession?.id === data.data.sessionId) {
                setActiveSession(null);
            }
        });

        setFamilyPresence(websocketClient.getFamilyPresence());

        return () => {
            unsubscribePresence();
            unsubscribeUserStatus();
            unsubscribeSessionStart();
            unsubscribeSessionEnd();
        };
    }, [isOpen, activeSession?.id, onSessionStart]);

    const onlineFamilyMembers = Object.values(familyPresence).filter((p: any) => 
        websocketClient.isUserOnline(p.userId) && p.userId !== user?.id
    );

    const handleCreateSession = async () => {
        if (!sessionName.trim() || !family?.id) return;

        setIsCreatingSession(true);
        try {
            const response = await fetch('/api/collaboration/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: sessionName,
                    description: sessionDescription,
                    familyId: family.id,
                    hostId: user.id,
                    goals: [{
                        type: selectedGoal,
                        target: parseInt(goalTarget),
                        current: 0,
                        description: `${selectedGoal === 'xp_target' ? 'Earn' : selectedGoal === 'time_target' ? 'Study for' : 'Complete'} ${goalTarget} ${selectedGoal === 'xp_target' ? 'XP' : selectedGoal === 'time_target' ? 'minutes' : 'items'}`
                    }]
                })
            });

            if (response.ok) {
                const session = await response.json();
                
                // Broadcast session start via WebSocket
                websocketClient.sendCollaborativeAction('collaboration:session_start', {
                    session
                });

                setActiveSession(session);
                onSessionStart?.(session);
                
                // Reset form
                setSessionName('');
                setSessionDescription('');
                setGoalTarget('30');
                setSelectedGoal('time_target');
                setIsCreatingSession(false);
            } else {
                const error = await response.json();
                alert('Failed to create session: ' + error.message);
                setIsCreatingSession(false);
            }
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Failed to create session');
            setIsCreatingSession(false);
        }
    };

    const handleJoinSession = async (sessionId: string) => {
        try {
            const response = await fetch('/api/collaboration/sessions/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId,
                    userId: user.id
                })
            });

            if (response.ok) {
                const session = await response.json();
                setActiveSession(session);
                
                websocketClient.sendCollaborativeAction('collaboration:session_join', {
                    session,
                    userId: user.id
                });
            } else {
                const error = await response.json();
                alert('Failed to join session: ' + error.message);
            }
        } catch (error) {
            console.error('Error joining session:', error);
            alert('Failed to join session');
        }
    };

    const handleEndSession = async () => {
        if (!activeSession) return;

        try {
            const response = await fetch('/api/collaboration/sessions/end', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: activeSession.id,
                    userId: user.id
                })
            });

            if (response.ok) {
                websocketClient.sendCollaborativeAction('collaboration:session_end', {
                    sessionId: activeSession.id,
                    userId: user.id
                });
                
                setActiveSession(null);
            } else {
                const error = await response.json();
                alert('Failed to end session: ' + error.message);
            }
        } catch (error) {
            console.error('Error ending session:', error);
            alert('Failed to end session');
        }
    };

    const handleInviteMember = (memberUserId: string) => {
        websocketClient.sendCollaborativeAction('collaboration:invite', {
            sessionId: activeSession?.id,
            invitedUserId: memberUserId,
            invitedBy: user.id
        });
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Users size={24} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                                Family Collaboration
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                {onlineFamilyMembers.length + 1} family member{onlineFamilyMembers.length + 1 !== 1 ? 's' : ''} online
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-tertiary)'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Active Session Display */}
                <AnimatePresence>
                    {activeSession && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '20px'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '16px'
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                                        {activeSession.name}
                                    </h3>
                                    <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '14px' }}>
                                        {activeSession.description}
                                    </p>
                                </div>
                                <button
                                    onClick={handleEndSession}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        color: 'white',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Square size={14} />
                                    End Session
                                </button>
                            </div>

                            {/* Session Goals */}
                            {activeSession.goals && activeSession.goals.length > 0 && (
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <Target size={16} />
                                        <span style={{ fontSize: '14px', fontWeight: '600' }}>Session Goal</span>
                                    </div>
                                    {activeSession.goals.map((goal, index) => (
                                        <div key={index} style={{ fontSize: '13px', opacity: 0.9 }}>
                                            {goal.description}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Participants */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={16} />
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                    {activeSession.participants.length} participant{activeSession.participants.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Session Creation Form */}
                {!activeSession && (
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>
                            Start a New Session
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input
                                type="text"
                                placeholder="Session name (e.g., Math Study Session)"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                style={{
                                    padding: '12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text)'
                                }}
                            />
                            
                            <textarea
                                placeholder="What will you work on together?"
                                value={sessionDescription}
                                onChange={(e) => setSessionDescription(e.target.value)}
                                rows={2}
                                style={{
                                    padding: '12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text)',
                                    resize: 'vertical'
                                }}
                            />

                            {/* Goal Setting */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <select
                                    value={selectedGoal}
                                    onChange={(e) => setSelectedGoal(e.target.value as any)}
                                    style={{
                                        padding: '8px',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: 'var(--color-surface)',
                                        color: 'var(--color-text)'
                                    }}
                                >
                                    <option value="time_target">Study Time</option>
                                    <option value="xp_target">XP Target</option>
                                    <option value="completion_target">Complete Tasks</option>
                                </select>
                                
                                <input
                                    type="number"
                                    value={goalTarget}
                                    onChange={(e) => setGoalTarget(e.target.value)}
                                    placeholder="30"
                                    min="1"
                                    style={{
                                        padding: '8px',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: 'var(--color-surface)',
                                        color: 'var(--color-text)',
                                        width: '80px'
                                    }}
                                />
                                
                                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                    {selectedGoal === 'time_target' ? 'minutes' : selectedGoal === 'xp_target' ? 'XP' : 'items'}
                                </span>
                            </div>

                            <button
                                onClick={handleCreateSession}
                                disabled={!sessionName.trim() || isCreatingSession}
                                style={{
                                    background: sessionName.trim() && !isCreatingSession ? 'var(--color-primary)' : 'var(--color-border)',
                                    color: sessionName.trim() && !isCreatingSession ? 'white' : 'var(--color-text-tertiary)',
                                    border: 'none',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: sessionName.trim() && !isCreatingSession ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Play size={16} />
                                {isCreatingSession ? 'Creating...' : 'Start Session'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Online Family Members */}
                {onlineFamilyMembers.length > 0 && !activeSession && (
                    <div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700' }}>
                            Invite Family Members
                        </h3>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            {onlineFamilyMembers.map((member: any) => (
                                <div key={member.userId} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px',
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#10b981'
                                        }} />
                                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                            {member.displayName || `User ${member.userId.slice(0, 8)}`}
                                        </span>
                                    </div>
                                    
                                    {activeSession && (
                                        <button
                                            onClick={() => handleInviteMember(member.userId)}
                                            style={{
                                                background: 'var(--color-primary-light)',
                                                border: '1px solid var(--color-primary)',
                                                color: 'var(--color-primary)',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <UserPlus size={12} />
                                            Invite
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default FamilyCollaboration;
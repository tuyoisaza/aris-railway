import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Activity, Share2, Trash2, Check, Users, Users2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../../context/GlobalContext';
import { websocketClient } from '../../services/websocket/WebSocketClient';

// Simple types for TopicCard props
interface TopicCardProps {
    topic: any; // Ideally strictly typed
    selected?: boolean;
    onToggleSelect?: (id: string) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, selected = false, onToggleSelect }) => {
    const { id, title, category, depth, maxDepth, engagement, connections, created_at, shared_with_family } = topic;
    const { deleteTopic, user, family } = useGlobal();
    const { t } = useTranslation();
    const depthPercentage = (depth / maxDepth) * 100;
    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showStarAnimation, setShowStarAnimation] = useState(false);
    const [lastEngagement, setLastEngagement] = useState(engagement || 0);
    const [familyPresence, setFamilyPresence] = useState<{[key: string]: any}>({});
    const [isSharing, setIsSharing] = useState(false);

    // Detect engagement changes (XP gains) and trigger star animation
    useEffect(() => {
        if (engagement > lastEngagement) {
            setShowStarAnimation(true);
            setTimeout(() => setShowStarAnimation(false), 2000); // 2 second animation
            setLastEngagement(engagement);
        }
    }, [engagement, lastEngagement]);

    // WebSocket presence integration
    useEffect(() => {
        const unsubscribePresence = websocketClient.subscribe('presence_update', () => {
            setFamilyPresence(websocketClient.getFamilyPresence());
        });

        const unsubscribeUserStatus = websocketClient.subscribe('user_status_change', () => {
            setFamilyPresence(websocketClient.getFamilyPresence());
        });

        setFamilyPresence(websocketClient.getFamilyPresence());

        return () => {
            unsubscribePresence();
            unsubscribeUserStatus();
        };
    }, []);

    // Count family members actively working on this topic
    const activeFamilyMembers = Object.values(familyPresence).filter((p: any) => 
        websocketClient.isUserOnline(p.userId) && p.currentTopicId === id
    );

    const handleShareWithFamily = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!user?.id || !family?.id) {
            alert('You must be part of a family to share topics');
            return;
        }

        setIsSharing(true);
        try {
            const response = await fetch('/api/topics/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topicId: id,
                    familyId: family.id
                })
            });

            if (response.ok) {
                websocketClient.sendCollaborativeAction('shared_entity:create', {
                    type: 'topic',
                    entityId: id,
                    title: title,
                    sharedBy: user.id
                });
                
                alert('Topic shared with family!');
            } else {
                const error = await response.json();
                alert('Failed to share topic: ' + error.message);
            }
        } catch (error) {
            console.error('Error sharing topic:', error);
            alert('Failed to share topic');
        } finally {
            setIsSharing(false);
        }
    };

    // Format Date
    const formattedDate = created_at
        ? new Date(created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(true);
        try {
            const result = await deleteTopic(id);
            if (!result || !result.success) {
                alert(`Delete failed: ${result?.error || 'Unknown error'}`);
                setIsDeleting(false);
                setShowConfirm(false);
            }
        } catch (err) {
            console.error(err);
            alert('Delete failed');
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <motion.div
                onClick={(e) => {
                    if (onToggleSelect) {
                        e.preventDefault();
                        onToggleSelect(id);
                    } else {
                        navigate(`/topic/${id}`);
                    }
                }}
                whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
                className="card"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', // Visual feedback
                }}
            >
                {/* Selection Checkbox */}
                {onToggleSelect && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            zIndex: 10,
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: selected ? 'none' : '2px solid var(--color-border)',
                            background: selected ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        {selected && <Check size={16} color="white" />}
                    </div>
                )}

                {/* XP Star Animation */}
                {showStarAnimation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0, y: 0 }}
                        animate={{ opacity: 1, scale: 1.5, y: -20 }}
                        exit={{ opacity: 0, scale: 0.5, y: -40 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            fontSize: '24px',
                            zIndex: 20,
                            color: '#FFD700',
                            textShadow: '0 0 10px rgba(255, 215, 0, 0.6)'
                        }}
                    >
                        ⭐ +5
                    </motion.div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: onToggleSelect ? '32px' : '0' }}>
                    <div>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            color: 'var(--color-text-tertiary)',
                            letterSpacing: '0.5px'
                        }}>
                            {category}
                        </span>
                        <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: '600' }}>{title}</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{
                            background: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 0 10px rgba(var(--color-primary-rgb), 0.2)'
                        }}>
                            {t('learningMap.level')} {topic.level || 1}
                        </div>
                        
                        {/* Share with Family Button */}
                        {!onToggleSelect && family?.id && !shared_with_family && (
                            <button
                                onClick={handleShareWithFamily}
                                disabled={isSharing}
                                style={{
                                    background: 'var(--color-primary-light)',
                                    border: '1px solid var(--color-primary)',
                                    color: 'var(--color-primary)',
                                    cursor: isSharing ? 'not-allowed' : 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    opacity: isSharing ? 0.6 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => !isSharing && (e.currentTarget.style.background = 'var(--color-primary)')}
                                onMouseLeave={(e) => !isSharing && (e.currentTarget.style.background = 'var(--color-primary-light)')}
                            >
                                <Share2 size={12} />
                                {isSharing ? 'Sharing...' : 'Share'}
                            </button>
                        )}

                        {!onToggleSelect && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowConfirm(true);
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-tertiary)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '50%',
                                    display: 'flex'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.scale = '1.1'}
                                onMouseLeave={(e) => e.currentTarget.style.scale = '1'}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Stats Row */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    paddingLeft: onToggleSelect ? '32px' : '0',
                    marginTop: '-8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={14} color="var(--color-primary)" />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                            {engagement} {t('learningMap.xp')}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-tertiary)' }}>
                        <Check size={14} />
                        <span style={{ fontSize: '13px' }}>
                            {topic.steps || 0} {t('learningMap.steps')}
                        </span>
                    </div>
                </div>

                {/* Depth Bar */}
                <div style={{ paddingLeft: onToggleSelect ? '32px' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        <span>Depth</span>
                        <span>Layer {depth}/{maxDepth}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--color-border-light)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${depthPercentage}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ height: '100%', background: 'var(--color-primary)' }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--color-border-light)',
                    marginTop: 'auto',
                    paddingLeft: onToggleSelect ? '32px' : '0'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {formattedDate && (
                            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                                Added {formattedDate}
                            </span>
                        )}
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                            <Share2 size={14} />
                            {connections} connections
                        </div>

                        {/* Family Presence Indicator */}
                        {activeFamilyMembers.length > 0 && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '13px',
                                color: '#10b981',
                                fontWeight: '500'
                            }}>
                                <Users size={14} />
                                {activeFamilyMembers.length} {activeFamilyMembers.length === 1 ? 'member' : 'members'} active
                            </div>
                        )}

                        {/* Shared with Family Badge */}
                        {shared_with_family && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '13px',
                                color: 'var(--color-primary)',
                                fontWeight: '500'
                            }}>
                                <Users2 size={14} />
                                Family shared
                            </div>
                        )}
                    </div>
                    {!onToggleSelect && (
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--color-primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary)'
                        }}>
                            <ArrowRight size={16} />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Confirmation Overlay - Only show if NOT in selection mode (redundant check but safe) */}
            <AnimatePresence>
                {showConfirm && !onToggleSelect && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(2px)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            zIndex: 10
                        }}
                    >
                        <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-text)' }}>Delete this topic?</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    background: 'white',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    background: isDeleting ? '#ef444480' : '#ef4444',
                                    color: 'white',
                                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500'
                                }}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TopicCard;

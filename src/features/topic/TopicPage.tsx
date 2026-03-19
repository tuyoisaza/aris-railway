import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import InsightsPath from './InsightsPath';

const TopicPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [topic, setTopic] = useState(null);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [expandedLayer, setExpandedLayer] = useState<number | null>(null);
    const [startingLayer, setStartingLayer] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Parallel fetch
                const [topicData, progressData] = await Promise.all([
                    api.getTopic(id),
                    api.getTopicProgress(id)
                ]);

                if (!topicData) throw new Error('Topic not found');

                setTopic(topicData);
                setProgress(progressData || { current_depth: 1, engagement_score: 0 }); // Default if new

                // AUTO-ENRICH: If topic has no content, trigger enrichment automatically
                const hasContent = topicData.content && topicData.content.layers;
                if (!hasContent) {
                    console.log('[TopicPage] Topic has no content, auto-triggering enrichment...');
                    setIsGenerating(true);
                    try {
                        await api.enrichTopic(id);
                        // Re-fetch to get updated content
                        const updated = await api.getTopic(id);
                        setTopic(updated);
                    } catch (enrichErr) {
                        console.error('[TopicPage] Auto-enrich failed:', enrichErr);
                        // Don't block - user can still see the page and manually trigger
                    } finally {
                        setIsGenerating(false);
                    }
                }
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleEnrich = async () => {
        setIsGenerating(true);
        try {
            const res = await api.enrichTopic(id);
            if (res.error) throw new Error(res.error);

            // Reload page or re-fetch
            const updatedTopic = await api.getTopic(id);
            setTopic(updatedTopic);
        } catch (err) {
            console.error(err);
            alert(t('common.error') + ': ' + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleTalk = async () => {
        try {
            const res = await api.startTopicConversation(id);
            if (res.error) throw new Error(res.error);
            if (res.conversationId) {
                navigate(`/conversation/${res.conversationId}`);
            }
        } catch (err) {
            console.error(err);
            alert(t('common.error') + ': ' + err.message);
        }
    };

    // GENERATING STATE - Show thinking loader while content is being created
    if (isGenerating && !topic?.content?.layers) {
        return (
            <div className="container" style={{
                paddingTop: '120px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 2s ease-in-out infinite'
                }}>
                    <BookOpen size={36} color="#fff" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: 'var(--color-text)' }}>
                    Cartographer is mapping this topic...
                </h2>
                <p style={{ fontSize: '16px', maxWidth: '400px', margin: '0 auto' }}>
                    Discovering layers of knowledge and connecting ideas. This usually takes a few seconds.
                </p>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.05); opacity: 0.8; }
                    }
                `}</style>
            </div>
        );
    }

    if (loading) {
        return <div className="container" style={{ paddingTop: '80px', color: 'var(--color-text-secondary)' }}>{t('common.loading')}</div>;
    }

    if (error || !topic) {
        return (
            <div className="container" style={{ paddingTop: '80px' }}>
                <p>{t('common.error')}: {error || 'Not found'}</p>
                <button onClick={() => navigate('/map')}>{t('topic.back')}</button>
            </div>
        );
    }



    const handleLayerTalk = async (layer: any) => {
        setStartingLayer(layer.level);
        // Construct more descriptive prompt including Topic Title
        const prompt = `I want to explore Layer ${layer.level}: ${layer.title} of the topic "${topic.title}". ${layer.content}`;

        try {
            // Ensure we use the Topic-specific conversation
            const res = await api.startTopicConversation(id);
            if (res && res.conversationId) {
                navigate(`/conversation/${res.conversationId}?initialMessage=${encodeURIComponent(prompt)}`);
            } else {
                // Fallback
                navigate(`/conversation?initialMessage=${encodeURIComponent(prompt)}`);
            }
        } catch (e) {
            console.error("Failed to start topic conversation:", e);
            navigate(`/conversation?initialMessage=${encodeURIComponent(prompt)}`);
        } finally {
            setStartingLayer(null);
        }
    };

    const currentLayer = progress?.current_depth || 1;
    const hasContent = topic.content && topic.content.layers;

    // Priority: Personalized Content -> Global Topic Content -> Defaults
    const contentSource = progress?.personalized_content || topic.content;
    const layers = contentSource?.layers || [
        { level: 1, title: 'Surface', content: 'Initial discovery and overview.' },
        { level: 2, title: 'Concept', content: 'Defining core terms and ideas.' },
        { level: 3, title: 'Theory', content: 'Understanding the framework.' },
        { level: 4, title: 'Application', content: 'Practical use cases and examples.' },
        { level: 5, title: 'Deep Dive', content: 'Explaining mechanisms and nuances.' },
        { level: 6, title: 'Synthesis', content: 'Connecting to other domains.' },
        { level: 7, title: 'Mastery', content: 'Research frontier and novelty.' }
    ];

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <button
                    onClick={() => navigate('/map')}
                    style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--color-text-secondary)',
                        padding: 0,
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={20} />
                    {t('topic.back')}
                </button>


            </div>

            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
                <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: 'var(--color-primary)',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    {topic.category}
                    {progress?.initial_intent && progress.initial_intent !== topic.title && (
                        <span style={{
                            textTransform: 'none',
                            color: 'var(--color-text-secondary)',
                            background: 'rgba(255,255,255,0.1)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }}>
                            Focused on: {progress.initial_intent}
                        </span>
                    )}
                </span>
                <h1 style={{ fontSize: '48px', fontWeight: '800', margin: '8px 0 16px', letterSpacing: '-1px' }}>
                    {topic.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                    <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', maxWidth: '700px', lineHeight: '1.6', margin: 0 }}>
                        {topic.description || t('topic.noResources')}
                    </p>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {/* Talk with ARIS Button */}
                        <button
                            onClick={handleTalk}
                            className="btn-primary" // Use utility class if available, or inline
                            style={{
                                background: 'var(--color-surface)',
                                color: 'var(--color-text)',
                                border: '1px solid var(--color-border)',
                                padding: '8px 16px',
                                borderRadius: '24px',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexShrink: 0
                            }}
                        >
                            <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #FF6B00 0%, #FF9933 100%)'
                            }}></div>
                            Talk with ARIS
                        </button>

                        {/* Enrichment Button - Always visible for regeneration */}
                        <button
                            onClick={handleEnrich}
                            disabled={isGenerating}
                            style={{
                                background: isGenerating ? 'var(--color-text-tertiary)' : 'var(--color-primary)',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '24px',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexShrink: 0
                            }}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                                    {t('topic.generating')}
                                </>
                            ) : (
                                <>
                                    <BookOpen size={16} />
                                    {t('topic.generateContent')}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ marginTop: '24px', display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    <span>{t('topic.level')}: <strong>{currentLayer}</strong> / {topic.max_depth}</span>
                    <span>{t('topic.progress')}: <strong>{progress?.engagement_score || 0}</strong></span>
                </div>
            </div>

            {/* Depth Journey */}
            <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Layers size={24} color="var(--color-text-tertiary)" />
                    Depth Journey
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {layers.map((layer) => (
                        <LayerItem
                            key={layer.level}
                            layer={layer}
                            topic={topic}
                            currentLayer={currentLayer}
                            isExpanded={expandedLayer === layer.level}
                            isStarting={startingLayer === layer.level}
                            onToggle={() => setExpandedLayer(expandedLayer === layer.level ? null : layer.level)}
                            onTalk={() => handleLayerTalk(layer)}
                        />
                    ))}
                </div>
            </div>

            {/* Insights Path (Using Personalized Source) */}
            <InsightsPath topicId={id} content={contentSource} />

            {/* Global Spinner CSS */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

// Sub-component for clean rendering of Layer Items
const LayerItem = ({ layer, topic, currentLayer, isExpanded, isStarting, onToggle, onTalk }: any) => {
    // Only allow interaction if level is unlocked (<= max_depth) or it's the next immediate level?
    // Current logic allowed clicking anything <= max_depth.
    const isLocked = layer.level > topic.max_depth;

    return (
        <div
            onClick={!isLocked ? onToggle : undefined}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '20px',
                borderRadius: '16px',
                background: isExpanded ? 'var(--color-bg-secondary)' : (layer.level === currentLayer ? 'rgba(245, 158, 11, 0.05)' : 'transparent'),
                border: isExpanded || layer.level === currentLayer ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? 0.6 : 1,
                transition: 'all 0.2s ease'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: layer.level <= currentLayer ? 'var(--color-primary)' : 'var(--color-border)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '14px'
                    }}>
                        {layer.level}
                    </div>
                    <div>
                        <span style={{
                            display: 'block',
                            fontSize: '16px',
                            fontWeight: layer.level === currentLayer || isExpanded ? '700' : '500',
                            color: layer.level <= currentLayer ? 'var(--color-text)' : 'var(--color-text-tertiary)'
                        }}>
                            {layer.title} {layer.level === currentLayer && '(Current)'}
                        </span>
                    </div>
                </div>
                {!isLocked && (
                    <div style={{ color: 'var(--color-text-tertiary)', fontSize: '20px', fontWeight: 'bold' }}>
                        {isExpanded ? '−' : '+'}
                    </div>
                )}
            </div>

            {/* Content Preview (Visible when collapsed OR expanded) */}
            <div style={{
                marginTop: '8px',
                marginLeft: '48px',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
            }}>
                <BookOpen size={14} style={{ marginTop: '3px', flexShrink: 0 }} />
                <span>
                    {layer.content || "Content waiting to be discovered..."}
                </span>
            </div>

            {/* EXPANDED ACTION AREA */}
            {isExpanded && !isLocked && (
                <div style={{
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--color-border-light)',
                    marginLeft: '48px',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--color-text)' }}>
                        Ready to explore <strong>{layer.title}</strong> in depth? ARIS is ready to guide you.
                    </p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent toggling
                            onTalk();
                        }}
                        disabled={isStarting}
                        className="btn-primary"
                        style={{
                            background: isStarting ? 'var(--color-text-tertiary)' : 'var(--color-primary)',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '24px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: isStarting ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {isStarting ? (
                            <Layers className="spin" size={16} />
                        ) : (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}></div>
                        )}
                        {isStarting ? 'Thinking...' : 'Talk with ARIS'}
                    </button>
                    <style>{`
                        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default TopicPage;

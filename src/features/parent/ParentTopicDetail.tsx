import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Layers, ArrowRight, BookOpen, User, Star, Map, Zap, Brain, Compass, Anchor } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

import { api } from '../../services/api';

const ParentTopicDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { topics, family } = useGlobal();
    const [scoutResources, setScoutResources] = React.useState([]); // State for resources

    // Safe defaults for family data
    const safeFamily = family || {};
    const safeMembers = safeFamily.members || [];

    // 1. Get Base Topic Data
    const topic = topics?.find(t => t.id === id) || topics?.[0] || { id: '0', title: 'Topic', category: 'General', depth: 1, maxDepth: 7, engagement: 0 };

    // Fetch Resources Effect
    React.useEffect(() => {
        if (topic.id) {
            const fetchResources = async () => {
                const result = await api.getResources(topic.id);
                const resources = result?.data || result || [];
                setScoutResources(resources);
            };
            fetchResources();
        }
    }, [topic.id]);

    // 2. Get Selected Member Data
    const selectedMember = safeFamily.selectedMemberId && safeFamily.selectedMemberId !== 'all'
        ? safeMembers.find(m => m.id === safeFamily.selectedMemberId)
        : null;

    // 3. Fetch Dynamic Progress
    const [progress, setProgress] = React.useState(null);

    React.useEffect(() => {
        const fetchProgress = async () => {
            const targetId = selectedMember?.id || (safeFamily.selectedMemberId === 'all' ? null : null);
            // If 'all', maybe show generic or parent's? Let's show filtered member's if selected.
            if (targetId) {
                const p = await api.getTopicProgress(id, targetId);
                setProgress(p);
            }
        };
        fetchProgress();
    }, [id, selectedMember?.id]);

    const currentDepth = progress?.current_depth || topic.depth || 1;
    const currentEngagement = progress?.engagement_score || topic.engagement || 0;

    // Use member-specific conversations if available, else generic mock
    // TODO: Fetch conversations via API? Keeping mock for now as per previous logic
    const conversations = [
        { id: 1, date: 'Yesterday', duration: '15 mins', preview: 'Asked about "Event Horizon" definition.', sentiment: 'Curious' },
        { id: 2, date: '2 days ago', duration: '45 mins', preview: 'Discussed gravity vs time.', sentiment: 'Engaged' }
    ];

    // 3b. Parse Dynamic Content (Librarian Output)
    let dynamicContent = {};
    try {
        if (topic.content && typeof topic.content === 'string') {
            dynamicContent = JSON.parse(topic.content);
        } else if (topic.content && typeof topic.content === 'object') {
            dynamicContent = topic.content;
        }
    } catch (e) {
        console.error("Failed to parse topic content", e);
    }

    // Journey Steps: Use dynamic or fallback
    const journeySteps = dynamicContent.journeySteps?.map(s => ({
        ...s,
        icon: s.level > 4 ? Star : (s.level > 2 ? Brain : BookOpen) // Simple icon mapping
    })) || [
            { level: 1, label: 'Surface', desc: 'Loading content...', icon: BookOpen },
            { level: 2, label: 'Concept', desc: '...', icon: BookOpen },
        ];

    // Insights Path
    const insights = dynamicContent.insights?.map(i => ({
        ...i,
        icon: i.category === 'Promise' ? Anchor : (i.category === 'Practice' ? Zap : Star)
    })) || [];

    // Next Steps
    const nextSteps = dynamicContent.nextSteps || [];

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <button
                onClick={() => navigate('/parent')}
                style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '24px',
                    padding: 0,
                    cursor: 'pointer'
                }}
            >
                <ArrowLeft size={20} />
                Back to Dashboard
            </button>

            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '1px' }}>
                        {topic.category}
                    </span>
                    {selectedMember && (
                        <span style={{ fontSize: '12px', background: 'var(--color-bg-secondary)', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} />
                            {selectedMember.name}'s View
                        </span>
                    )}
                </div>
                <h1 style={{ fontSize: '48px', fontWeight: '800', margin: '0 0 16px', letterSpacing: '-1px' }}>
                    {topic.title}
                </h1>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary)' }}>
                        Layer {currentDepth}/{topic.maxDepth}
                    </span>
                    <span style={{ fontSize: '18px', color: 'var(--color-text-secondary)' }}>
                        • Engagement: {currentEngagement}%
                    </span>
                </div>
            </div>

            {/* Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>

                {/* Left Column: Summary & Conversations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* 1. Recent Conversations */}
                    <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MessageSquare size={24} color="var(--color-text-tertiary)" />
                            Recent Conversations
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {conversations.map(conv => (
                                <div key={conv.id} style={{
                                    padding: '16px',
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border-light)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)' }}>{conv.date}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>•</span>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{conv.duration}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)' }}>{conv.sentiment}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text)' }}>"{conv.preview}"</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Insights Path (Moved UP) */}
                    <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Map size={24} color="var(--color-text-tertiary)" />
                            Insights Path
                        </h3>
                        {insights.map((item, idx) => (
                            <div key={idx} style={{ marginBottom: '24px', paddingLeft: '16px', borderLeft: '2px solid var(--color-primary-light)' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: '700', marginBottom: '4px' }}>{item.category}</div>
                                <div style={{ fontWeight: '700', marginBottom: '4px' }}>{item.title}</div>
                                <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{item.desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* 3. Next Steps (Moved DOWN) */}
                    <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ArrowRight size={24} color="var(--color-text-tertiary)" />
                            Next Steps
                        </h3>
                        <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {nextSteps.length > 0 ? nextSteps.map((step, idx) => (
                                <li key={idx} style={{ fontSize: '15px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                                    {step}
                                </li>
                            )) : (
                                <li style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Generating recommendations...</li>
                            )}
                        </ul>
                    </div>

                    {/* 4. Scout Resources (NEW) */}
                    {scoutResources.length > 0 && (
                        <div className="card" style={{ padding: '32px', border: '1px solid var(--color-primary-light)', background: '#fffaf0' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
                                <Zap size={24} />
                                Scout Resources
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {scoutResources.map((res, idx) => (
                                    <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{
                                            padding: '16px',
                                            background: '#fff',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-border-light)',
                                            transition: 'transform 0.2s',
                                            cursor: 'pointer'
                                        }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                {res.type}
                                            </div>
                                            <div style={{ fontWeight: '700', marginBottom: '4px' }}>{res.title}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{res.metadata?.description || 'No description'}</div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Column: Depth Journey */}
                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Layers size={24} color="var(--color-text-tertiary)" />
                        Depth Journey
                    </h3>
                    <div style={{ position: 'relative' }}>
                        {/* Connecting Line */}
                        <div style={{
                            position: 'absolute',
                            left: '20px',
                            top: '20px',
                            bottom: '20px',
                            width: '2px',
                            background: 'var(--color-border-light)',
                            zIndex: 0
                        }} />

                        {journeySteps.map((step) => {
                            const isCurrent = step.level === currentDepth;
                            const isCompleted = step.level < currentDepth;
                            const isLocked = step.level > currentDepth;

                            return (
                                <div key={step.level} style={{
                                    display: 'flex',
                                    gap: '16px',
                                    marginBottom: '32px',
                                    position: 'relative',
                                    opacity: isLocked ? 0.5 : 1
                                }}>
                                    {/* Indicator */}
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: isCurrent || isCompleted ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                        color: isCurrent || isCompleted ? '#fff' : 'var(--color-text-tertiary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '700',
                                        fontSize: '16px',
                                        border: isCurrent ? '4px solid var(--color-primary-light)' : 'none',
                                        zIndex: 1,
                                        flexShrink: 0
                                    }}>
                                        {step.level}
                                    </div>

                                    {/* Content */}
                                    <div style={{
                                        padding: '16px',
                                        background: isCurrent ? 'var(--color-bg-secondary)' : 'transparent',
                                        border: isCurrent ? '1px solid var(--color-primary)' : '1px solid transparent',
                                        borderRadius: '12px',
                                        flex: 1
                                    }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                                            {step.label} {isCurrent && '(Current)'}
                                        </div>
                                        <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <step.icon size={14} />
                                            {step.desc}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ParentTopicDetail;

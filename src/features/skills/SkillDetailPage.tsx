import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, ArrowLeft, Calendar, Trophy, Star, BookOpen, Target, Lightbulb, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../../context/GlobalContext';
import ChatSidebar from '../conversation/ChatSidebar';

// ... imports
import { CheckCircle, Lock, AlertCircle } from 'lucide-react'; // Add new icons
import { api } from '../../services/api';

const SkillDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useGlobal() as any;
    const { t } = useTranslation();
    const [skillData, setSkillData] = useState(null);
    const [projectCount, setProjectCount] = useState(0); // State for projects
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [isArchitecting, setIsArchitecting] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [confirmProject, setConfirmProject] = useState(null); // For confirmation modal
    const [speakingLevel, setSpeakingLevel] = useState<number | null>(null);
    const generationAttempted = useRef(false);

    useEffect(() => {
        const fetchSkillDetails = async () => {
            if (!user || !id) return;
            try {
                // 1. Fetch Skill Progress
                const { data: progress, error: skillError } = await supabase
                    .from('user_skill_progress')
                    .select('*, skills ( id, title, category, description, content )')
                    .eq('user_id', user.id)
                    .eq('skill_id', id)
                    .single();

                if (skillError) throw skillError;
                setSkillData(progress);

                // 2. Fetch Completed Projects linked to this skill
                // Note: We need to filter by status='completed' ideally, but let's count all for now or 'active'/'completed'
                const { count, error: projError } = await supabase
                    .from('projects')
                    .select('id', { count: 'exact', head: true })
                    .eq('skill_id', id)
                    .eq('status', 'completed'); // Only completed projects count for mastery

                if (!projError) {
                    setProjectCount(count || 0);
                }

            } catch (err) {
                console.error('Error fetching skill detail:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSkillDetails();
    }, [user, id]);

    // Trigger Generation if content is missing
    useEffect(() => {
        const checkAndGenerate = async () => {
            if (!skillData || generating || generationAttempted.current) return;

            const content = skillData.skills.content;
            const hasContent = content && Object.keys(content).length > 0 && content.levels;

            if (!hasContent) {
                generationAttempted.current = true;
                setGenerating(true);
                try {
                    console.log('Triggering generation for skill:', id);
                    const data = await api.generateSkillCurriculum(id || '');

                    if (data.error) throw new Error(data.error);

                    setSkillData((prev: any) => ({
                        ...prev,
                        skills: { ...prev.skills, content: data.content }
                    }));
                } catch (error) {
                    console.error('Error generating content:', error);
                } finally {
                    setGenerating(false);
                }
            }
        };
        checkAndGenerate();
    }, [skillData, id, generating]);


    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                Loading details...
            </div>
        );
    }

    if (!skillData) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h3 style={{ color: 'var(--color-text)' }}>Skill not found</h3>
                <button onClick={() => navigate('/skills')} style={buttonStyle}>Back to Skills</button>
            </div>
        );
    }

    const { skills, level, xp, last_practiced_at } = skillData;
    const content = skills.content || {};

    // --- LEVEL UNLOCK LOGIC ---
    const isLevelUnlocked = (lvlNum) => {
        // Base: Must have reached the level via XP (Conversation)
        if (level < lvlNum) return { unlocked: false, reason: "Need more practice/XP" };

        // Project Requirements
        if (lvlNum >= 10) {
            if (projectCount < 5) return { unlocked: false, reason: `Requires 5 Finished Projects (Has ${projectCount})` };
        } else if (lvlNum >= 7) {
            if (projectCount < 3) return { unlocked: false, reason: `Requires 3 Finished Projects (Has ${projectCount})` };
        } else if (lvlNum >= 4) {
            if (projectCount < 1) return { unlocked: false, reason: `Requires 1 Finished Project (Has ${projectCount})` };
        }

        return { unlocked: true };
    };

    // Opens confirmation modal
    const handleProjectClick = (proj) => {
        setConfirmProject(proj);
    };

    // Actually creates the project after confirmation
    const confirmCreateProject = async () => {
        if (!confirmProject) return;

        setIsArchitecting(true);
        setConfirmProject(null); // Close modal

        try {
            const data = await api.createProjectFromSkill({
                skillId: id,
                idea: confirmProject.description,
                topicId: skills.topics?.id
            });

            if (!data) throw new Error('Failed to architect project');

            navigate(`/projects/${data.id}`);
        } catch (err) {
            console.error('Error creating project:', err);
            alert('Failed to architect project. Daedalus is busy.');
        } finally {
            setIsArchitecting(false);
        }
    };

    const handleTalk = async (lvl) => {
        setSpeakingLevel(lvl.level);
        try {
            const res = await api.startSkillLevelConversation(id, lvl.level);
            if (res.error) throw new Error(res.error);
            if (res.conversationId) {
                navigate(`/conversation/${res.conversationId}`);
            }
        } catch (err) {
            console.error(err);
            alert(t('common.error') + ': ' + err.message);
            setSpeakingLevel(null);
        }
    };

    return (
        <>
            <ChatSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNewChat={() => navigate('/conversation')} />

            {/* Hamburger Button */}
            <button onClick={() => setIsSidebarOpen(true)} style={hamburgerStyle}>
                <div style={{ width: '24px', height: '2px', background: 'currentColor', marginBottom: '4px' }}></div>
                <div style={{ width: '16px', height: '2px', background: 'currentColor', marginBottom: '4px' }}></div>
                <div style={{ width: '24px', height: '2px', background: 'currentColor' }}></div>
            </button>

            <div style={{
                padding: '40px',
                maxWidth: '1000px',
                margin: '0 auto',
                height: '100%',
                overflowY: 'auto',
                paddingTop: '80px'
            }}>
                <button onClick={() => navigate('/skills')} style={backButtonStyle}>
                    <ArrowLeft size={16} /> Back to Skills
                </button>

                {/* HEADER CARD */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={headerCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '32px' }}>
                        <div style={iconContainerStyle}>
                            <Sword size={40} />
                        </div>
                        <div>
                            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 'bold' }}>{skills.title}</h1>
                            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '16px', lineHeight: 1.5 }}>
                                {skills.description || "You are tracking your progress in this skill."}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                        <StatCard icon={<Trophy size={18} />} label="Current Level" value={`Level ${level}`} color="var(--color-primary)" />
                        <StatCard icon={<Star size={18} />} label="Total XP" value={`${xp} XP`} color="var(--color-text)" />
                        <StatCard icon={<Lightbulb size={18} />} label="Completed Projects" value={projectCount} color="#10b981" />
                        {content.category && (
                            <StatCard icon={<Target size={18} />} label="Category" value={content.category} color="var(--color-text-secondary)" />
                        )}
                    </div>
                </motion.div>

                {/* GENERATION STATE */}
                {generating && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={generatingStyle}>
                        <Loader2 className="spin" size={32} color="var(--color-primary)" />
                        <h3>Lugh is crafting your curriculum...</h3>
                        <p>Consulting the ancient records for 10 levels of mastery.</p>
                    </motion.div>
                )}
                {/* Global Style for Spin Animation */}
                <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .spin { animation: spin 1s linear infinite; }
                `}</style>

                {/* ARCHITECTING STATE */}
                {isArchitecting && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Loader2 className="spin" size={48} color="var(--color-primary)" />
                        <h2 style={{ color: 'white', marginTop: '20px' }}>Daedalus is architecting your project...</h2>
                        <p style={{ color: '#aaa' }}>Designing constraints and failure surfaces.</p>
                    </div>
                )}

                {/* PROJECT CREATION CONFIRMATION MODAL */}
                {confirmProject && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                        onClick={() => setConfirmProject(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--color-surface)',
                                borderRadius: '20px',
                                padding: '32px',
                                maxWidth: '480px',
                                width: '90%',
                                boxShadow: 'var(--shadow-lg)',
                                border: '1px solid var(--color-border)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #d97706 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                                }}>
                                    <Lightbulb size={24} />
                                </div>
                                <h2 style={{ margin: 0, color: 'var(--color-text)' }}>Create This Project?</h2>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '8px' }}>
                                    LEVEL {confirmProject.level}
                                </div>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--color-text)' }}>
                                    {confirmProject.title}
                                </h3>
                                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                                    {confirmProject.description}
                                </p>
                                <div style={{
                                    background: 'var(--color-bg-secondary)',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    fontSize: '14px'
                                }}>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                                        DELIVERABLE
                                    </div>
                                    <div style={{ color: 'var(--color-text)' }}>{confirmProject.deliverable}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setConfirmProject(null)}
                                    style={{
                                        flex: 1, padding: '14px', borderRadius: '12px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface)',
                                        color: 'var(--color-text)',
                                        fontWeight: '600', cursor: 'pointer', fontSize: '15px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCreateProject}
                                    style={{
                                        flex: 1, padding: '14px', borderRadius: '12px',
                                        border: 'none',
                                        background: 'var(--color-primary)',
                                        color: '#fff',
                                        fontWeight: '600', cursor: 'pointer', fontSize: '15px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Target size={18} />
                                    Start Project
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* CURRICULUM CONTENT */}
                {!generating && content.levels && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>

                        {/* DEFINITION */}
                        <div style={{ marginTop: '40px', marginBottom: '40px' }}>
                            <h2 style={sectionHeaderStyle}><BookOpen size={24} /> Core Definition</h2>
                            <div style={contentBoxStyle}>
                                <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px', color: 'var(--color-text)' }}>
                                    {content.definition?.coreResult}
                                </p>
                                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                    <strong style={{ color: 'var(--color-primary)' }}>Why it matters:</strong> {content.definition?.importance}
                                </p>
                            </div>
                        </div>

                        {/* LEVELS PROGRESSION */}
                        <div style={{ marginTop: '40px' }}>
                            <h2 style={sectionHeaderStyle}><Target size={24} /> 10 Levels of Mastery</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {content.levels.map((lvl: any, idx: number) => {
                                    const status = isLevelUnlocked(lvl.level);
                                    const isCurrent = lvl.level === level;

                                    return (
                                        <LevelCard
                                            key={idx}
                                            lvl={lvl}
                                            currentLevel={level}
                                            status={status}
                                            isCurrent={isCurrent}
                                            isSpeaking={speakingLevel === lvl.level}
                                            onTalk={() => handleTalk(lvl)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* PROJECTS */}
                        <div style={{ marginTop: '40px' }}>
                            <h2 style={sectionHeaderStyle}><Lightbulb size={24} /> Recommended Projects</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                {content.projects?.map((proj: any, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        style={{ ...projectCardStyle, cursor: 'pointer' }}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => handleProjectClick(proj)}
                                    >
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '8px' }}>
                                            LEVEL {proj.level}
                                        </div>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{proj.title}</h4>
                                        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', flex: 1 }}>{proj.description}</p>
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>DELIVERABLE</div>
                                            <div style={{ fontSize: '13px' }}>{proj.deliverable}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                    </motion.div>
                )}

                {/* EMPTY/FAIL STATE */}
                {!generating && (!content.levels || content.levels.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)' }}>
                        <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3>Curriculum Not Available</h3>
                        <p style={{ marginBottom: '24px' }}>It seems Lugh hasn't finished writing this yet.</p>
                        <button
                            onClick={() => {
                                generationAttempted.current = false;
                                setGenerating(true); // Trigger effect
                            }}
                            style={buttonStyle}
                        >
                            <Loader2 size={16} style={{ marginRight: '8px', display: 'inline' }} />
                            Generate Curriculum
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};


// --- SUB COMPONENTS ---
const LevelCard = ({ lvl, level, status, isCurrent, isSpeaking, onTalk }: any) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            onClick={(e) => {
                // Prevent toggle if clicking button
                if ((e.target as HTMLElement).closest('button')) return;
                setExpanded(!expanded);
            }}
            style={{
                ...levelCardStyle,
                cursor: 'pointer',
                opacity: status.unlocked ? 1 : 0.6,
                border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: isCurrent ? 'rgba(245, 158, 11, 0.05)' : 'var(--color-surface)'
            }}
        >
            <div style={{ minWidth: '80px', textAlign: 'center', borderRight: '1px solid var(--color-border)', paddingRight: '20px', marginRight: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>LEVEL</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: status.unlocked ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}>{lvl.level}</div>
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{lvl.name}</h3>
                        {status.unlocked ? (
                            <CheckCircle size={18} color="#10b981" />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                <Lock size={12} /> {status.reason}
                            </div>
                        )}
                    </div>
                    {/* Expand indicator similar to accordion */}
                    <div style={{ fontSize: '20px', color: 'var(--color-text-tertiary)' }}>{expanded ? '−' : '+'}</div>
                </div>

                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{lvl.description}</p>
                <div style={{ background: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', display: 'inline-block' }}>
                    <strong>Output:</strong> {lvl.expectedResult}
                </div>

                {/* EXPANDED CONTENT */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden', marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}
                        >
                            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                                <strong>Evaluation Criteria:</strong> {lvl.criteria || "Demonstrate consistent mastery of this level's output."}
                            </p>

                            {/* ACTION BUTTON */}
                            <button
                                onClick={onTalk}
                                disabled={isSpeaking}
                                style={{
                                    background: isSpeaking ? 'var(--color-text-tertiary)' : 'var(--color-primary)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: isSpeaking ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginTop: '8px',
                                    opacity: isSpeaking ? 0.8 : 1
                                }}
                            >
                                {isSpeaking ? (
                                    <Loader2 className="spin" size={16} />
                                ) : (
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}></div>
                                )}
                                {isSpeaking ? 'Thinking...' : `Talk with ARIS about Level ${lvl.level}`}
                            </button>

                            {!status.unlocked && (
                                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
                                    <strong>Requirements not met:</strong> {status.reason}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- STYLES & COMPONENTS ---
const hamburgerStyle = {
    position: 'fixed' as const, top: '20px', left: '20px', zIndex: 50,
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    cursor: 'pointer', padding: '10px', borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)', color: 'var(--color-text)'
};

const buttonStyle = {
    marginTop: '16px', padding: '8px 16px', background: 'var(--color-primary)',
    color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer'
};

const backButtonStyle = {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '14px'
};

const headerCardStyle = {
    background: 'var(--color-surface)', borderRadius: '24px', padding: '32px',
    border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
};

const iconContainerStyle = {
    width: '80px', height: '80px', borderRadius: '16px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
};

const sectionHeaderStyle = {
    fontSize: '24px', fontWeight: 'bold', marginBottom: '20px',
    display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text)'
};

const contentBoxStyle = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: '16px', padding: '24px'
};

const levelCardStyle = {
    display: 'flex', alignItems: 'flex-start', // Changed to flex-start for expansion
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: '16px', padding: '20px', transition: 'all 0.2s ease'
};

const projectCardStyle = {
    background: 'var(--color-bg-secondary)', borderRadius: '16px', padding: '20px',
    display: 'flex', flexDirection: 'column' as const, border: '1px solid transparent'
};

const generatingStyle = {
    textAlign: 'center' as const, padding: '60px',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '16px',
    color: 'var(--color-text-secondary)'
};

const StatCard = ({ icon, label, value, color }: any) => (
    <div style={{
        background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: '16px',
        display: 'flex', flexDirection: 'column', gap: '8px'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
            {icon}
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{label}</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: '800', color: color || 'var(--color-text)' }}>{value}</div>
    </div>
);

export default SkillDetailPage;

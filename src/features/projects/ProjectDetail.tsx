import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Clock, Target, AlertCircle, CheckCircle,
    Link as LinkIcon, FileText, Image, PenTool, Lock, Unlock, Eye, Trash2, Wand2, MessageCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useGlobal } from '../../context/GlobalContext';
import ChatSidebar from '../conversation/ChatSidebar';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useGlobal();

    const [project, setProject] = useState(null);
    const [artifacts, setArtifacts] = useState([]);
    const [reflections, setReflections] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // overview, artifacts, reflections, settings
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Form states
    const [newArtifact, setNewArtifact] = useState({ name: '', type: 'link', content: '' });
    const [newReflection, setNewReflection] = useState('');
    const [isArchitecting, setIsArchitecting] = useState(false);
    const [isStartingConversation, setIsStartingConversation] = useState(false);

    // Handler for "Talk with ARIS" button
    const handleTalkWithAris = async () => {
        setIsStartingConversation(true);
        try {
            const result = await api.startProjectConversation(id);
            if (result?.conversationId) {
                navigate(`/conversation/${result.conversationId}`);
            } else {
                alert('Failed to start conversation');
            }
        } catch (err) {
            console.error('Error starting conversation:', err);
            alert('Failed to start conversation');
        } finally {
            setIsStartingConversation(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch projects and find the current one (or fetch single if endpoint exists)
                // For now relying on getProjects list but better to have single fetch
                const projects = await api.getProjects(user.id);
                const current = projects.find(p => p.id === id);
                if (current) {
                    setProject(current);
                    const arts = await api.getProjectArtifacts(id);
                    setArtifacts(arts);
                    const refs = await api.getProjectReflections(id);
                    setReflections(refs);
                } else {
                    // navigate('/projects'); // Redirect if not found
                }
            } catch (error) {
                console.error("Error fetching project details:", error);
            } finally {
                setLoading(false);
            }
        };
        if (user && id) fetchData();
    }, [id, user]);

    const handleUpdateStatus = async (newStatus) => {
        const updated = await api.updateProject(id, { status: newStatus });
        if (updated) setProject(updated);
    };

    const handleUpdateVisibility = async (newVisibility) => {
        const updated = await api.updateProject(id, { visibility: newVisibility });
        if (updated) setProject(updated);
    };

    const handleAddArtifact = async (e) => {
        e.preventDefault();
        const added = await api.addProjectArtifact(id, newArtifact);
        if (added) {
            setArtifacts([added, ...artifacts]);
            setNewArtifact({ name: '', type: 'link', content: '' });
        }
    };

    const handleDeleteArtifact = async (artifactId) => {
        if (confirm('Are you sure you want to delete this artifact?')) {
            const success = await api.deleteProjectArtifact(artifactId);
            if (success) {
                setArtifacts(artifacts.filter(a => a.id !== artifactId));
            }
        }
    };

    const handleArchitectProject = async () => {
        setIsArchitecting(true);
        try {
            const updated = await api.architectProject(id);
            if (updated) setProject(updated);
        } catch (err) {
            console.error('Daedalus error:', err);
            alert('Failed to architect project: ' + err.message);
        } finally {
            setIsArchitecting(false);
        }
    };

    const handleAddReflection = async (e) => {
        e.preventDefault();
        const added = await api.addProjectReflection(id, newReflection);
        if (added) {
            setReflections([added, ...reflections]);
            setNewReflection('');
        }
    };

    if (loading) return <div className="container" style={{ paddingTop: '40px', color: 'var(--color-text)' }}>Loading...</div>;
    if (!project) return <div className="container" style={{ paddingTop: '40px', color: 'var(--color-text)' }}>Project not found</div>;

    const sections = [
        { id: 'overview', label: 'Overview', icon: Target },
        { id: 'artifacts', label: 'Artifacts', icon: PenTool },
        { id: 'reflections', label: 'Reflections', icon: FileText }, // Private
        { id: 'settings', label: 'Settings', icon: Lock },
    ];

    const hamburgerStyle = {
        position: 'fixed', top: '20px', left: '20px', zIndex: 50,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        cursor: 'pointer', padding: '10px', borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)', color: 'var(--color-text)'
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', height: '100%', overflowY: 'auto', paddingTop: '80px' }}>
            <ChatSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNewChat={() => navigate('/conversation')} />

            {/* Hamburger Button */}
            <button onClick={() => setIsSidebarOpen(true)} style={hamburgerStyle}>
                <div style={{ width: '24px', height: '2px', background: 'currentColor', marginBottom: '4px' }}></div>
                <div style={{ width: '16px', height: '2px', background: 'currentColor', marginBottom: '4px' }}></div>
                <div style={{ width: '24px', height: '2px', background: 'currentColor' }}></div>
            </button>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <button
                    onClick={() => navigate('/projects')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'none', border: 'none',
                        color: 'var(--color-text-secondary)',
                        fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                        marginBottom: '16px', padding: 0
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Projects
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)', flex: 1 }}>{project.title}</h1>

                    {/* Talk with ARIS Button */}
                    <button
                        onClick={handleTalkWithAris}
                        disabled={isStartingConversation}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 16px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, #d97706 100%)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            fontWeight: '600', fontSize: '14px',
                            boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)',
                            opacity: isStartingConversation ? 0.7 : 1,
                            transition: 'transform 0.2s, opacity 0.2s'
                        }}
                    >
                        <MessageCircle size={18} />
                        {isStartingConversation ? 'Starting...' : (project.conversation_id ? 'Continue with ARIS' : 'Talk with ARIS')}
                    </button>

                    <span style={{
                        padding: '6px 12px', borderRadius: 'var(--radius-full)',
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text)',
                        fontSize: '13px', fontWeight: '600', textTransform: 'uppercase',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        {project.status === 'active' && <Clock size={14} />}
                        {project.status === 'idea' && <Target size={14} />}
                        {project.status === 'completed' && <CheckCircle size={14} />}
                        {project.status}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--color-border-light)' }}>
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveTab(section.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: activeTab === section.id ? 'var(--color-text)' : 'transparent',
                            color: activeTab === section.id ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                            border: 'none', padding: '10px 20px',
                            borderRadius: '8px 8px 0 0',
                            fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <section.icon size={16} />
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Content Range */}
            <div style={{ flex: 1, overflowY: 'auto' }}>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* 1. Origin / What is this about? */}
                        <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--color-text-secondary)', fontSize: '14px', textTransform: 'uppercase' }}>What is this about?</h3>
                            <p style={{ fontSize: '18px', lineHeight: '1.6', color: 'var(--color-text)', fontWeight: '500' }}>
                                {project.origin || project.why_i_care || project.whyICare || 'No description yet.'}
                            </p>
                        </div>

                        {/* Daedalus Architecture Display */}
                        {project.architecture && project.architecture.claim ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div className="card" style={{ padding: '24px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                                        <h3 style={{ marginTop: 0, color: 'var(--color-primary)', fontSize: '14px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Target size={16} /> The Claim (Hypothesis)
                                        </h3>
                                        <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--color-text)' }}>{project.architecture.claim}</p>
                                    </div>
                                    <div className="card" style={{ padding: '24px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                                        <h3 style={{ marginTop: 0, color: '#f59e0b', fontSize: '14px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Lock size={16} /> The Constraint
                                        </h3>
                                        <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--color-text)' }}>{project.architecture.constraint}</p>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                                    <h3 style={{ marginTop: 0, color: 'var(--color-text-secondary)', fontSize: '14px', textTransform: 'uppercase' }}>The Build (Output)</h3>
                                    <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--color-text)' }}>{project.architecture.build}</p>
                                </div>

                                <div className="card" style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px' }}>
                                    <h3 style={{ marginTop: 0, color: '#ef4444', fontSize: '14px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertCircle size={16} /> Failure Surface
                                    </h3>
                                    <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--color-text)' }}>{project.architecture.failure_surface}</p>
                                </div>

                                <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                                    <h3 style={{ marginTop: 0, color: 'var(--color-text-secondary)', fontSize: '14px', textTransform: 'uppercase' }}>Finish Line</h3>
                                    <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--color-text)' }}>{project.architecture.finish_line}</p>
                                </div>

                                {project.architecture.icarus_warning && (
                                    <div style={{ padding: '16px', background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px', color: '#b45309' }}>
                                        <strong>Icarus Warning:</strong> {project.architecture.icarus_warning}
                                    </div>
                                )}
                            </>
                        ) : (
                            // Legacy Fallback - No Daedalus architecture yet
                            <>
                                {/* Populate Project Button */}
                                <div style={{
                                    padding: '24px',
                                    background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.1) 0%, rgba(255, 159, 67, 0.1) 100%)',
                                    border: '2px dashed var(--color-primary)',
                                    borderRadius: '16px',
                                    textAlign: 'center'
                                }}>
                                    <Wand2 size={32} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
                                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text)' }}>Let Daedalus Architect This Project</h3>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
                                        Daedalus will design a small, honest project with claims, constraints, and failure surfaces.
                                    </p>
                                    <button
                                        onClick={handleArchitectProject}
                                        disabled={isArchitecting}
                                        className="btn-primary"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            opacity: isArchitecting ? 0.7 : 1
                                        }}
                                    >
                                        <Wand2 size={18} />
                                        {isArchitecting ? 'Architecting...' : 'Populate Project'}
                                    </button>
                                </div>

                                <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                                    <h3 style={{ marginTop: 0, color: 'var(--color-text-secondary)', fontSize: '14px', textTransform: 'uppercase' }}>Intent / Scope</h3>
                                    <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--color-text)' }}>{project.intent || project.scope || 'No scope defined.'}</p>
                                </div>
                                <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                                    <h3 style={{ marginTop: 0, color: 'var(--color-text-secondary)', fontSize: '14px', textTransform: 'uppercase' }}>Done When</h3>
                                    <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--color-text)' }}>{project.definition_of_done || project.doneWhen || 'No definition of done.'}</p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ARTIFACTS TAB */}
                {activeTab === 'artifacts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* New Artifact Form */}
                        <div className="card" style={{ padding: '20px', background: 'var(--color-bg-secondary)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--color-text)' }}>Add Artifact</h3>
                            <form onSubmit={handleAddArtifact} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Name</label>
                                    <input
                                        required
                                        value={newArtifact.name}
                                        onChange={e => setNewArtifact({ ...newArtifact, name: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px', borderRadius: '6px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg)', color: 'var(--color-text)'
                                        }}
                                        placeholder="My Sketch"
                                    />
                                </div>
                                <div style={{ width: '120px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Type</label>
                                    <select
                                        value={newArtifact.type}
                                        onChange={e => setNewArtifact({ ...newArtifact, type: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px', borderRadius: '6px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg)', color: 'var(--color-text)'
                                        }}
                                    >
                                        <option value="link">Link</option>
                                        <option value="file">File (Stub)</option>
                                        <option value="text">Note</option>
                                        <option value="image">Image (URL)</option>
                                    </select>
                                </div>
                                <div style={{ flex: 2, minWidth: '300px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Content / URL</label>
                                    <input
                                        required
                                        value={newArtifact.content}
                                        onChange={e => setNewArtifact({ ...newArtifact, content: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px', borderRadius: '6px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg)', color: 'var(--color-text)'
                                        }}
                                        placeholder="https://..."
                                    />
                                </div>
                                <button type="submit" className="btn-primary" style={{
                                    padding: '8px 16px', height: '35px', borderRadius: '8px',
                                    background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer'
                                }}>Add</button>
                            </form>
                        </div>

                        {/* List */}
                        {artifacts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-tertiary)' }}>No artifacts yet. What have you made?</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                                {artifacts.map(art => (
                                    <div key={art.id} className="card" style={{
                                        padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
                                        background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text)' }}>
                                                {art.type === 'link' && <LinkIcon size={16} />}
                                                {art.type === 'image' && <Image size={16} />}
                                                {art.type === 'text' && <FileText size={16} />}
                                                <span style={{ fontWeight: '600' }}>{art.name}</span>
                                            </div>
                                            <button onClick={() => handleDeleteArtifact(art.id)} style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        {art.type === 'image' ? (
                                            <img src={art.content} alt={art.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} />
                                        ) : (
                                            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>
                                                {art.type === 'link' ? <a href={art.content} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>{art.content}</a> : art.content}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* REFLECTIONS TAB */}
                {activeTab === 'reflections' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{
                            background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.2)',
                            padding: '12px', borderRadius: '8px', color: 'var(--color-text)', fontSize: '14px',
                            display: 'flex', gap: '8px', alignItems: 'center'
                        }}>
                            <Lock size={16} color="var(--color-primary)" />
                            <span>These reflections are private. Only you can see them.</span>
                        </div>

                        {/* New Reflection Form */}
                        <div className="card" style={{ padding: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--color-text)' }}>New Reflection</h3>
                            <form onSubmit={handleAddReflection}>
                                <textarea
                                    required
                                    value={newReflection}
                                    onChange={e => setNewReflection(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg)', color: 'var(--color-text)',
                                        fontFamily: 'inherit', minHeight: '100px', resize: 'vertical'
                                    }}
                                    placeholder="What did you learn today? What was hard?"
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                    <button type="submit" className="btn-primary" style={{
                                        padding: '8px 16px', borderRadius: '8px',
                                        background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer'
                                    }}>Save Reflection</button>
                                </div>
                            </form>
                        </div>

                        {/* List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {reflections.map(ref => (
                                <div key={ref.id} className="card" style={{ padding: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
                                        {new Date(ref.created_at).toLocaleDateString()} at {new Date(ref.created_at).toLocaleTimeString()}
                                    </div>
                                    <div style={{ lineHeight: '1.6', color: 'var(--color-text)' }}>{ref.content}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
                        <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--color-text)' }}>Project Status</h3>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {['idea', 'active', 'paused', 'completed'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleUpdateStatus(s)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: 'var(--radius-full)',
                                            border: project.status === s ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            background: project.status === s ? 'var(--color-bg-tertiary)' : 'transparent',
                                            color: project.status === s ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                            textTransform: 'capitalize',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Delete Project */}
                        <div className="card" style={{
                            padding: '24px',
                            background: 'var(--color-surface)',
                            border: '1px solid #ef4444',
                            borderRadius: '16px'
                        }}>
                            <h3 style={{ marginTop: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trash2 size={20} />
                                Delete Project
                            </h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
                                Once deleted, this project and all its artifacts and reflections will be permanently removed.
                            </p>
                            <button
                                onClick={async () => {
                                    if (window.confirm(`Are you sure you want to delete "${project.title}"? This cannot be undone.`)) {
                                        const success = await api.deleteProject(id);
                                        if (success) {
                                            navigate('/projects');
                                        } else {
                                            alert('Failed to delete project');
                                        }
                                    }
                                }}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#ef4444',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                            >
                                <Trash2 size={16} />
                                Delete Project
                            </button>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default ProjectDetail;


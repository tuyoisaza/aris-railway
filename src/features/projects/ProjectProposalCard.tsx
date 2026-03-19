import React, { useState, useEffect } from 'react';
import { Briefcase, Check, Loader } from 'lucide-react';
import { api } from '../../services/api';
import { useGlobal } from '../../context/GlobalContext';
import { useNavigate } from 'react-router-dom';

const ProjectProposalCard = ({ projectData, onProposed }) => {
    const { user } = useGlobal();
    const navigate = useNavigate();
    const [status, setStatus] = useState('creating'); // 'creating' | 'created' | 'error'

    // Auto-create project when card is rendered with deduplication
    useEffect(() => {
        // Prevent multiple simultaneous creations
        if (status !== 'creating') return;
        
        const createProject = async () => {
            // Additional deduplication: check if project with same title already exists
            if (!projectData?.title) {
                console.error('[ProjectProposalCard] No project title provided');
                setStatus('error');
                return;
            }

            try {
                console.log('[ProjectProposalCard] Creating project:', projectData.title);
                
                const newProject = await api.createProject({
                    userId: user.id,
                    title: projectData.title,
                    whyICare: projectData.whyICare,
                    intent: projectData.intent,
                    doneWhen: projectData.doneWhen,
                    scope: projectData.intent,
                    status: 'idea'
                });

                if (newProject) {
                    console.log('[ProjectProposalCard] Project created successfully:', newProject.id);
                    setStatus('created');
                    if (onProposed) onProposed(newProject);
                } else {
                    console.error('[ProjectProposalCard] API returned null/undefined project');
                    setStatus('error');
                }
            } catch (error) {
                // Check if error is due to duplicate project
                if (error.message?.includes('duplicate') || error.code === '23505') {
                    console.log('[ProjectProposalCard] Project already exists, treating as success');
                    setStatus('created');
                    // Try to fetch existing project
                    try {
                        const existingProjects = await api.getProjects(user.id);
                        const existing = existingProjects.find(p => p.title === projectData.title);
                        if (existing && onProposed) onProposed(existing);
                    } catch (fetchError) {
                        console.error('[ProjectProposalCard] Failed to fetch existing project:', fetchError);
                    }
                } else {
                    console.error('[ProjectProposalCard] Failed to create project:', error);
                    setStatus('error');
                }
            }
        };

        createProject();
    }, [projectData.title, status]); // Add dependencies to track changes

    // Show creating state
    if (status === 'creating') {
        return (
            <div className="card" style={{ padding: '24px', width: '100%', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--color-primary)' }}>
                    <Briefcase size={20} />
                    <span style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Creating Project...</span>
                </div>

                <h3 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>{projectData.title}</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-secondary)' }}>
                    <Loader size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Setting up your project...</span>
                </div>
            </div>
        );
    }

    // Show error state
    if (status === 'error') {
        return (
            <div className="card" style={{ padding: '24px', width: '100%', border: '1px solid #ef4444' }}>
                <div style={{ color: '#ef4444', fontWeight: '600' }}>
                    Failed to create project. Please try again.
                </div>
            </div>
        );
    }

    // Show created state (success)
    return (
        <div className="card" style={{ padding: '24px', width: '100%', border: '2px solid var(--color-success)', background: 'rgba(16, 185, 129, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--color-success)' }}>
                <Check size={20} />
                <span style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Project Created!</span>
            </div>

            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>{projectData.title}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>INTENT</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{projectData.intent}</div>
                </div>
                <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>DONE WHEN</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{projectData.doneWhen}</div>
                </div>
            </div>

            <button
                onClick={() => navigate('/projects')}
                className="btn-primary"
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%' }}
            >
                View in Projects
            </button>
        </div>
    );
};

export default ProjectProposalCard;

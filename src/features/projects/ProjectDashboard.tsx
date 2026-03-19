import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FolderPlus, X, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';
import { useGlobal } from '../../context/GlobalContext';
import ChatSidebar from '../conversation/ChatSidebar';
import { api } from '../../services/api';
import BulkDeleteBar from '../../components/BulkDeleteBar';

import { useLocation } from 'react-router-dom';

const ProjectDashboard = () => {
    const { t } = useTranslation();
    const { projects, refreshData, user, clearMessages } = useGlobal();
    const navigate = useNavigate();
    const location = useLocation();
    const [filter, setFilter] = useState('all');
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [initialModalData, setInitialModalData] = useState(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Clear selection when mode turned off
    const toggleSelectionMode = () => {
        if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedIds([]);
        } else {
            setIsSelectionMode(true);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Using force? Delete ${selectedIds.length} projects permanently?`)) return;

        setIsBulkDeleting(true);
        try {
            // Sequential delete to avoid overwhelming if many (or Map if API allows parallel)
            // api.deleteProject handles one by one.
            await Promise.all(selectedIds.map(id => api.deleteProject(id)));
            refreshData();
            setSelectedIds([]);
            setIsSelectionMode(false); // Optional: Exit mode after delete
        } catch (e) {
            alert("Some projects failed to delete.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // Handle Guided Actions (e.g. ActionRegistry -> Project Action)
    React.useEffect(() => {
        const state = location.state as any;
        if (state?.guidedAction?.type === 'project') {
            console.log("Guided Action Triggered Project Creation:", state.guidedAction);
            setInitialModalData({
                description: state.guidedAction.intent
            });
            setShowNewProjectModal(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleProjectCreated = () => {
        refreshData();
    };

    const handleNewChat = () => {
        clearMessages();
        setIsSidebarOpen(false);
        navigate('/');
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        setIsDeleting(true);
        try {
            const success = await api.deleteProject(projectToDelete.id);
            if (success) {
                refreshData();
                setProjectToDelete(null);
            } else {
                alert('Failed to delete project');
            }
        } catch (error) {
            alert('Error deleting project: ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const tabs = [
        { id: 'all', label: t('projects.allProjects') },
        { id: 'active', label: t('projects.active') },
        { id: 'idea', label: t('projects.ideas') },
        { id: 'completed', label: t('projects.completed') }
    ];

    const filteredProjects = (projects || []).filter(p => {
        if (filter === 'all') return true;
        return p.status === filter;
    });

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Sidebar */}
            <ChatSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onNewChat={handleNewChat}
            />

            {/* Navigation Controls */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        padding: '10px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                >
                    <div style={{ width: '24px', height: '2px', background: 'var(--color-text)', marginBottom: '4px' }}></div>
                    <div style={{ width: '16px', height: '2px', background: 'var(--color-text)', marginBottom: '4px' }}></div>
                    <div style={{ width: '24px', height: '2px', background: 'var(--color-text)' }}></div>
                </button>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        padding: 0
                    }}
                >
                    <ArrowLeft size={18} />
                    {t('projects.backToChat')}
                </button>
            </div>

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontWeight: '700', fontSize: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Briefcase size={32} color="var(--color-primary)" />
                        {t('projects.title')}
                    </h1>
                    <p style={{ margin: '8px 0 16px', color: 'var(--color-text-secondary)', marginLeft: '44px' }}>
                        {t('projects.subtitle')}
                    </p>
                    <div style={{ marginLeft: '44px', display: 'flex', gap: '12px' }}>
                        <button
                            className="btn-primary"
                            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                            onClick={() => setShowNewProjectModal(true)}
                        >
                            <FolderPlus size={18} />
                            {t('projects.newProject')}
                        </button>

                        <button
                            onClick={toggleSelectionMode}
                            style={{
                                display: 'flex', gap: '8px', alignItems: 'center',
                                background: isSelectionMode ? 'var(--color-bg-secondary)' : 'transparent',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                                padding: '10px 16px', borderRadius: '12px',
                                fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            {isSelectionMode ? 'Cancel Selection' : 'Select'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '16px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        style={{
                            background: filter === tab.id ? 'var(--color-primary)' : 'transparent',
                            color: filter === tab.id ? '#fff' : 'var(--color-text-secondary)',
                            border: filter === tab.id ? 'none' : '1px solid var(--color-border)',
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <BulkDeleteBar
                selectedCount={selectedIds.length}
                onDelete={handleBulkDelete}
                onCancel={() => setSelectedIds([])}
                isDeleting={isBulkDeleting}
                itemName="Projects"
            />

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '24px'
            }}>
                {filteredProjects.map(project => (
                    <div key={project.id} onClick={(e) => {
                        // If selection mode is active (any selected), clicking card toggles it
                        if (isSelectionMode) {
                            e.preventDefault();
                            handleToggleSelect(project.id);
                        } else {
                            navigate(`/projects/${project.id}`)
                        }
                    }} style={{ cursor: 'pointer' }}>
                        <ProjectCard
                            project={project}
                            onDelete={isSelectionMode ? undefined : (p) => setProjectToDelete(p)}
                            selected={selectedIds.includes(project.id)}
                            onToggleSelect={isSelectionMode ? handleToggleSelect : undefined}
                        />
                    </div>
                ))}
            </div>

            {showNewProjectModal && (
                <CreateProjectModal
                    onClose={() => {
                        setShowNewProjectModal(false);
                        setInitialModalData(null);
                    }}
                    onCreated={handleProjectCreated}
                    initialData={initialModalData}
                />
            )}

            {/* Delete Confirmation Modal */}
            {projectToDelete && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'var(--color-surface)',
                        borderRadius: '20px',
                        padding: '32px',
                        width: '90%',
                        maxWidth: '420px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <AlertTriangle size={24} color="#ef4444" />
                            </div>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>Delete Project?</h2>
                        </div>

                        <p style={{
                            color: 'var(--color-text-secondary)',
                            marginBottom: '8px',
                            lineHeight: '1.5'
                        }}>
                            Are you sure you want to delete <strong style={{ color: 'var(--color-text)' }}>"{projectToDelete.title}"</strong>?
                        </p>
                        <p style={{
                            color: 'var(--color-text-tertiary)',
                            marginBottom: '24px',
                            fontSize: '14px'
                        }}>
                            This will permanently remove the project and all its artifacts and reflections. This action cannot be undone.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setProjectToDelete(null)}
                                disabled={isDeleting}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--color-border)',
                                    background: 'transparent',
                                    color: 'var(--color-text)',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteProject}
                                disabled={isDeleting}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: '#ef4444',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: isDeleting ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: isDeleting ? 0.7 : 1
                                }}
                            >
                                <Trash2 size={16} />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDashboard;

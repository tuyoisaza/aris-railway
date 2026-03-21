import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { Sword, Star, Trophy, ArrowRight, LayoutGrid, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../../context/GlobalContext';
import ChatSidebar from '../conversation/ChatSidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import BulkDeleteBar from '../../components/BulkDeleteBar';

import { Trash2, Plus, X } from 'lucide-react';

const AddSkillModal = ({ isOpen, onClose, onAdd, t, initialName = '' }) => {
    const [skillName, setSkillName] = useState(initialName);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && initialName) {
            setSkillName(initialName);
        }
    }, [isOpen, initialName]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!skillName.trim()) return;

        setSubmitting(true);
        await onAdd(skillName);
        setSubmitting(false);
        setSkillName('');
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: 'var(--color-surface)', width: '90%', maxWidth: '400px',
                    padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>{t('skills.addNew')}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{t('skills.skillName')}</label>
                        <input
                            autoFocus
                            type="text"
                            value={skillName}
                            onChange={(e) => setSkillName(e.target.value)}
                            placeholder={t('skills.placeholder')}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                                color: 'var(--color-text)', fontSize: '16px', outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}>{t('common.cancel')}</button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: '10px 24px', borderRadius: '8px', border: 'none',
                                background: 'var(--color-primary)', color: '#fff', fontWeight: 'bold',
                                cursor: 'pointer', opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting ? t('skills.adding') : t('skills.addSkill')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

import SkillCard from './SkillCard';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, t }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 110,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: 'var(--color-surface)', width: '90%', maxWidth: '400px',
                    padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)', textAlign: 'center'
                }}
            >
                <div style={{
                    width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444', borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                }}>
                    <Trash2 size={32} />
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{t('skills.deleteSkill')}</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                    {t('skills.deleteConfirm')} <strong>{itemName}</strong>? <br />
                    {t('skills.deleteWarning')}
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                            background: 'var(--color-bg-secondary)', color: 'var(--color-text)',
                            fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                            background: '#ef4444', color: '#fff',
                            fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        {t('skills.deleteForever')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const SkillsPage = () => {
    const { user } = useGlobal();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [skillToDelete, setSkillToDelete] = useState(null);
    const [suggestedSkillName, setSuggestedSkillName] = useState('');

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
        if (!confirm(`Warning: Delete ${selectedIds.length} skills permanently? Only safe for testing!`)) return;

        setIsBulkDeleting(true);
        try {
            console.log('[SkillsPage] Bulk deleting IDs:', selectedIds);
            await api.deleteSkills(selectedIds);

            console.log('[SkillsPage] Bulk delete success');
            setSkills(prev => prev.filter(s => !selectedIds.includes(s.id)));
            setSelectedIds([]);
            setIsSelectionMode(false);
        } catch (e) {
            console.error(e);
            alert("Some skills failed to delete.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    useEffect(() => {
        const state = location.state as any;
        if (state?.guidedAction?.type === 'skill' && user) {
            console.log("Guided Action Triggered Skill Creation:", state.guidedAction);
            const { payload, intent } = state.guidedAction;

            // Determine best name/description
            let name = intent || 'New Skill';
            let description = '';

            if (typeof payload === 'string') {
                // If payload is short, it might be the title. If long, it's definitely description.
                if (payload.length < 50 && !intent) {
                    name = payload;
                } else {
                    description = payload;
                }
            } else if (typeof payload === 'object') {
                description = JSON.stringify(payload);
            }

            // Auto-create and navigate
            handleAddSkill({ title: name, description, category: 'Guided' });

            // Clean up state immediately
            window.history.replaceState({}, document.title);
        }
    }, [location.state, user]);

    const fetchSkills = async () => {
        if (!user) return;
        try {
            const { data, error } = await api.getSkills();

            if (error) console.error('Error fetching skills:', error);
            else setSkills(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [user]);

    const confirmDelete = (skill) => {
        console.log('[SkillsPage] confirmDelete called for:', skill?.skill?.title || skill?.title);
        setSkillToDelete(skill);
    };

    const handleDeleteSkill = async () => {
        if (!skillToDelete) {
            console.warn('[SkillsPage] handleDeleteSkill called but no skillToDelete set');
            return;
        }

        console.log('[SkillsPage] Attempting to delete skill:', skillToDelete.id);

        try {
            await api.deleteSkill(skillToDelete.id);

            console.log('[SkillsPage] Skill deleted successfully');

            setSkills(prev => prev.filter(s => s.id !== skillToDelete.id));
            setSkillToDelete(null);
        } catch (err) {
            console.error("[SkillsPage] Error deleting skill:", err);
            alert(t('skills.failedToDelete'));
        }
    };

    const handleAddSkill = async (skillInput) => {
        const name = typeof skillInput === 'string' ? skillInput : skillInput.title;
        const description = typeof skillInput === 'object' ? skillInput.description : null;
        const category = typeof skillInput === 'object' ? skillInput.category : 'General';

        console.log('[SkillsPage] Handling Add Skill:', { name, description });

        try {
            const { data, error } = await api.createSkill({ title: name, category, description });

            if (error) throw error;

            const skillId = data?.skill?.id;
            if (!skillId) {
                throw new Error('Failed to create skill');
            }

            navigate(`/skills/${skillId}`);

        } catch (err) {
            console.error('Error adding skill:', err);
            alert(t('skills.failedToAdd'));
        }
    };

    return (
        <div style={{
            padding: '40px',
            maxWidth: '1200px',
            margin: '0 auto',
            height: '100%',
            overflowY: 'auto',
            paddingTop: '80px' // Added top padding for fixed hamburger
        }}>
            <ChatSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNewChat={() => navigate('/conversation')} />

            <AddSkillModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setSuggestedSkillName('');
                }}
                onAdd={handleAddSkill}
                t={t}
                initialName={suggestedSkillName}
            />

            <DeleteConfirmationModal
                isOpen={!!skillToDelete}
                onClose={() => setSkillToDelete(null)}
                onConfirm={handleDeleteSkill}
                itemName={skillToDelete?.skill?.title || skillToDelete?.title || t('skills.title')}
                t={t}
            />

            <BulkDeleteBar
                selectedCount={selectedIds.length}
                onDelete={handleBulkDelete}
                onCancel={() => setSelectedIds([])}
                isDeleting={isBulkDeleting}
                itemName="Skills"
            />

            {/* Hamburger Button */}
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
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LayoutGrid size={32} color="var(--color-primary)" />
                    {t('skills.title')}
                </h1>
                <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', maxWidth: '600px', lineHeight: 1.6, marginBottom: '24px' }}>
                    {t('skills.subtitle')}
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'var(--color-primary)', color: '#fff',
                            border: 'none', padding: '12px 20px', borderRadius: '12px',
                            fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                            width: 'fit-content' // Ensure it doesn't stretch
                        }}
                    >
                        <Plus size={20} />
                        {t('skills.addSkill')}
                    </button>

                    <button
                        onClick={toggleSelectionMode}
                        style={{
                            display: 'flex', gap: '8px', alignItems: 'center',
                            background: isSelectionMode ? 'var(--color-bg-secondary)' : 'transparent',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            padding: '12px 20px', borderRadius: '12px',
                            fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        {isSelectionMode ? 'Cancel Selection' : 'Select'}
                    </button>
                </div>
            </header>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    {t('skills.loading')}
                </div>
            ) : skills.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    background: 'var(--color-surface)',
                    borderRadius: '24px',
                    border: '2px dashed var(--color-border)'
                }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'var(--color-bg-secondary)',
                        borderRadius: '50%', margin: '0 auto 16px auto', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Sword size={32} color="var(--color-text-tertiary)" />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>{t('skills.noSkills')}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                        {t('skills.noSkillsHint')}
                    </p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        style={{ marginTop: '24px', padding: '10px 20px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--color-text)' }}
                    >
                        {t('skills.addManually')}
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {skills.map(skill => (
                        <SkillCard
                            key={skill.id}
                            skill={skill}
                            onDelete={() => confirmDelete(skill)}
                            t={t}
                            selected={selectedIds.includes(skill.id)}
                            onToggleSelect={isSelectionMode ? handleToggleSelect : null}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SkillsPage;

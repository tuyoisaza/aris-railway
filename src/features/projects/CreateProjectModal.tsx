import React, { useState } from 'react';
import { X, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useGlobal } from '../../context/GlobalContext';

const CreateProjectModal = ({ onClose, onCreated, initialData }) => {
    const { t } = useTranslation();
    const { user } = useGlobal();
    const [loading, setLoading] = useState(false);

    // Simplified form - just name and description
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const newProject = await api.createProject({
                userId: user.id,
                title: formData.title,
                whyICare: formData.description,
                intent: formData.description,
                status: 'idea'
            });

            if (newProject) {
                onCreated(newProject);
                onClose();
            }
        } catch (error) {
            console.error(error);
            alert(t('common.error') + ': Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(8px)'
        }}>
            <div className="card" style={{
                padding: '32px',
                width: '90%',
                maxWidth: '500px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                background: 'var(--color-surface)',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, #ff9f43 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Rocket size={20} color="white" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '22px' }}>{t('projects.newProject')}</h2>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'var(--color-bg-tertiary)',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        padding: '8px',
                        color: 'var(--color-text-secondary)'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                <p style={{
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    fontSize: '15px',
                    lineHeight: '1.5'
                }}>
                    Give your project a name and tell us what you want to explore. Daedalus will help you design the rest! 🚀
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'var(--color-text)'
                        }}>
                            {t('projects.projectTitle')} *
                        </label>
                        <input
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Build a Simple Webpage, Create a Song..."
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: '2px solid var(--color-border)',
                                background: 'var(--color-bg-input)',
                                fontSize: '16px',
                                transition: 'border-color 0.2s',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'var(--color-text)'
                        }}>
                            What do you want to explore? *
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Tell us briefly what you're curious about or want to try..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: '2px solid var(--color-border)',
                                background: 'var(--color-bg-input)',
                                fontFamily: 'inherit',
                                fontSize: '16px',
                                resize: 'none',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                            style={{ padding: '12px 24px' }}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading || !formData.title || !formData.description}
                            style={{
                                padding: '12px 28px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Rocket size={18} />
                            {loading ? t('projects.creating') : t('projects.create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;

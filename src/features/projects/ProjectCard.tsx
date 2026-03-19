import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, Target, AlertCircle, CheckCircle, Trash2, Check } from 'lucide-react';

const ProjectCard = ({ project, onDelete, selected = false, onToggleSelect = null }) => {
    const { title, status, why_i_care, scope, done_when } = project;
    // Handle camelCase vs snake_case if API returns snake_case (Supabase returns snake_case by default!)
    const whyICare = project.whyICare || project.why_i_care;
    const doneWhen = project.doneWhen || project.done_when;


    const getStatusColor = (s) => {
        switch (s) {
            case 'active': return 'var(--color-primary)';
            case 'paused': return '#9CA3AF'; // Gray
            case 'completed': return '#10B981'; // Emerald
            default: return 'var(--color-primary)';
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation(); // Prevent navigating to project detail
        if (onDelete) {
            onDelete(project);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
            className="card"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderLeft: `4px solid ${getStatusColor(status)}`,
                position: 'relative'
            }}
        >
            {/* Selection Checkbox */}
            {onToggleSelect && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(project.id);
                    }}
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

            {/* Delete Button (Only show if NOT in selection mode?) 
                Actually, keep it for single delete convenience unless strictly selection mode.
                Let's hide it if onToggleSelect is active to avoid clutter? 
                Or keep it. User requested "bulk delete", didn't say "remove single delete".
            */}
            {onDelete && !onToggleSelect && (
                <button
                    onClick={handleDeleteClick}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        color: 'var(--color-text-tertiary)',
                        opacity: 0.6,
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.opacity = '1';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-tertiary)';
                        e.currentTarget.style.opacity = '0.6';
                    }}
                    title="Delete project"
                >
                    <Trash2 size={18} />
                </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: onToggleSelect ? '32px' : '0' }}>
                <div>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        color: getStatusColor(status),
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        {status === 'active' && <Clock size={12} />}
                        {status === 'paused' && <AlertCircle size={12} />}
                        {status === 'completed' && <CheckCircle size={12} />}
                        {status.toUpperCase()}
                    </span>
                    <h3 style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '700', paddingRight: '32px' }}>{title}</h3>
                </div>
            </div>

            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontStyle: 'italic', lineHeight: '1.5', paddingLeft: onToggleSelect ? '32px' : '0' }}>
                "{whyICare}"
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Target size={16} color="var(--color-text-tertiary)" style={{ marginTop: '2px' }} />
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Scope</span>
                        <p style={{ margin: 0, fontSize: '13px' }}>{scope}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <CheckCircle size={16} color="var(--color-primary)" style={{ marginTop: '2px' }} />
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Done When</span>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>{doneWhen}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProjectCard;

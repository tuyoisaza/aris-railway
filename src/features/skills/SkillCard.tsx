import React from 'react';
import { motion } from 'framer-motion';
import { Sword, ArrowRight, Trash2, Check } from 'lucide-react';

const SkillCard = ({ skill, onDelete, t, selected = false, onToggleSelect = null }) => {
    const skillData = skill.skill || skill.skills || skill;
    
    return (
        <motion.div
            onClick={(e) => {
                if (onToggleSelect) {
                    onToggleSelect(skill.id);
                } else if (skillData?.id) {
                    window.location.href = `/skills/${skillData.id}`;
                }
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            style={{
                background: 'var(--color-surface)',
                border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                position: 'relative'
            }}
        >
            {/* Selection Checkbox */}
            {onToggleSelect && (
                <div style={{
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
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {selected && <Check size={16} color="white" />}
                </div>
            )}

            <div style={{
                width: '56px', height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                marginLeft: onToggleSelect ? '24px' : '0' // Shift content if select mode
            }}>
                <Sword size={28} />
            </div>

            <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{skillData?.title || 'Unknown Skill'}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <div style={{
                        padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)',
                        color: '#d97706', borderRadius: '6px', fontSize: '12px', fontWeight: '600'
                    }}>
                        {t('skills.level')} {skill.level}
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {skill.xp} {t('skills.xp')}
                    </span>
                </div>
            </div>

            {/* Single Delete Button - Hide in selection mode */}
            {onDelete && !onToggleSelect && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(skill.id);
                    }}
                    style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-tertiary)', padding: '8px',
                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title={t('common.delete')}
                >
                    <Trash2 size={20} />
                </button>
            )}
            {!onToggleSelect && <ArrowRight size={20} color="var(--color-text-tertiary)" />}
        </motion.div >
    );
};

export default SkillCard;

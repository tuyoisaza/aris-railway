import React from 'react';
import { GitBranch, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MilestoneIndicator = ({ type, topic }) => {
    const navigate = useNavigate();

    // Defined styles for the types - Both use Steel/Grey theme now
    const styles = {
        DEPTH: {
            icon: Layers,
            label: 'Deep Dive',
            getText: (t) => `${t}`
        },
        BRANCH: {
            icon: GitBranch,
            label: 'New Topic',
            getText: (t) => `${t}`
        }
    };

    const config = styles[type] || styles.DEPTH;
    const Icon = config.icon;
    const mainText = config.getText(topic || 'Topic');
    const steelColor = '#475569'; // Slate-600
    const steelBg = '#F1F5F9'; // Slate-100
    const steelBorder = '#CBD5E1'; // Slate-300

    return (
        <div
            onClick={() => navigate('/map')}
            style={{
                width: '60%', // Fixed 60% width as requested
                display: 'flex',
                justifyContent: 'center',
                margin: '24px auto', // Center the component
                cursor: 'pointer',
                // opacity: 0, // Removed for debugging/stability
                // animation: 'fadeIn 0.8s ease forwards' 
            }}
        >
            <div style={{
                width: '100%', // Ensure it fills the 60% container
                display: 'flex',
                justifyContent: 'flex-start', // Left align content
                padding: '8px 16px', // Add padding for aesthetics
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'white',
                border: `1px solid ${steelBorder}`,
                borderRadius: '16px', // Rounded Square
                // transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' // Ensure visibility
            }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#94A3B8';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none'; // '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = steelBorder;
                }}
            >
                {/* Icon Box */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px', // Matching rounded square feel
                    background: steelBg,
                    color: steelColor
                }}>
                    <Icon size={16} strokeWidth={2} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: '#94A3B8', // Slate-400
                        fontWeight: '600',
                        marginBottom: '2px'
                    }}>
                        {config.label}
                    </span>
                    <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#334155', // Slate-700
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        {mainText}
                    </span>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div >
    );
};

export default MilestoneIndicator;

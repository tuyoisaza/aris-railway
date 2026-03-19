import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ChatOptionsProps {
    options: string[];
    onSelect: (opt: string) => void;
}

/**
 * ChatOptions Component
 * 
 * Displays expandable options/suggestions for AI responses.
 * Extracted from ConversationPage.tsx to reduce file size.
 */
const ChatOptions: React.FC<ChatOptionsProps> = ({ options, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!options || options.length === 0) return null;

    return (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    opacity: 0.7,
                    padding: '4px 8px',
                    transition: 'all 0.2s'
                }}
            >
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>{isOpen ? 'Close' : 'Options'}</span>
            </button>

            {isOpen && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '8px',
                    width: '100%',
                    maxWidth: '100%',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    {options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => onSelect(opt)}
                            style={{
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'inherit',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '14px',
                                backdropFilter: 'blur(5px)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatOptions;

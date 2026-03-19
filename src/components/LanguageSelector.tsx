import React, { useState, useRef, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
    { code: 'en-US', label: 'English' },
    { code: 'es-ES', label: 'Español' },
    { code: 'pt-BR', label: 'Português' }
];

const LanguageSelector = () => {
    const { language, setLanguage } = useGlobal();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectedLabel = languages.find(l => l.code === language)?.label || 'Language';

    return (
        <div
            ref={dropdownRef}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    gap: '6px',
                    transition: 'background 0.2s',
                }}
                className="lang-trigger"
            >
                <Globe size={18} color="var(--color-text-secondary)" />
                <span>{selectedLabel}</span>
                <ChevronDown size={14} color="var(--color-text-tertiary)" />
            </button>
            <style>{`
                .lang-trigger:hover {
                    background: var(--color-bg-secondary);
                }
            `}</style>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            padding: '6px',
                            minWidth: '150px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                        }}
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    background: language === lang.code ? 'var(--color-primary-light)' : 'transparent',
                                    color: language === lang.code ? 'var(--color-primary)' : 'var(--color-text)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: language === lang.code ? '600' : '400',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (language !== lang.code) {
                                        e.currentTarget.style.background = 'var(--color-bg)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (language !== lang.code) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                {lang.label}
                                {language === lang.code && <Check size={14} />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LanguageSelector;

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
    content: string;
}

// Code block component with copy functionality
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeContent = String(children).replace(/\n$/, '');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(codeContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    if (inline) {
        return (
            <code 
                style={{
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    padding: '0.2em 0.4em',
                    borderRadius: '3px',
                    fontSize: '0.9em',
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    color: 'var(--color-text-secondary)'
                }} 
                {...props}
            >
                {children}
            </code>
        );
    }

    return (
        <div style={{ 
            position: 'relative', 
            margin: '1em 0',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            background: 'var(--color-code-bg, #f8f9fa)'
        }}>
            {/* Header with language and copy button */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5em 1em',
                background: 'var(--color-code-header, #e9ecef)',
                borderBottom: '1px solid var(--color-border)',
                fontSize: '0.85em',
                color: 'var(--color-text-secondary)'
            }}>
                {language && (
                    <span style={{
                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                    }}>
                        {language}
                    </span>
                )}
                <button
                    onClick={handleCopy}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25em 0.5em',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25em',
                        fontSize: '0.85em',
                        color: 'var(--color-text-secondary)',
                        transition: 'all 0.2s ease'
                    }}
                    title={copied ? "Copied!" : "Copy code"}
                >
                    {copied ? (
                        <>
                            <Check size={14} />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={14} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            
            {/* Code content */}
            <pre 
                style={{
                    margin: '0',
                    padding: '1em',
                    overflow: 'auto',
                    fontSize: '0.9em',
                    lineHeight: '1.5',
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    background: 'transparent',
                    color: 'var(--color-text)'
                }}
                {...props}
            >
                <code className={className}>{children}</code>
            </pre>
        </div>
    );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code: CodeBlock,
                    table: ({ node, ...props }) => (
                        <div style={{ overflowX: 'auto', margin: '1em 0' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9em', tableLayout: 'auto' }} {...props} />
                        </div>
                    ),
                    th: ({ node, ...props }) => (
                        <th style={{
                            border: '1px solid var(--color-border)',
                            padding: '6px 8px',
                            background: 'rgba(0,0,0,0.05)',
                            fontWeight: 600,
                            textAlign: 'left',
                            whiteSpace: 'normal',
                            wordBreak: 'normal',   // Break words only if necessary to prevent overflow, but prefer normal lines
                            overflowWrap: 'anywhere', // Force wrapping if needed
                            maxWidth: '200px' // Prevent single columns from hogging all space
                        }} {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td style={{
                            border: '1px solid var(--color-border)',
                            padding: '6px 8px',
                            whiteSpace: 'normal',
                            wordBreak: 'normal',
                            overflowWrap: 'anywhere',
                            maxWidth: '300px'
                        }} {...props} />
                    ),
                    p: ({ node, ...props }) => <p style={{ margin: '0 0 1em 0', whiteSpace: 'pre-wrap' }} {...props} />,
                    ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5em', margin: '0.5em 0' }} {...props} />,
                    ol: ({ node, ...props }) => <ol style={{ paddingLeft: '1.5em', margin: '0.5em 0' }} {...props} />,
                    li: ({ node, ...props }) => <li style={{ marginBottom: '0.25em' }} {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;

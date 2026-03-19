import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ActionRegistry from '../../services/ActionRegistry';
import { api } from '../../services/api';

// Register actions (ensure this runs at least once, or import a specialized init file)
// For now, we'll register defaults here effectively for demo, but better to do it in an App init.
// We will assume actions are registered in ActionRegistry.ts or a separate config file.
// But for now, let's define them in a useEffect to be safe if not initialized elsewhere.

interface ActionDef {
    slug: string;
    name: string;
    description?: string;
}

const GuidedActionsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Available Actions (loaded from API)
    const [availableActions, setAvailableActions] = useState<ActionDef[]>([
        { slug: 'conversation', name: 'Conversation' },
        { slug: 'skill', name: 'Skill' },
        { slug: 'project', name: 'Project' },
        { slug: 'topic', name: 'Topic' }
    ]);

    // Form State
    const [action, setAction] = useState(searchParams.get('action') || 'conversation');
    const [payload, setPayload] = useState(searchParams.get('payload') || '');
    const [intent, setIntent] = useState(searchParams.get('intent') || '');

    // Execution State
    const [status, setStatus] = useState<'idle' | 'executing' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Load available actions from API
    useEffect(() => {
        const loadActions = async () => {
            try {
                const actions = await api.agora.getActions();
                if (actions && actions.length > 0) {
                    setAvailableActions(actions);
                }
            } catch (err) {
                console.error('[GuidedActions] Failed to load actions from API, using defaults:', err);
            }
        };
        loadActions();
    }, []);

    useEffect(() => {
        const runAction = async () => {
            const urlAction = searchParams.get('action');
            const urlPayload = searchParams.get('payload');
            const urlIntent = searchParams.get('intent');

            if (urlAction && urlPayload && urlIntent) {
                setStatus('executing');
                try {
                    await ActionRegistry.execute(urlAction, urlPayload, urlIntent, navigate);
                    // If successful, navigation happens, so this component might unmount.
                } catch (err: any) {
                    console.error('Guided Action Failed:', err);
                    setStatus('error');
                    setErrorMessage(err.message || 'Unknown error occurred.');
                }
            }
        };

        runAction();
    }, [searchParams, navigate]);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('executing');
        setErrorMessage('');

        try {
            // Encode payload if manual entry is raw JSON? 
            // Brief says: Form has "Campo texto: payload (Base64 URL-safe)"
            // So user inputs Base64 directly.
            await ActionRegistry.execute(action, payload, intent, navigate);
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message);
        }
    };

    if (status === 'executing') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Processing Action...</h2>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="guided-actions-container" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <h1>Guided Actions Debugger</h1>

            {status === 'error' && (
                <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                    <strong>Error:</strong> {errorMessage}
                    <br />
                    <button onClick={() => setStatus('idle')} style={{ marginTop: '0.5rem' }}>Retry / Reset</button>
                </div>
            )}

            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Action</label>
                    <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem' }}
                    >
                        {availableActions.map((a) => (
                            <option key={a.slug} value={a.slug}>{a.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="payload" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Payload (Base64 URL-safe)</label>
                    <textarea
                        id="payload"
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                        rows={4}
                        style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                    />
                    <small style={{ display: 'block', color: '#666', marginBottom: '16px' }}>
                        Can be raw text context (will be base64 decoded if matches) or a JSON object.
                    </small>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setPayload(`Smallville es una serie de televisión estadounidense desarrollada originalmente por los escritores y productores Alfred Gough y Miles Millar, que se estrenó el 16 de octubre de 2001 y terminó el 13 de mayo de 2011. Inicialmente fue emitida por The WB. Durante su quinta temporada, The WB y UPN se fusionaron para formar The CW, donde se transmitió hasta su finalización. Sinopsis: La serie narra las aventuras del joven Clark Kent en el pueblo ficticio de Smallville, Kansas, durante los años previos a que él se convierta en Superman.`);
                                setIntent("explicame supermal desde smallvile");
                            }}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Load "Smallville" Test
                        </button>

                        <button
                            type="submit" // Changed to type="submit" to trigger form submission
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                flex: 1
                            }}
                        >
                            Send Action
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Intent</label>
                    <input
                        type="text"
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        placeholder="Why are you here?"
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                </div>

                {/* VISUAL DEBUG SECTION */}
                <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '1rem' }}>
                        <input
                            type="checkbox"
                            style={{ marginRight: '0.5rem' }}
                            onChange={(e) => {
                                const debugContainer = document.getElementById('debug-payload-view');
                                if (debugContainer) debugContainer.style.display = e.target.checked ? 'block' : 'none';
                            }}
                        />
                        Show Debug Logs & Payload
                    </label>

                    <div id="debug-payload-view" style={{ display: 'none', background: '#f5f5f5', padding: '1rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                        <h4>Debug Payload</h4>
                        <div style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            <strong>Raw Length:</strong> {payload.length} chars<br />
                            <strong>Content:</strong><br />
                            {payload || '(Empty)'}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default GuidedActionsPage;

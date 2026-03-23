import React from 'react';
import { useTranslation } from 'react-i18next';
import ArisCircle from '../../presence/ArisCircle';

interface InitialStateProps {
    circleState: 'idle' | 'listening' | 'thinking' | 'speaking';
    liveTranscript: string;
    onCircleClick: () => void;
}

const InitialState: React.FC<InitialStateProps> = ({
    circleState,
    liveTranscript,
    onCircleClick
}) => {
    const { t } = useTranslation();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '40px'
        }}>
            <h1 style={{
                fontWeight: 300,
                color: 'var(--color-text-secondary)',
                zIndex: 10,
                whiteSpace: 'pre-line',
                textAlign: 'center'
            }}>
                {t('greeting')}
            </h1>

            <div
                style={{
                    width: '300px',
                    height: '300px',
                    cursor: 'pointer',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                onClick={onCircleClick}
            >
                <ArisCircle state={circleState} size={300} />

                {circleState === 'listening' && liveTranscript && (
                    <div style={{
                        position: 'absolute',
                        bottom: '-80px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'var(--color-primary)',
                        fontWeight: '600',
                        fontSize: '14px',
                        animation: 'fadeIn 0.3s ease-out',
                        maxWidth: '600px',
                        width: 'max-content',
                        textAlign: 'center',
                        zIndex: 30
                    }}>
                        {liveTranscript}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitialState;

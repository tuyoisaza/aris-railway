import React from 'react';
import { X, ArrowRight, MessageSquare, FolderKanban, BookOpen, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';

interface GuidedActionCardProps {
  action: {
    type: 'topic' | 'project' | 'skill' | 'conversation';
    payload: {
      title?: string;
      name?: string;
      description?: string;
      category?: string;
    };
    intent: string;
  };
  onDismiss: () => void;
  onExecute: (result: any) => void;
}

const actionConfig = {
  topic: {
    icon: BookOpen,
    color: 'var(--color-primary)',
    label: 'New Topic',
    getTitle: (payload: any) => payload.title || 'Explore a new topic',
  },
  project: {
    icon: FolderKanban,
    color: 'var(--color-success)',
    label: 'New Project',
    getTitle: (payload: any) => payload.title || 'Start a new project',
  },
  skill: {
    icon: Lightbulb,
    color: 'var(--color-warning)',
    label: 'New Skill',
    getTitle: (payload: any) => payload.name || payload.title || 'Track a new skill',
  },
  conversation: {
    icon: MessageSquare,
    color: 'var(--color-info)',
    label: 'New Conversation',
    getTitle: (payload: any) => payload.title || 'Start a new conversation',
  },
};

export const GuidedActionCard: React.FC<GuidedActionCardProps> = ({
  action,
  onDismiss,
  onExecute,
}) => {
  const [isExecuting, setIsExecuting] = React.useState(false);
  const config = actionConfig[action.type];
  const Icon = config.icon;
  const title = config.getTitle(action.payload);

  const handleAccept = async () => {
    setIsExecuting(true);
    try {
      const result = await api.agora.executeAction(action.type, action.payload, action.intent);
      onExecute(result);
    } catch (error) {
      console.error('Failed to execute guided action:', error);
      onDismiss();
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          bottom: '120px',
          right: '24px',
          width: '360px',
          background: 'var(--color-surface)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
          border: '1px solid var(--color-border)',
          zIndex: 1000,
        }}
      >
        <button
          onClick={onDismiss}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--color-text-secondary)',
            borderRadius: '4px',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: `${config.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={22} color={config.color} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: config.color,
                marginBottom: '4px',
                fontWeight: 600,
              }}
            >
              {config.label}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-text)',
                marginBottom: '6px',
                lineHeight: 1.3,
              }}
            >
              {title}
            </div>
            {action.payload.description && (
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.4,
                }}
              >
                {action.payload.description}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: '16px',
            padding: '10px 12px',
            background: 'var(--color-background)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            fontStyle: 'italic',
          }}
        >
          "{action.intent}"
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button
            onClick={onDismiss}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Not now
          </button>
          <button
            onClick={handleAccept}
            disabled={isExecuting}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: config.color,
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isExecuting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: isExecuting ? 0.7 : 1,
            }}
          >
            {isExecuting ? (
              'Creating...'
            ) : (
              <>
                Let's go <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuidedActionCard;

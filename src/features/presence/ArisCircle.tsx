import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/**
 * ArisCircle Component
 * The visual representation of the AI presence.
 * States: 'idle', 'listening', 'speaking', 'thinking'
 */
interface ArisCircleProps {
  state: 'idle' | 'listening' | 'speaking' | 'thinking';
  size: number;
  name?: string; // Optional custom name like "THE ORB"
}

const ArisCircle = ({ state = 'idle', size: _size, name }: ArisCircleProps) => {
  const { t } = useTranslation();

  // Animation variants for different states
  const centerVariants: any = {
    idle: {
      scale: [1, 1.05, 1],
      opacity: 0.9,
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    speaking: {
      scale: [1, 1.15, 0.95, 1.1, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    thinking: {
      rotate: 360,
      scale: 0.9,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  // Ripple effect for listening state
  const rippleVariants: any = {
    listening: {
      scale: [1, 2.5],
      opacity: [0.6, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '300px', // Container size for ripples
      height: '300px'
    }}>
      {/* Ripple Effects (Only visible when listening) */}
      {state === 'listening' && (
        <>
          <motion.div
            variants={rippleVariants}
            animate="listening"
            style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              zIndex: 0
            }}
          />
          <motion.div
            variants={rippleVariants}
            animate="listening"
            style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              zIndex: 0
            }}
            transition={{ delay: 1, duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        </>
      )}

        {/* Core Circle */}
      <motion.div
        animate={state === 'listening' ? { scale: 1 } : state}
        variants={centerVariants}
        style={{
          width: '120px', // Larger core size
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #FF8533, #FF6B00)', // Gradient for depth
          boxShadow: '0 10px 30px rgba(255, 107, 0, 0.3)', // Glow
          zIndex: 10,
          cursor: 'pointer'
        }}
        title={name || "ARIS Assistant"}
        aria-label={name || "ARIS AI Assistant"}
      />

      {/* Visual Text Indicator */}
      {state === 'listening' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            bottom: '40px',
            color: 'var(--color-primary)',
            fontWeight: '600',
            fontSize: '14px',
            zIndex: 20,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '6px 14px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none'
          }}
        >
          {t('voice.listening')}
        </motion.div>
      )}
      {/* Display custom name if provided */}
      {name && (
        <div style={{
          position: 'absolute',
          bottom: '160px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'var(--color-primary)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          zIndex: 30
        }}>
          {name}
        </div>
      )}
    </div>
  );
};

export default ArisCircle;


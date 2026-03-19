import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface MenuItem {
  label: string;
  path: string;
}

interface MenuOverlayProps {
  isOpen: boolean;
  menuItems: MenuItem[];
  currentPath: string;
  onClose: () => void;
}

const MenuOverlay = ({ isOpen, menuItems, currentPath, onClose }: MenuOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'var(--color-bg-secondary)',
            backdropFilter: 'blur(10px)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={{
                fontSize: '24px',
                fontWeight: currentPath === item.path ? '600' : '400',
                color: currentPath === item.path ? 'var(--color-primary)' : 'var(--color-text)',
              }}
            >
              {item.label}
            </Link>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MenuOverlay;

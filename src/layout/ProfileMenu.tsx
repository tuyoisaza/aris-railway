import React, { useState } from 'react';
import { LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileMenuProps {
  user: any;
  logout: () => void;
  t: (key: string) => string;
}

const ProfileMenu = ({ user, logout, t }: ProfileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={toggleMenu}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          border: '2px solid white',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>{user?.name?.[0] || 'U'}</span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '0',
            background: 'var(--color-surface)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border)',
            padding: '8px',
            width: '200px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border-light)', marginBottom: '4px' }}>
            <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{user?.name}</div>
            <div
              style={{ fontSize: '12px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {user?.email}
            </div>
          </div>

          {user?.email?.toLowerCase() === 'thetboard@gmail.com' && (
            <button
              onClick={() => {
                navigate('/admin');
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--color-text)',
                fontSize: '14px',
                textAlign: 'left',
                width: '100%',
              }}
              className="hover:bg-gray-50 dark:hover:bg-gray-800"
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Shield size={16} />
              {t('menu.admin') || 'Admin Dashboard'}
            </button>
          )}

          <button
            onClick={() => {
              logout();
              setIsOpen(false);
              navigate('/');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#ef4444',
              fontSize: '14px',
              textAlign: 'left',
              width: '100%',
            }}
            className="hover:bg-red-50"
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={16} />
            {t('menu.logout')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;

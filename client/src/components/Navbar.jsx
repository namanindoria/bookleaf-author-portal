import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DemoUserSwitcher } from './Common/DemoUserSwitcher';
import { api } from '../services/api';
import { BookOpen, RotateCcw, LogOut, Check } from 'lucide-react';

export function Navbar({ sseConnected }) {
  const { user, logout } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleResetData = async () => {
    if (!window.confirm('Reset database back to the standard sample dataset?')) {
      return;
    }
    setResetting(true);
    try {
      await api.seedDatabase();
      window.location.reload();
    } catch (err) {
      alert('Reset failed: ' + err.message);
      setResetting(false);
    }
  };

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand & Workspace Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#0f766e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <BookOpen size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>BookLeaf</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>Publishing</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '-2px' }}>
                Author Support Portal
              </p>
            </div>
          </div>

          {user && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
              background: user.role === 'admin' ? '#fef3c7' : '#f0fdfa',
              color: user.role === 'admin' ? '#92400e' : '#0f766e',
              border: user.role === 'admin' ? '1px solid #fde68a' : '1px solid #ccfbf1'
            }}>
              {user.role === 'admin' ? 'Operations Admin' : 'Author Workspace'}
            </span>
          )}
        </div>

        {/* Right side items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Live Sync Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: sseConnected ? '#059669' : '#64748b',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '0.3rem 0.65rem',
            borderRadius: '9999px'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: sseConnected ? '#10b981' : '#94a3b8',
              display: 'inline-block'
            }} />
            <span>{sseConnected ? 'Live' : 'Connecting'}</span>
          </div>

          {/* Quick Demo Switcher */}
          <DemoUserSwitcher />

          {/* Reset Data Button */}
          <button
            onClick={handleResetData}
            disabled={resetting}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', color: '#64748b' }}
            title="Reset database to sample dataset"
          >
            <RotateCcw size={13} className={resetting ? 'animate-spin' : ''} />
            <span>{resetting ? 'Resetting...' : 'Reset Data'}</span>
          </button>

          {/* User Profile & Logout */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingLeft: '0.75rem',
              borderLeft: '1px solid #e2e8f0'
            }}>
              <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a' }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{user.email}</div>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.4rem 0.55rem' }}
                title="Log Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

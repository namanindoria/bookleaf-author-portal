import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DemoUserSwitcher } from './Common/DemoUserSwitcher';
import { api } from '../services/api';
import { BookMarked, Shield, RotateCcw, LogOut, Radio, User } from 'lucide-react';

export function Navbar({ sseConnected }) {
  const { user, author, logout } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleResetData = async () => {
    if (!window.confirm('Reset database back to initial sample dataset with 10 authors and 18 books?')) {
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
      background: 'rgba(11, 17, 32, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.85rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
            color: 'inherit'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
            }}>
              <BookMarked size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>BookLeaf</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Publishing</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '-2px' }}>
                Author Support & Communication Portal
              </p>
            </div>
          </div>

          {/* Role Pill */}
          {user && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: user.role === 'admin' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: user.role === 'admin' ? '#fbbf24' : '#34d399',
              border: user.role === 'admin' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
              {user.role === 'admin' ? 'Operations Admin' : 'Author Portal'}
            </span>
          )}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Live Sync Status */}
          <div
            title="Real-Time Server-Sent Events sync is active"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: sseConnected ? 'var(--primary-400)' : 'var(--text-dim)',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '0.35rem 0.7rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div className={sseConnected ? 'pulse-dot' : ''} style={!sseConnected ? { width: 8, height: 8, borderRadius: '50%', background: '#64748b' } : {}} />
            <span>{sseConnected ? 'Real-Time Sync' : 'Connecting...'}</span>
          </div>

          {/* Demo User Switcher */}
          <DemoUserSwitcher />

          {/* Reset Seed Data */}
          <button
            onClick={handleResetData}
            disabled={resetting}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--text-dim)' }}
            title="Reset database to initial sample data"
          >
            <RotateCcw size={14} className={resetting ? 'animate-spin' : ''} />
            <span>{resetting ? 'Resetting...' : 'Reset Data'}</span>
          </button>

          {/* User Profile & Logout */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.85rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {user.name}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {user.email}
                </p>
              </div>
              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.45rem' }}
                title="Log Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Shield, BookOpen, ChevronDown } from 'lucide-react';

const DEMO_PRESETS = [
  {
    role: 'admin',
    name: 'Admin Operations Desk',
    email: 'admin@bookleaf.in',
    desc: 'Full ops access, AI workbench & ticket queue'
  },
  {
    role: 'admin',
    name: 'Neha Sharma (Sr. Support Lead)',
    email: 'neha.support@bookleaf.in',
    desc: 'Ops agent handle escalations'
  },
  {
    role: 'author',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    desc: '2 books (Whispers of the Ganges) • Pending Royalty'
  },
  {
    role: 'author',
    name: 'Rohit Kapoor',
    email: 'rohit.kapoor@email.com',
    desc: '2 books (Code & Karma) • High Sales'
  },
  {
    role: 'author',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@email.com',
    desc: '3 books • Includes book in Production'
  },
  {
    role: 'author',
    name: 'Kavita Deshmukh',
    email: 'kavita.deshmukh@email.com',
    desc: '2 books • In Production (Typesetting)'
  }
];

export function DemoUserSwitcher() {
  const { user, switchUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSelect = async (account) => {
    setSwitching(true);
    try {
      const password = account.role === 'admin' ? 'admin123' : 'author123';
      await switchUser(account.email, password);
      setIsOpen(false);
    } catch (err) {
      alert('Failed to switch user: ' + err.message);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        style={{
          border: '1px solid rgba(16, 185, 129, 0.4)',
          background: 'rgba(16, 185, 129, 0.08)',
          color: 'var(--primary-400)',
          fontWeight: 600
        }}
        title="Quick 1-Click Role & Author Switcher for Evaluation"
      >
        <Users size={14} />
        <span>Switch Account</span>
        <ChevronDown size={13} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '320px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            overflow: 'hidden',
            padding: '0.5rem'
          }}
        >
          <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.35rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
              Quick Evaluation Switcher
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Test both roles and edge cases instantly without entering passwords.
            </p>
          </div>

          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {DEMO_PRESETS.map((item) => {
              const isCurrent = user?.email?.toLowerCase() === item.email.toLowerCase();
              return (
                <button
                  key={item.email}
                  disabled={switching}
                  onClick={() => handleSelect(item)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isCurrent ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: isCurrent ? 'var(--primary-300)' : 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {item.role === 'admin' ? <Shield size={13} color="#f59e0b" /> : <BookOpen size={13} color="#10b981" />}
                      {item.name}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: item.role === 'admin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: item.role === 'admin' ? '#f59e0b' : '#34d399'
                    }}>
                      {item.role}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

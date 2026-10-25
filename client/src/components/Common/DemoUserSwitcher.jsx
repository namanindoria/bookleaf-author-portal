import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Shield, BookOpen, ChevronDown } from 'lucide-react';

const DEMO_PRESETS = [
  {
    role: 'admin',
    name: 'Admin Operations Desk',
    email: 'admin@bookleaf.in',
    desc: 'Support queue, AI response studio, internal notes'
  },
  {
    role: 'admin',
    name: 'Neha Sharma (Support Lead)',
    email: 'neha.support@bookleaf.in',
    desc: 'Escalations and priority approvals'
  },
  {
    role: 'author',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    desc: '2 books • ₹3,570 pending royalty'
  },
  {
    role: 'author',
    name: 'Rohit Kapoor',
    email: 'rohit.kapoor@email.com',
    desc: '2 books • High sales volume (1,203 sold)'
  },
  {
    role: 'author',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@email.com',
    desc: '3 books • Includes "Midnight in Mysore" (In Production)'
  },
  {
    role: 'author',
    name: 'Kavita Deshmukh',
    email: 'kavita.deshmukh@email.com',
    desc: '2 books • Includes "Raising Roots" (In Typesetting)'
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
        style={{ fontSize: '0.785rem', fontWeight: 500 }}
      >
        <Users size={13} color="#0f766e" />
        <span>Switch Account</span>
        <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            width: '320px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
              Quick Account Switcher
            </p>
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
              Test both roles and edge cases instantly
            </p>
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '0.35rem' }}>
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
                    borderRadius: '6px',
                    border: 'none',
                    background: isCurrent ? '#f0fdfa' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'background 0.1s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.825rem', color: isCurrent ? '#0f766e' : '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {item.role === 'admin' ? <Shield size={13} color="#d97706" /> : <BookOpen size={13} color="#0f766e" />}
                      {item.name}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: item.role === 'admin' ? '#fef3c7' : '#e0f2fe',
                      color: item.role === 'admin' ? '#92400e' : '#0369a1'
                    }}>
                      {item.role}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
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

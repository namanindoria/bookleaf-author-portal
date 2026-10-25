import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookMarked, Shield, User, ArrowRight } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email.trim(), password.trim());
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
            marginBottom: '1rem'
          }}>
            <BookMarked size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>BookLeaf Publishing</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Author Support & Operations Communication Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. priya.sharma@email.com or admin@bookleaf.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password (author123 or admin123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Evaluation Accounts */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
            One-Click Demo Credentials:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@bookleaf.in', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={13} color="#f59e0b" /> Admin Desk (admin@bookleaf.in)
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>admin123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('priya.sharma@email.com', 'author123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={13} color="#10b981" /> Author: Priya Sharma
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>author123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('rohit.kapoor@email.com', 'author123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '0.775rem', padding: '0.45rem 0.75rem' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={13} color="#10b981" /> Author: Rohit Kapoor
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>author123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

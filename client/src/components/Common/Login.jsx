import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, ArrowRight, Shield, User } from 'lucide-react';

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
      setError(err.message || 'Login failed. Please verify your credentials.');
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
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="clean-card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            backgroundColor: '#0f766e',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            marginBottom: '0.75rem'
          }}>
            <BookOpen size={22} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>BookLeaf Publishing</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
            Author Support & Operations Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '0.65rem 0.85rem',
            borderRadius: '6px',
            marginBottom: '1.25rem',
            fontSize: '0.825rem'
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
              placeholder="author123 or admin123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.65rem', marginTop: '0.5rem' }}
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Demo Accounts */}
        <div style={{ marginTop: '1.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.65rem' }}>
            Quick Demo Accounts:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@bookleaf.in', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '0.785rem' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={13} color="#d97706" /> Admin: admin@bookleaf.in
              </span>
              <span style={{ color: '#94a3b8' }}>admin123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('priya.sharma@email.com', 'author123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '0.785rem' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={13} color="#0f766e" /> Author: Priya Sharma
              </span>
              <span style={{ color: '#94a3b8' }}>author123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('rohit.kapoor@email.com', 'author123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '0.785rem' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={13} color="#0f766e" /> Author: Rohit Kapoor
              </span>
              <span style={{ color: '#94a3b8' }}>author123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

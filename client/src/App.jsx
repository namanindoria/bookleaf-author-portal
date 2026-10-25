import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthorDashboard } from './components/AuthorPortal/AuthorDashboard';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { Login } from './components/Common/Login';
import { api } from './services/api';
import { Bell, Sparkles } from 'lucide-react';

export function AppContent() {
  const { user, loading } = useAuth();
  const [sseConnected, setSseConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Set up live real-time SSE listener
  useEffect(() => {
    if (!user) {
      setSseConnected(false);
      return;
    }

    const eventSource = api.subscribeSSE(
      (event, data) => {
        setSseConnected(true);

        // Show toast alert
        if (event === 'TICKET_CREATED') {
          showToast(`⚡ New ticket raised: ${data.id} (${data.category})`);
        } else if (event === 'NEW_MESSAGE') {
          showToast(`💬 New response received on ticket ${data.ticketId}`);
        } else if (event === 'TICKET_UPDATED') {
          showToast(`🔄 Ticket ${data.id} updated to ${data.status}`);
        } else if (event === 'INTERNAL_NOTE_ADDED') {
          showToast(`🔒 New internal note added to ticket ${data.ticketId}`);
        }
      },
      (err) => {
        setSseConnected(false);
      }
    );

    // Initial check
    setSseConnected(true);

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.95rem'
      }}>
        Initializing BookLeaf Publishing Portal...
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar sseConnected={sseConnected} />

      {/* Floating Real-Time Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--primary-500)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          zIndex: 9999,
          fontSize: '0.85rem',
          animation: 'slide-in 0.3s ease'
        }}>
          <Bell size={16} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="main-content">
        {!user ? (
          <Login />
        ) : user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <AuthorDashboard />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
        background: 'rgba(11, 17, 32, 0.95)'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            © {new Date().getFullYear()} BookLeaf Publishing. All rights reserved. Self-Publishing in India & US.
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <span>Knowledge Base Integrated</span>
            <span>•</span>
            <span>REST API + SSE Real-Time</span>
            <span>•</span>
            <a href="http://localhost:5000/api/docs" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-400)', textDecoration: 'none' }}>
              Swagger OpenAPI Docs ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}

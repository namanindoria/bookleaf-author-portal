import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthorDashboard } from './components/AuthorPortal/AuthorDashboard';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { Login } from './components/Common/Login';
import { api } from './services/api';
import { Bell } from 'lucide-react';

export function AppContent() {
  const { user, loading } = useAuth();
  const [sseConnected, setSseConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      setSseConnected(false);
      return;
    }

    const eventSource = api.subscribeSSE(
      (event, data) => {
        setSseConnected(true);

        if (event === 'TICKET_CREATED') {
          showToast(`New ticket raised: ${data.id} (${data.category})`);
        } else if (event === 'NEW_MESSAGE') {
          showToast(`New reply received on ticket ${data.ticketId}`);
        } else if (event === 'TICKET_UPDATED') {
          showToast(`Ticket ${data.id} updated to ${data.status}`);
        } else if (event === 'INTERNAL_NOTE_ADDED') {
          showToast(`Internal note logged for ticket ${data.ticketId}`);
        }
      },
      (err) => {
        setSseConnected(false);
      }
    );

    setSseConnected(true);

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '0.9rem'
      }}>
        Loading BookLeaf Publishing Portal...
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar sseConnected={sseConnected} />

      {/* Floating Clean Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          color: '#0f172a',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 9999,
          fontSize: '0.825rem',
          fontWeight: 500
        }}>
          <Bell size={15} color="#0f766e" />
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

      {/* Clean Human Footer */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
        fontSize: '0.75rem',
        color: '#64748b',
        background: '#ffffff'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            © {new Date().getFullYear()} BookLeaf Publishing. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span>Real-time SSE Active</span>
            <span>•</span>
            <a href="http://localhost:5000/api/docs" target="_blank" rel="noreferrer" style={{ color: '#0f766e', textDecoration: 'none', fontWeight: 500 }}>
              Swagger OpenAPI Specs ↗
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

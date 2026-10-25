import React, { useState } from 'react';
import { TicketQueue } from './TicketQueue';
import { TicketDetailWorkbench } from './TicketDetailWorkbench';
import { ShieldAlert, Sparkles, SlidersHorizontal } from 'lucide-react';

export function AdminDashboard() {
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const handleSelectTicket = (id) => {
    setSelectedTicketId(id);
  };

  const handleCloseWorkbench = () => {
    setSelectedTicketId(null);
  };

  return (
    <div>
      {/* Admin Ops Banner */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.75rem 2rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.5) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            BookLeaf Operations Hub
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem' }}>
            Support & Author Communications Desk
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            AI-assisted classification, priority routing, automated policy drafts, and real-time author communication.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '0.65rem 1.1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <Sparkles size={16} color="var(--primary-400)" />
          <span>Knowledge Base RAG & Auto-Drafts Active</span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* If ticket is selected, display Workbench above or alongside */}
        {selectedTicketId && (
          <div style={{ marginBottom: '1rem' }}>
            <TicketDetailWorkbench
              ticketId={selectedTicketId}
              onClose={handleCloseWorkbench}
            />
          </div>
        )}

        {/* Global Ticket Queue */}
        <TicketQueue
          onSelectTicket={handleSelectTicket}
          selectedTicketId={selectedTicketId}
        />
      </div>
    </div>
  );
}

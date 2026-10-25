import React, { useState, useEffect } from 'react';
import { TicketQueue } from './TicketQueue';
import { TicketDetailWorkbench } from './TicketDetailWorkbench';
import { OpsAnalytics } from './OpsAnalytics';
import { api } from '../../services/api';
import { BarChart3 } from 'lucide-react';

export function AdminDashboard() {
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [allTickets, setAllTickets] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const loadAllTickets = async () => {
    try {
      const data = await api.getTickets();
      setAllTickets(data);
    } catch (err) {
      console.error('Failed to load tickets for analytics:', err);
    }
  };

  useEffect(() => {
    loadAllTickets();

    const eventSource = api.subscribeSSE((event, data) => {
      loadAllTickets();
    });

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleSelectTicket = (id) => {
    setSelectedTicketId(id);
  };

  const handleCloseWorkbench = () => {
    setSelectedTicketId(null);
  };

  return (
    <div>
      {/* Simple Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            Operations & Support Desk
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
            Author ticket triage, priority scoring, and AI-assisted policy response generation
          </p>
        </div>

        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className={`btn btn-sm ${showAnalytics ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BarChart3 size={14} />
          <span>{showAnalytics ? 'Hide Analytics' : 'Analytics & SLA'}</span>
        </button>
      </div>

      {/* Analytics (Toggled) */}
      {showAnalytics && (
        <OpsAnalytics tickets={allTickets} />
      )}

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {selectedTicketId && (
          <TicketDetailWorkbench
            ticketId={selectedTicketId}
            onClose={handleCloseWorkbench}
          />
        )}

        <TicketQueue
          onSelectTicket={handleSelectTicket}
          selectedTicketId={selectedTicketId}
        />
      </div>
    </div>
  );
}

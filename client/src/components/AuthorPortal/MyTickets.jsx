import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../Common/Badge';
import { MessageSquare, Clock, ArrowRight, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export function MyTickets({ authorId, onSwitchToSubmit }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Load author tickets
  const loadTickets = async () => {
    try {
      const data = await api.getTickets();
      setTickets(data);
      // If a ticket is currently open, refresh its conversation thread too
      if (selectedTicket) {
        const fresh = await api.getTicket(selectedTicket.id);
        setSelectedTicket(fresh);
      }
    } catch (err) {
      console.error('Failed to load author tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();

    // Subscribe to SSE for live updates without page refresh
    const eventSource = api.subscribeSSE((event, data) => {
      if (event === 'TICKET_CREATED' || event === 'TICKET_UPDATED' || event === 'NEW_MESSAGE') {
        loadTickets();
      }
    });

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [authorId, selectedTicket?.id]);

  const handleOpenTicket = async (ticketSummary) => {
    try {
      const fullTicket = await api.getTicket(ticketSummary.id);
      setSelectedTicket(fullTicket);
    } catch (err) {
      alert('Failed to load ticket details: ' + err.message);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      await api.addMessage(selectedTicket.id, {
        message: replyText.trim()
      });
      setReplyText('');
      const updated = await api.getTicket(selectedTicket.id);
      setSelectedTicket(updated);
      loadTickets();
    } catch (err) {
      alert('Failed to send reply: ' + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-dim)' }}>
        Loading support tickets...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>My Support Tickets</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time updates on your inquiries, royalty checks, and communication with the BookLeaf team.
          </p>
        </div>
        <button onClick={onSwitchToSubmit} className="btn btn-primary btn-sm">
          Raise New Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <MessageSquare size={40} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem' }}>No Support Tickets Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Have a question about your royalties, ISBN, or distribution? Our operations team is ready to assist.
          </p>
          <button onClick={onSwitchToSubmit} className="btn btn-primary btn-sm">
            Raise a Support Query
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1.2fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Ticket List */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.4)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                All Submitted Tickets ({tickets.length})
              </span>
            </div>

            <div style={{ divideY: '1px solid var(--border-subtle)' }}>
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTicket(t)}
                    style={{
                      padding: '1.1rem 1.25rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--primary-500)' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-400)' }}>
                        {t.id}
                      </span>
                      <StatusBadge status={t.status} />
                    </div>

                    <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                      {t.subject}
                    </h4>

                    {t.book_title && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Book: <em>{t.book_title}</em>
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      <CategoryBadge category={t.category} />
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conversation Detail View */}
          {selectedTicket && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '680px', overflow: 'hidden' }}>
              {/* Detail Header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                      {selectedTicket.id}
                    </span>
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                  <CategoryBadge category={selectedTicket.category} />
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                  {selectedTicket.subject}
                </h3>

                {selectedTicket.book_title && (
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Related Title: <strong>{selectedTicket.book_title}</strong> {selectedTicket.book_isbn ? `(ISBN: ${selectedTicket.book_isbn})` : ''}
                  </p>
                )}
              </div>

              {/* Message Thread */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedTicket.messages && selectedTicket.messages.map((msg) => {
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                        maxWidth: '85%',
                        background: isAdmin ? 'rgba(30, 41, 59, 0.85)' : 'linear-gradient(135deg, rgba(5, 150, 105, 0.25) 0%, rgba(16, 185, 129, 0.2) 100%)',
                        border: isAdmin ? '1px solid var(--border-subtle)' : '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.775rem', fontWeight: 700, color: isAdmin ? '#fbbf24' : 'var(--primary-300)' }}>
                          {msg.sender_name}
                        </span>
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {msg.message}
                      </div>

                      {msg.attachment_name && (
                        <div style={{ marginTop: '0.6rem' }}>
                          <a
                            href={msg.attachment_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.35rem 0.65rem',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: 'var(--primary-300)',
                              textDecoration: 'none'
                            }}
                          >
                            📎 {msg.attachment_name} ↗
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Author Reply Input Form */}
              <form onSubmit={handleSendReply} style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.5)' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type a reply to the BookLeaf team..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={sendingReply || selectedTicket.status === 'Closed'}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sendingReply || !replyText.trim() || selectedTicket.status === 'Closed'}
                    style={{ padding: '0.65rem 1.25rem' }}
                  >
                    <Send size={15} />
                    <span>{sendingReply ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
                {selectedTicket.status === 'Closed' && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                    This ticket has been marked as Closed.
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

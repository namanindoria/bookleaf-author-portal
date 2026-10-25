import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../Common/Badge';
import { MessageSquare, Send, Paperclip } from 'lucide-react';

export function MyTickets({ authorId, onSwitchToSubmit }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const loadTickets = async () => {
    try {
      const data = await api.getTickets();
      setTickets(data);
      if (selectedTicket) {
        const fresh = await api.getTicket(selectedTicket.id);
        setSelectedTicket(fresh);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();

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
      <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
        Loading support tickets...
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>My Support Tickets</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Track tickets and responses from the BookLeaf team in real time
          </p>
        </div>
        <button onClick={onSwitchToSubmit} className="btn btn-primary btn-sm">
          New Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="clean-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <MessageSquare size={32} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>No tickets raised yet</h3>
          <p style={{ color: '#64748b', fontSize: '0.825rem', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
            Have a question about your royalties, ISBN, or distribution?
          </p>
          <button onClick={onSwitchToSubmit} className="btn btn-secondary btn-sm">
            Raise a Query
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1.3fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* Ticket List */}
          <div className="clean-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              All Tickets ({tickets.length})
            </div>

            <div style={{ divideY: '1px solid #f1f5f9' }}>
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTicket(t)}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f0fdfa' : '#ffffff',
                      borderLeft: isSelected ? '3px solid #0f766e' : '3px solid transparent',
                      transition: 'background-color 0.1s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: '#0f766e' }}>
                        {t.id}
                      </span>
                      <StatusBadge status={t.status} />
                    </div>

                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                      {t.subject}
                    </h4>

                    {t.book_title && (
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.4rem' }}>
                        Book: {t.book_title}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: '#94a3b8' }}>
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
            <div className="clean-card" style={{ display: 'flex', flexDirection: 'column', height: '620px', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: '#0f766e' }}>
                      {selectedTicket.id}
                    </span>
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                  <CategoryBadge category={selectedTicket.category} />
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  {selectedTicket.subject}
                </h3>

                {selectedTicket.book_title && (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Related Book: <strong>{selectedTicket.book_title}</strong>
                  </p>
                )}
              </div>

              {/* Message Thread */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
                {selectedTicket.messages && selectedTicket.messages.map((msg) => {
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                        maxWidth: '85%',
                        background: isAdmin ? '#ffffff' : '#0f766e',
                        color: isAdmin ? '#0f172a' : '#ffffff',
                        border: isAdmin ? '1px solid #e2e8f0' : 'none',
                        borderRadius: '8px',
                        padding: '0.85rem 1rem',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isAdmin ? '#0f766e' : '#e6fffa' }}>
                          {msg.sender_name}
                        </span>
                        <span style={{ fontSize: '0.675rem', color: isAdmin ? '#94a3b8' : '#ccfbf1' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {msg.message}
                      </div>

                      {msg.attachment_name && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <a
                            href={msg.attachment_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.5rem',
                              background: isAdmin ? '#f1f5f9' : 'rgba(255,255,255,0.15)',
                              borderRadius: '4px',
                              fontSize: '0.725rem',
                              color: isAdmin ? '#0f766e' : '#ffffff',
                              textDecoration: 'none'
                            }}
                          >
                            <Paperclip size={12} /> {msg.attachment_name} ↗
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} style={{ padding: '0.85rem 1rem', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                    className="btn btn-primary btn-sm"
                    disabled={sendingReply || !replyText.trim() || selectedTicket.status === 'Closed'}
                  >
                    <Send size={13} />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

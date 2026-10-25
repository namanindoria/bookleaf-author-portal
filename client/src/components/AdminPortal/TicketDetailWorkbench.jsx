import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../Common/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Send,
  Lock,
  UserCheck,
  RotateCw,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Paperclip,
  X
} from 'lucide-react';

const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry"
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export function TicketDetailWorkbench({ ticketId, onTicketUpdated, onClose }) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiDraft, setAiDraft] = useState('');
  const [aiDraftMeta, setAiDraftMeta] = useState(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [sendingResponse, setSendingResponse] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState('draft'); // 'draft' | 'thread' | 'notes'

  const loadTicket = async () => {
    try {
      setLoading(true);
      const data = await api.getTicket(ticketId);
      setTicket(data);

      if (data.latest_ai_draft) {
        setAiDraft(data.latest_ai_draft.draft_text);
        setAiDraftMeta({
          model: data.latest_ai_draft.model_used,
          tokens: data.latest_ai_draft.tokens_used
        });
      } else {
        handleGenerateDraft(data.id);
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) loadTicket();
  }, [ticketId]);

  const handleGenerateDraft = async (id = ticket.id) => {
    setGeneratingDraft(true);
    try {
      const res = await api.generateAiDraft(id);
      setAiDraft(res.draft);
      setAiDraftMeta({ model: res.model, tokens: res.tokensUsed });
    } catch (err) {
      alert('Failed to generate AI draft: ' + err.message);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await api.updateTicket(ticket.id, { status: newStatus });
      setTicket(updated);
      if (onTicketUpdated) onTicketUpdated(updated);
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleCategoryChange = async (newCategory) => {
    try {
      const updated = await api.updateTicket(ticket.id, { category: newCategory });
      setTicket(updated);
      if (onTicketUpdated) onTicketUpdated(updated);
    } catch (err) {
      alert('Failed to override category: ' + err.message);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const updated = await api.updateTicket(ticket.id, { priority: newPriority });
      setTicket(updated);
      if (onTicketUpdated) onTicketUpdated(updated);
    } catch (err) {
      alert('Failed to override priority: ' + err.message);
    }
  };

  const handleAssignToMe = async () => {
    try {
      const updated = await api.updateTicket(ticket.id, {
        assigned_to: user.id,
        assigned_name: user.name
      });
      setTicket(updated);
      if (onTicketUpdated) onTicketUpdated(updated);
    } catch (err) {
      alert('Failed to assign ticket: ' + err.message);
    }
  };

  const handleSendResponse = async () => {
    if (!aiDraft.trim()) return;
    setSendingResponse(true);
    try {
      await api.addMessage(ticket.id, {
        message: aiDraft.trim()
      });
      const refreshed = await api.getTicket(ticket.id);
      setTicket(refreshed);
      if (onTicketUpdated) onTicketUpdated(refreshed);
      setActiveTab('thread');
      alert('Response sent to author successfully!');
    } catch (err) {
      alert('Failed to send response: ' + err.message);
    } finally {
      setSendingResponse(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!internalNote.trim()) return;
    setAddingNote(true);
    try {
      await api.addInternalNote(ticket.id, {
        note: internalNote.trim()
      });
      setInternalNote('');
      const refreshed = await api.getTicket(ticket.id);
      setTicket(refreshed);
      if (onTicketUpdated) onTicketUpdated(refreshed);
    } catch (err) {
      alert('Failed to add internal note: ' + err.message);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="clean-card" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        Loading ticket details...
      </div>
    );
  }

  const isCritical = ticket.priority === 'Critical' && ticket.status !== 'Resolved' && ticket.status !== 'Closed';

  return (
    <div className="clean-card" style={{ overflow: 'hidden' }}>
      {/* Alert Bar if Critical */}
      {isCritical && (
        <div style={{
          background: '#ffe4e6',
          borderBottom: '1px solid #fecdd3',
          padding: '0.65rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: '#be123c',
          fontWeight: 600
        }}>
          <AlertCircle size={15} />
          <span>Priority Alert: Requires 48-hour resolution turnaround per BookLeaf author policy.</span>
        </div>
      )}

      {/* Ticket Header */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: '#0f766e' }}>
                {ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              {ticket.subject}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {ticket.assigned_name ? (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Assigned: <strong>{ticket.assigned_name}</strong>
              </span>
            ) : (
              <button onClick={handleAssignToMe} className="btn btn-secondary btn-sm">
                <UserCheck size={13} /> Assign to Me
              </button>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-sm">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Triage Controls (Human-styled clean dropdowns) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          padding: '0.75rem',
          background: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
              Status
            </label>
            <select
              className="form-control"
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.8rem' }}
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
              Category {ticket.category !== ticket.category_ai && '(Overridden)'}
            </label>
            <select
              className="form-control"
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.8rem' }}
              value={ticket.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
              Priority Score {ticket.priority !== ticket.priority_ai && '(Overridden)'}
            </label>
            <select
              className="form-control"
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.8rem' }}
              value={ticket.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {ticket.priority_reasoning && (
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            <strong>AI Triage Note:</strong> {ticket.priority_reasoning}
          </p>
        )}
      </div>

      {/* Author Context Summary */}
      <div style={{
        padding: '0.65rem 1.25rem',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <strong style={{ color: '#0f172a' }}>{ticket.author_name}</strong>
          <span style={{ color: '#64748b' }}>{ticket.author_email}</span>
          <span style={{ color: '#64748b' }}>{ticket.author_phone}</span>
          <span style={{ color: '#64748b' }}>{ticket.author_city}</span>
        </div>

        {ticket.book_title && (
          <div style={{ color: '#64748b' }}>
            Book: <strong>{ticket.book_title}</strong> (Copies: {ticket.total_copies_sold || 0} • Pending: ₹{ticket.royalty_pending || 0})
          </div>
        )}
      </div>

      {/* Clean Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <button
          onClick={() => setActiveTab('draft')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'draft' ? '2px solid #0f766e' : '2px solid transparent',
            color: activeTab === 'draft' ? '#0f766e' : '#64748b',
            fontWeight: 600,
            fontSize: '0.825rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Sparkles size={14} /> AI-Drafted Response
        </button>

        <button
          onClick={() => setActiveTab('thread')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'thread' ? '2px solid #0f766e' : '2px solid transparent',
            color: activeTab === 'thread' ? '#0f766e' : '#64748b',
            fontWeight: 600,
            fontSize: '0.825rem',
            cursor: 'pointer'
          }}
        >
          Message Thread ({ticket.messages?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'notes' ? '2px solid #0f766e' : '2px solid transparent',
            color: activeTab === 'notes' ? '#0f766e' : '#64748b',
            fontWeight: 600,
            fontSize: '0.825rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Lock size={13} /> Internal Notes ({ticket.notes?.length || 0})
        </button>
      </div>

      {/* TAB 1: AI Draft */}
      {activeTab === 'draft' && (
        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Drafted using BookLeaf Knowledge Base & tone guidelines. Edit as needed before sending:
            </span>

            <button
              onClick={() => handleGenerateDraft(ticket.id)}
              disabled={generatingDraft}
              className="btn btn-secondary btn-sm"
            >
              <RotateCw size={12} className={generatingDraft ? 'animate-spin' : ''} />
              <span>Regenerate</span>
            </button>
          </div>

          <textarea
            className="form-control"
            rows={8}
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: '#0f172a'
            }}
            value={aiDraft}
            onChange={(e) => setAiDraft(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              {aiDraftMeta && <>Model: {aiDraftMeta.model} • ~{aiDraftMeta.tokens} tokens</>}
            </span>

            <button
              onClick={handleSendResponse}
              disabled={sendingResponse || !aiDraft.trim()}
              className="btn btn-primary btn-sm"
            >
              <Send size={13} />
              <span>{sendingResponse ? 'Sending...' : 'Approve & Send Response'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Conversation Thread */}
      {activeTab === 'thread' && (
        <div style={{ padding: '1.25rem', maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc' }}>
          {ticket.messages && ticket.messages.map((m) => {
            const isAdmin = m.sender_role === 'admin';
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: isAdmin ? '#0f766e' : '#ffffff',
                  color: isAdmin ? '#ffffff' : '#0f172a',
                  border: isAdmin ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isAdmin ? '#e6fffa' : '#0f766e' }}>
                    {m.sender_name}
                  </span>
                  <span style={{ fontSize: '0.675rem', color: isAdmin ? '#ccfbf1' : '#94a3b8' }}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {m.message}
                </div>
                {m.attachment_name && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a
                      href={m.attachment_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.45rem',
                        background: isAdmin ? 'rgba(255,255,255,0.15)' : '#f1f5f9',
                        borderRadius: '4px',
                        fontSize: '0.725rem',
                        color: isAdmin ? '#ffffff' : '#0f766e',
                        textDecoration: 'none'
                      }}
                    >
                      <Paperclip size={12} /> {m.attachment_name} ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Internal Notes */}
      {activeTab === 'notes' && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '6px',
            padding: '0.65rem 0.85rem',
            fontSize: '0.785rem',
            color: '#b45309'
          }}>
            <Lock size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Internal notes are strictly private to operations staff and are never shown to the author.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
            {ticket.notes && ticket.notes.length > 0 ? (
              ticket.notes.map((n) => (
                <div
                  key={n.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.75rem' }}>
                    <strong style={{ color: '#0f172a' }}>{n.author_name}</strong>
                    <span style={{ color: '#94a3b8' }}>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#475569', whiteSpace: 'pre-wrap' }}>
                    {n.note}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>
                No internal notes yet.
              </p>
            )}
          </div>

          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Add an internal note (e.g. 'Bank IFSC checked with finance, queued for tomorrow')..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={addingNote || !internalNote.trim()}
                className="btn btn-secondary btn-sm"
              >
                <span>{addingNote ? 'Saving...' : 'Add Note'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

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
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  MessageSquare
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

  // Load ticket details
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
        // Auto-request draft if none exists yet
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

  // Generate / Regenerate AI Draft
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

  // Update Status
  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await api.updateTicket(ticket.id, { status: newStatus });
      setTicket(updated);
      if (onTicketUpdated) onTicketUpdated(updated);
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Override Category
  const handleCategoryChange = async (newCategory) => {
    try {
      const updated = await api.updateTicket(ticket.id, { category: newCategory });
      setTicket(updated);
      if (onTicketUpdated) onTicketUpdated(updated);
    } catch (err) {
      alert('Failed to override category: ' + err.message);
    }
  };

  // Override Priority
  const handlePriorityChange = async (newPriority) => {
    try {
      const updated = await api.updateTicket(ticket.id, { priority: newPriority });
      setTicket(updated);
      if (onTicketUpdated) onTicketUpdated(updated);
    } catch (err) {
      alert('Failed to override priority: ' + err.message);
    }
  };

  // Assign to Me
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

  // Send AI Draft (or edited response) to Author
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
      alert('Response sent to author successfully and broadcast in real time!');
    } catch (err) {
      alert('Failed to send response: ' + err.message);
    } finally {
      setSendingResponse(false);
    }
  };

  // Add Internal Note
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
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
        Loading ticket workbench...
      </div>
    );
  }

  const isCritical = ticket.priority === 'Critical';
  const isHigh = ticket.priority === 'High';

  return (
    <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Urgency Highlight Banner if Critical or High */}
      {(isCritical || isHigh) && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
        <div style={{
          background: isCritical ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          borderBottom: isCritical ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
          padding: '0.65rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.825rem',
          color: isCritical ? '#fb7185' : '#fbbf24',
          fontWeight: 600
        }}>
          <AlertTriangle size={16} />
          <span>
            {isCritical ? 'CRITICAL TICKET: High escalation risk. Strict 48-hour resolution window required.' : 'HIGH PRIORITY: Rapid resolution expected for author satisfaction.'}
          </span>
        </div>
      )}

      {/* Ticket Header & Action Bar */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                {ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {ticket.subject}
            </h2>
          </div>

          {/* Quick Assign to Me */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {ticket.assigned_name ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserCheck size={14} color="#34d399" /> Assigned: <strong>{ticket.assigned_name}</strong>
              </span>
            ) : (
              <button onClick={handleAssignToMe} className="btn btn-secondary btn-sm">
                <UserCheck size={14} /> Assign to Me
              </button>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-sm">
              Close
            </button>
          </div>
        </div>

        {/* AI Classification & Manual Overrides Control Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          padding: '0.85rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* Status Select */}
          <div>
            <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
              Ticket Status
            </label>
            <select
              className="form-control"
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Category Override */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Category (AI Auto-Classified)
              </label>
              {ticket.category !== ticket.category_ai && (
                <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 600 }}>Overridden</span>
              )}
            </div>
            <select
              className="form-control"
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
              value={ticket.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Priority Override */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                Priority Score (AI Assessed)
              </label>
              {ticket.priority !== ticket.priority_ai && (
                <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 600 }}>Overridden</span>
              )}
            </div>
            <select
              className="form-control"
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
              value={ticket.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* AI Priority Reasoning rationale */}
        {ticket.priority_reasoning && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontStyle: 'italic' }}>
            💡 <strong>AI Analysis Note:</strong> {ticket.priority_reasoning}
          </p>
        )}
      </div>

      {/* 360-Degree Author Context Strip */}
      <div style={{
        padding: '0.75rem 1.5rem',
        background: 'rgba(16, 185, 129, 0.04)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{ticket.author_name}</span>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Mail size={13} /> {ticket.author_email}
          </span>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Phone size={13} /> {ticket.author_phone}
          </span>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <MapPin size={13} /> {ticket.author_city}
          </span>
        </div>

        {ticket.book_title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>
              Book: <strong style={{ color: 'var(--text-main)' }}>{ticket.book_title}</strong>
            </span>
            <span style={{ color: 'var(--primary-300)' }}>
              Sold: {ticket.total_copies_sold || 0}
            </span>
            <span style={{ color: ticket.royalty_pending > 0 ? '#fbbf24' : 'var(--text-dim)' }}>
              Pending Royalty: ₹{ticket.royalty_pending || 0}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.3)' }}>
        <button
          onClick={() => setActiveTab('draft')}
          style={{
            flex: 1,
            padding: '0.85rem',
            border: 'none',
            background: activeTab === 'draft' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            borderBottom: activeTab === 'draft' ? '2px solid var(--primary-500)' : '2px solid transparent',
            color: activeTab === 'draft' ? 'var(--primary-400)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Sparkles size={16} /> AI-Drafted Response Studio
        </button>

        <button
          onClick={() => setActiveTab('thread')}
          style={{
            flex: 1,
            padding: '0.85rem',
            border: 'none',
            background: activeTab === 'thread' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            borderBottom: activeTab === 'thread' ? '2px solid var(--primary-500)' : '2px solid transparent',
            color: activeTab === 'thread' ? 'var(--primary-400)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <MessageSquare size={16} /> Conversation Thread ({ticket.messages?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          style={{
            flex: 1,
            padding: '0.85rem',
            border: 'none',
            background: activeTab === 'notes' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            borderBottom: activeTab === 'notes' ? '2px solid var(--primary-500)' : '2px solid transparent',
            color: activeTab === 'notes' ? 'var(--primary-400)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Lock size={15} /> Internal Notes ({ticket.notes?.length || 0})
        </button>
      </div>

      {/* TAB 1: AI-Drafted Response Studio */}
      {activeTab === 'draft' && (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                <Sparkles size={16} color="var(--primary-400)" />
                AI-Generated Draft Response
              </h4>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Trained on BookLeaf Knowledge Base, 80/20 royalty rules, printing SLA, and partner tone guidelines. Review and edit before sending.
              </p>
            </div>

            <button
              onClick={() => handleGenerateDraft(ticket.id)}
              disabled={generatingDraft}
              className="btn btn-secondary btn-sm"
              title="Regenerate draft using BookLeaf AI model"
            >
              <RotateCw size={13} className={generatingDraft ? 'animate-spin' : ''} />
              <span>{generatingDraft ? 'Regenerating...' : 'Regenerate Draft'}</span>
            </button>
          </div>

          {/* AI Response Textarea */}
          <textarea
            className="form-control"
            rows={10}
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
            value={aiDraft}
            onChange={(e) => setAiDraft(e.target.value)}
            placeholder="AI draft is being prepared..."
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {aiDraftMeta && (
                <>Engine: <code style={{ color: 'var(--primary-300)' }}>{aiDraftMeta.model}</code> • ~{aiDraftMeta.tokens} tokens</>
              )}
            </span>

            <button
              onClick={handleSendResponse}
              disabled={sendingResponse || !aiDraft.trim()}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem' }}
            >
              <Send size={15} />
              <span>{sendingResponse ? 'Sending to Author...' : 'Approve & Send to Author'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Conversation Thread */}
      {activeTab === 'thread' && (
        <div style={{ padding: '1.25rem 1.5rem', maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ticket.messages && ticket.messages.map((m) => {
            const isAdmin = m.sender_role === 'admin';
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: isAdmin ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.25) 0%, rgba(16, 185, 129, 0.2) 100%)' : 'rgba(30, 41, 59, 0.85)',
                  border: isAdmin ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 700, color: isAdmin ? 'var(--primary-300)' : '#38bdf8' }}>
                    {m.sender_name}
                  </span>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)' }}>
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {m.message}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Internal Notes (Ops Only) */}
      {activeTab === 'notes' && (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: '#fbbf24'
          }}>
            <Lock size={15} />
            <span>
              <strong>Confidential Internal Log:</strong> Notes posted here are strictly visible to BookLeaf operations staff and never shown to the author.
            </span>
          </div>

          {/* Notes List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
            {ticket.notes && ticket.notes.length > 0 ? (
              ticket.notes.map((n) => (
                <div
                  key={n.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: '#fbbf24' }}>{n.author_name}</span>
                    <span style={{ color: 'var(--text-dim)' }}>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                    {n.note}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1.5rem 0' }}>
                No internal notes recorded yet.
              </p>
            )}
          </div>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Add an internal note (e.g. 'Checked with Repro India warehouse, replacement batch dispatching on Monday')..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={addingNote || !internalNote.trim()}
                className="btn btn-secondary btn-sm"
              >
                <Lock size={13} />
                <span>{addingNote ? 'Saving...' : 'Add Private Note'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

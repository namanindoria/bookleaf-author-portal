import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge, BookStatusBadge } from '../Common/Badge';
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
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  DollarSign,
  User,
  Clock,
  Shield,
  MessageSquare,
  Copy,
  Check,
  CheckCircle2,
  Zap,
  Tag,
  CornerDownLeft,
  BookMarked
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

const CANNED_SNIPPETS = [
  {
    label: '+ Royalty Cycle (15th)',
    text: '\n\n[BookLeaf Policy Note]: Royalty calculations run on calendar months and are disbursed on the 15th of each month for all balances meeting the ₹500 threshold.'
  },
  {
    label: '+ Author Copies (7-10d)',
    text: '\n\n[BookLeaf Policy Note]: Complimentary author copies dispatch within 7-10 business days of final proof sign-off, with tracking shared via SMS/Email.'
  },
  {
    label: '+ ISBN Timeline (3-5d)',
    text: '\n\n[BookLeaf Policy Note]: Official ISBN issuance and National Agency barcode verification requires 3 to 5 business days upon manuscript intake.'
  },
  {
    label: '+ Marketplace Sync (24-48h)',
    text: '\n\n[BookLeaf Policy Note]: Metadata, cover artwork, and distribution updates take 24 to 48 hours to fully sync across Amazon India, Flipkart, and Ingram.'
  }
];

function getTimeElapsed(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${Math.max(1, diffMins)}m ago`;
  }
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getSlaInfo(priority, createdStr, status) {
  if (status === 'Resolved' || status === 'Closed') {
    return { label: 'SLA Resolved', color: '#0f766e', bg: '#f0fdfa', border: '#ccfbf1' };
  }
  const created = new Date(createdStr).getTime();
  const elapsedHours = (Date.now() - created) / (1000 * 60 * 60);

  let targetHours = 72;
  if (priority === 'Critical') targetHours = 48;
  else if (priority === 'High') targetHours = 48;
  else if (priority === 'Medium') targetHours = 72;
  else targetHours = 120;

  const remaining = Math.round(targetHours - elapsedHours);
  if (remaining <= 0) {
    return {
      label: `SLA Breached (${Math.abs(remaining)}h overdue)`,
      color: '#be123c',
      bg: '#ffe4e6',
      border: '#fecdd3'
    };
  }
  return {
    label: `${remaining}h remaining (${targetHours}h SLA)`,
    color: '#0f766e',
    bg: '#f0fdfa',
    border: '#ccfbf1'
  };
}

export function TicketDetailWorkbench({
  ticketId,
  allTickets = [],
  onTicketUpdated,
  onClose,
  onNavigateTicket
}) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [authorBooks, setAuthorBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiDraft, setAiDraft] = useState('');
  const [aiDraftMeta, setAiDraftMeta] = useState(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [sendingResponse, setSendingResponse] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [composerMode, setComposerMode] = useState('reply'); // 'reply' | 'note'
  const [copied, setCopied] = useState(false);

  // Navigation indices
  const currentIndex = allTickets.findIndex(t => t.id === ticketId);
  const prevTicket = currentIndex > 0 ? allTickets[currentIndex - 1] : null;
  const nextTicket = currentIndex >= 0 && currentIndex < allTickets.length - 1 ? allTickets[currentIndex + 1] : null;

  // Auto-scroll to top when a new ticket opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const data = await api.getTicket(ticketId);
      setTicket(data);

      if (data.author_id) {
        api.getAuthorBooks(data.author_id)
          .then(books => setAuthorBooks(books || []))
          .catch(() => {});
      }

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

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

      if (e.key === 'Escape') {
        onClose();
      } else if (!isInput && e.key === '[' && prevTicket) {
        onNavigateTicket(prevTicket.id);
      } else if (!isInput && e.key === ']' && nextTicket) {
        onNavigateTicket(nextTicket.id);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (composerMode === 'reply' && aiDraft.trim() && !sendingResponse) {
          handleSendResponse(e);
        } else if (composerMode === 'note' && internalNote.trim() && !addingNote) {
          handleAddNote(e);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevTicket, nextTicket, composerMode, aiDraft, internalNote, sendingResponse, addingNote]);

  const handleCopyId = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateDraft = async (id = ticket?.id) => {
    if (!id) return;
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

  const handleSendResponse = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!aiDraft.trim()) return;
    setSendingResponse(true);
    try {
      await api.addMessage(ticket.id, {
        message: aiDraft.trim()
      });
      const refreshed = await api.getTicket(ticket.id);
      setTicket(refreshed);
      if (onTicketUpdated) onTicketUpdated(refreshed);
      setAiDraft('');
      alert('Response sent to author and synchronized via real-time stream.');
    } catch (err) {
      alert('Failed to send response: ' + err.message);
    } finally {
      setSendingResponse(false);
    }
  };

  const handleAddNote = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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

  const handleInsertSnippet = (snippetText) => {
    setAiDraft(prev => (prev ? prev.trim() + snippetText : snippetText.trim()));
  };

  if (loading || !ticket) {
    return (
      <div className="clean-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
        <RotateCw size={20} className="animate-spin" style={{ display: 'inline', marginBottom: '0.5rem' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading ticket workbench...</p>
      </div>
    );
  }

  const isCritical = ticket.priority === 'Critical' && ticket.status !== 'Resolved' && ticket.status !== 'Closed';
  const sla = getSlaInfo(ticket.priority, ticket.created_at, ticket.status);
  const timeElapsed = getTimeElapsed(ticket.created_at);

  return (
    <div>
      {/* Top Breadcrumb, Quick Actions & Ticket Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem',
        padding: '0.65rem 0',
        borderBottom: '1px solid #e2e8f0',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Left: Back button, Ticket ID with copy, SLA badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            title="Return to ticket queue (Esc)"
          >
            <ArrowLeft size={14} />
            <span>Back to Queue</span>
            <kbd style={{ fontSize: '0.65rem', background: '#e2e8f0', padding: '0.1rem 0.3rem', borderRadius: '3px', marginLeft: '2px', color: '#64748b' }}>Esc</kbd>
          </button>

          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>/</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: '#0f766e' }}>
              {ticket.id}
            </span>
            <button
              onClick={handleCopyId}
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              title="Copy Ticket ID"
            >
              {copied ? <Check size={12} color="#0f766e" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div style={{
            fontSize: '0.725rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '4px',
            background: sla.bg,
            border: `1px solid ${sla.border}`,
            color: sla.color,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <Clock size={11} />
            <span>{sla.label}</span>
          </div>
        </div>

        {/* Right: 1-Click Status Quick Actions & Prev/Next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* 1-Click Quick Status Actions */}
          {ticket.status === 'Open' && (
            <button
              onClick={() => handleStatusChange('In Progress')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
            >
              <Zap size={12} />
              <span>Start Working</span>
            </button>
          )}

          {ticket.status !== 'Resolved' && ticket.status !== 'Closed' ? (
            <button
              onClick={() => handleStatusChange('Resolved')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', color: '#0f766e', borderColor: '#ccfbf1', background: '#f0fdfa' }}
            >
              <CheckCircle2 size={13} />
              <span>Mark as Resolved</span>
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('In Progress')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            >
              <RotateCw size={12} />
              <span>Reopen Ticket</span>
            </button>
          )}

          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>|</span>

          {/* Previous / Next Ticket Controls with keyboard tooltips */}
          {allTickets.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {currentIndex + 1} of {allTickets.length}
            </span>
          )}

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              disabled={!prevTicket}
              onClick={() => prevTicket && onNavigateTicket(prevTicket.id)}
              className="btn btn-secondary btn-sm"
              title="Previous Ticket (Shortcut: [ )"
              style={{ padding: '0.3rem 0.45rem' }}
            >
              <ChevronLeft size={14} />
            </button>

            <button
              disabled={!nextTicket}
              onClick={() => nextTicket && onNavigateTicket(nextTicket.id)}
              className="btn btn-secondary btn-sm"
              title="Next Ticket (Shortcut: ] )"
              style={{ padding: '0.3rem 0.45rem' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Critical SLA Notice Banner */}
      {isCritical && (
        <div style={{
          background: '#ffe4e6',
          border: '1px solid #fecdd3',
          borderRadius: '8px',
          padding: '0.65rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.825rem',
          color: '#be123c',
          fontWeight: 600
        }}>
          <AlertCircle size={16} />
          <span>Priority Escalation: Critical ticket requiring 48-hour resolution under BookLeaf author policy.</span>
        </div>
      )}

      {/* Main 2-Column Workbench Layout (68% Main Stream / 32% Context Sidebar) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: Ticket Stream + Response Studio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Ticket Header Card */}
          <div className="clean-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <CategoryBadge category={ticket.category} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Opened {timeElapsed} ({new Date(ticket.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })})
              </span>
            </div>

            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
              {ticket.subject}
            </h1>

            {ticket.book_title && (
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                Subject Book: <strong style={{ color: '#0f766e' }}>{ticket.book_title}</strong> {ticket.book_isbn ? `(ISBN: ${ticket.book_isbn})` : ''}
              </p>
            )}
          </div>

          {/* Conversation History Stream (Chronological) */}
          <div className="clean-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Conversation & Activity Thread ({ticket.messages?.length || 0})
              </h3>
              <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Real-time SSE active</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ticket.messages && ticket.messages.map((m) => {
                const isAdmin = m.sender_role === 'admin';
                return (
                  <div
                    key={m.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: isAdmin ? '#f0fdfa' : '#ffffff',
                      padding: '1rem',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <strong style={{ fontSize: '0.825rem', color: isAdmin ? '#0f766e' : '#0f172a' }}>
                          {m.sender_name}
                        </strong>
                        <span style={{
                          fontSize: '0.675rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          background: isAdmin ? '#ccfbf1' : '#f1f5f9',
                          color: isAdmin ? '#0f766e' : '#64748b',
                          fontWeight: 500
                        }}>
                          {isAdmin ? 'BookLeaf Team' : 'Author'}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                        {new Date(m.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.875rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {m.message}
                    </div>

                    {m.attachment_name && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
                        <a
                          href={m.attachment_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.65rem',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#0f766e',
                            textDecoration: 'none',
                            fontWeight: 500
                          }}
                        >
                          <Paperclip size={13} /> {m.attachment_name} ↗
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Inline Confidential Notes (Ops-only log) */}
              {ticket.notes && ticket.notes.length > 0 && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 600, color: '#b45309', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    <Lock size={12} /> Confidential Team Log ({ticket.notes.length})
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ticket.notes.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: '6px',
                          padding: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.725rem' }}>
                          <strong style={{ color: '#92400e' }}>{n.author_name} (Private Log)</strong>
                          <span style={{ color: '#b45309' }}>{new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <div style={{ fontSize: '0.825rem', color: '#78350f', whiteSpace: 'pre-wrap' }}>
                          {n.note}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Response Composer Studio (Reply vs Internal Note) */}
          <div className="clean-card" style={{ overflow: 'hidden' }}>
            {/* Mode Selector Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button
                type="button"
                onClick={() => setComposerMode('reply')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: composerMode === 'reply' ? '#ffffff' : 'transparent',
                  borderBottom: composerMode === 'reply' ? '2px solid #0f766e' : '2px solid transparent',
                  color: composerMode === 'reply' ? '#0f766e' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Sparkles size={14} />
                <span>Reply to Author (AI-Assisted)</span>
              </button>

              <button
                type="button"
                onClick={() => setComposerMode('note')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: composerMode === 'note' ? '#ffffff' : 'transparent',
                  borderBottom: composerMode === 'note' ? '2px solid #b45309' : '2px solid transparent',
                  color: composerMode === 'note' ? '#b45309' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Lock size={13} />
                <span>Private Internal Note</span>
              </button>
            </div>

            {/* Mode 1: Reply to Author with AI Draft */}
            {composerMode === 'reply' && (
              <form onSubmit={handleSendResponse} style={{ padding: '1.25rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.65rem',
                  background: '#f0fdfa',
                  border: '1px solid #ccfbf1',
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.785rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f766e' }}>
                    <Sparkles size={14} />
                    <span>AI draft grounded in BookLeaf Knowledge Base & author data:</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerateDraft(ticket.id)}
                    disabled={generatingDraft}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                  >
                    <RotateCw size={12} className={generatingDraft ? 'animate-spin' : ''} />
                    <span>{generatingDraft ? 'Drafting...' : 'Regenerate Draft'}</span>
                  </button>
                </div>

                {/* 1-Click Canned Policy Snippets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginRight: '0.2rem' }}>
                    Insert Verified Policy:
                  </span>
                  {CANNED_SNIPPETS.map((snippet, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertSnippet(snippet.text)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: '#f8fafc', color: '#334155' }}
                    >
                      {snippet.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className="form-control"
                  rows={8}
                  style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    color: '#0f172a',
                    fontFamily: 'var(--font-sans)',
                    marginBottom: '0.85rem'
                  }}
                  placeholder="Loading AI-drafted reply..."
                  value={aiDraft}
                  onChange={(e) => setAiDraft(e.target.value)}
                  required
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {aiDraftMeta && <span>Engine: {aiDraftMeta.model} • ~{aiDraftMeta.tokens} tokens</span>}
                    <span>• Shortcut: <kbd style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>Ctrl + Enter</kbd> to send</span>
                  </div>

                  <button
                    type="submit"
                    disabled={sendingResponse || !aiDraft.trim()}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.25rem' }}
                  >
                    <Send size={14} />
                    <span>{sendingResponse ? 'Sending...' : 'Approve & Send to Author'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: Private Internal Note */}
            {composerMode === 'note' && (
              <form onSubmit={handleAddNote} style={{ padding: '1.25rem' }}>
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  marginBottom: '0.65rem',
                  fontSize: '0.785rem',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Lock size={13} />
                  <span>Internal notes are confidential to BookLeaf operations staff and strictly hidden from the author.</span>
                </div>

                <textarea
                  className="form-control"
                  rows={4}
                  style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}
                  placeholder="Add private note (e.g. 'Checked with Repro India warehouse, batch 4402 reprinted today')..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  required
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                    Shortcut: <kbd style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>Ctrl + Enter</kbd> to save
                  </span>

                  <button
                    type="submit"
                    disabled={addingNote || !internalNote.trim()}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>{addingNote ? 'Saving...' : 'Save Internal Note'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 360 Context Sidebar (Properties, Author 360, Book Context) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 1. Ticket Properties & Triage Card */}
          <div className="clean-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.85rem' }}>
              Ticket Properties
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Status
                </label>
                <select
                  className="form-control"
                  style={{ fontSize: '0.825rem' }}
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                    Category
                  </label>
                  {ticket.category !== ticket.category_ai && (
                    <span style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 600 }}>Overridden</span>
                  )}
                </div>
                <select
                  className="form-control"
                  style={{ fontSize: '0.825rem' }}
                  value={ticket.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                    Priority Score
                  </label>
                  {ticket.priority !== ticket.priority_ai && (
                    <span style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 600 }}>Overridden</span>
                  )}
                </div>
                <select
                  className="form-control"
                  style={{ fontSize: '0.825rem' }}
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Assignee
                </label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.825rem', color: ticket.assigned_name ? '#0f172a' : '#94a3b8' }}>
                    {ticket.assigned_name || 'Unassigned'}
                  </span>
                  {ticket.assigned_to !== user.id && (
                    <button onClick={handleAssignToMe} className="btn btn-secondary btn-sm" style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}>
                      Assign to Me
                    </button>
                  )}
                </div>
              </div>
            </div>

            {ticket.priority_reasoning && (
              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                  AI Triage Reasoning:
                </span>
                <p style={{ fontSize: '0.775rem', color: '#475569', lineHeight: 1.4 }}>
                  {ticket.priority_reasoning}
                </p>
              </div>
            )}
          </div>

          {/* 2. Author 360 Profile Card */}
          <div className="clean-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} color="#0f766e" />
              Author Context (360°)
            </h4>

            <div style={{ fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.925rem' }}>
                {ticket.author_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b' }}>
                <Mail size={13} /> {ticket.author_email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b' }}>
                <Phone size={13} /> {ticket.author_phone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b' }}>
                <MapPin size={13} /> {ticket.author_city}
              </div>

              {/* Author Portfolio Summary */}
              {authorBooks.length > 0 && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    Author Portfolio ({authorBooks.length} title{authorBooks.length > 1 ? 's' : ''}):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {authorBooks.map(b => (
                      <div
                        key={b.id}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.5rem',
                          background: b.id === ticket.book_id ? '#f0fdfa' : '#f8fafc',
                          border: `1px solid ${b.id === ticket.book_id ? '#ccfbf1' : '#e2e8f0'}`,
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontWeight: b.id === ticket.book_id ? 700 : 500, color: b.id === ticket.book_id ? '#0f766e' : '#334155' }}>
                          {b.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {b.copies_sold || 0} sold
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Related Book Details Card */}
          {ticket.book_title && (
            <div className="clean-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={14} color="#0f766e" />
                Book & Sales Context
              </h4>

              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{ticket.book_title}</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>
                    ISBN: <code style={{ fontFamily: 'var(--font-mono)' }}>{ticket.book_isbn || 'Pending'}</code>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <BookStatusBadge status={ticket.book_status || 'Published & Live'} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Copies Sold:</span>
                  <strong style={{ color: '#0f172a' }}>{ticket.total_copies_sold ? ticket.total_copies_sold.toLocaleString() : 0}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Pending Royalty:</span>
                  <strong style={{ color: ticket.royalty_pending > 0 ? '#b45309' : '#0f172a' }}>
                    ₹{ticket.royalty_pending ? ticket.royalty_pending.toLocaleString() : 0}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Last Payout Date:</span>
                  <span style={{ color: '#0f172a' }}>{ticket.last_royalty_payout_date || 'None yet'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

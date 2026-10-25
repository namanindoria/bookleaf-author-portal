import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Send, Upload, Sparkles, CheckCircle2, Paperclip, X } from 'lucide-react';

const QUICK_TEMPLATES = [
  {
    label: "Royalty Payout Delay",
    subject: "Haven't received royalty payout for over 4 months",
    desc: "I published my book 4 months ago and still haven't received any royalty. What's going on with my payout?",
    bookHint: true
  },
  {
    label: "ISBN Mismatch on Amazon",
    subject: "Amazon listing displays incorrect ISBN number",
    desc: "My physical book shows a different ISBN on Amazon than what's on the physical copy. Readers are reporting errors.",
    bookHint: true
  },
  {
    label: "Print Quality Defect",
    subject: "Author copies arrived with misaligned pages and blurry images",
    desc: "I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned. Need a reprint.",
    bookHint: true
  },
  {
    label: "Distribution Unavailable",
    subject: "Book is showing as 'Currently Unavailable' on Amazon",
    desc: "My book is published and live but it's showing as 'Currently Unavailable' on Amazon India. Please re-sync stock.",
    bookHint: true
  },
  {
    label: "Typesetting Status",
    subject: "Typesetting timeline update",
    desc: "It's been 3 weeks and my book is still in typesetting. When will it be done and proof files shared?",
    bookHint: true
  },
  {
    label: "Update Author Bio",
    subject: "Can I update the description of my book on Amazon?",
    desc: "Can I update the description of my book on Amazon after it's already live? I'd like to refresh the synopsis and author bio.",
    bookHint: false
  }
];

export function SubmitTicket({ authorId, initialBookId = null, onTicketCreated }) {
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState(initialBookId || 'General / Account Level');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBooks() {
      try {
        const data = await api.getAuthorBooks(authorId);
        setBooks(data);
      } catch (err) {
        console.error('Error fetching author books:', err);
      }
    }
    if (authorId) loadBooks();
  }, [authorId]);

  useEffect(() => {
    if (initialBookId) {
      setBookId(initialBookId);
    }
  }, [initialBookId]);

  const handleApplyTemplate = (tmpl) => {
    setSubject(tmpl.subject);
    setDescription(tmpl.desc);
    if (tmpl.bookHint && books.length > 0 && bookId === 'General / Account Level') {
      setBookId(books[0].book_id);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both a subject and a description for your query.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const created = await api.createTicket({
        book_id: bookId === 'General / Account Level' ? null : bookId,
        subject: subject.trim(),
        description: description.trim(),
        attachment_name: attachment ? attachment.name : null,
        attachment_url: attachment ? 'simulated_attachment_url' : null
      });

      setSubmittedTicket(created);
      if (onTicketCreated) onTicketCreated(created);
    } catch (err) {
      setError(err.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubject('');
    setDescription('');
    setAttachment(null);
    setSubmittedTicket(null);
    setError('');
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Success Notification after submission */}
      {submittedTicket ? (
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <CheckCircle2 size={32} />
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Support Ticket Raised Successfully!
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Ticket ID: <strong style={{ color: 'var(--primary-400)', fontFamily: 'var(--font-mono)' }}>{submittedTicket.id}</strong>. Our operations team and AI support assistant have been notified.
          </p>

          {/* AI Auto-Classification Feedback Box */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary-400)' }}>
              <Sparkles size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI Initial Analysis
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>AUTO-CLASSIFIED CATEGORY:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{submittedTicket.category_ai}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>INITIAL PRIORITY SCORE:</span>
                <span style={{ fontWeight: 600, color: submittedTicket.priority === 'Critical' ? '#fb7185' : '#fbbf24' }}>
                  {submittedTicket.priority_ai}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button onClick={handleResetForm} className="btn btn-secondary">
              Raise Another Query
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Submit a Support Query</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Get prompt assistance with your royalties, books, retail distribution, or production updates.
            </p>
          </div>

          {/* Quick Issue Templates */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
              Quick Templates (Click to fill):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {QUICK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Book Selector */}
            <div className="form-group">
              <label className="form-label">Related Book</label>
              <select
                className="form-control"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
              >
                <option value="General / Account Level">General / Account Level (Not book-specific)</option>
                {books.map((b) => (
                  <option key={b.book_id} value={b.book_id}>
                    {b.title} ({b.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Haven't received royalty payout for over 4 months"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Detailed Description</label>
              <textarea
                className="form-control"
                rows={5}
                placeholder="Please describe your query in detail. Include platform names, sales numbers, or dates if applicable..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* File Attachment Dropzone (UI only with simulated preview) */}
            <div className="form-group">
              <label className="form-label">Attachments (Optional: photos of defects, proof screenshots, etc.)</label>
              {attachment ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <Paperclip size={16} color="#34d399" />
                    <span style={{ fontWeight: 600 }}>{attachment.name}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({attachment.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.25rem',
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <Upload size={24} color="var(--text-dim)" style={{ marginBottom: '0.4rem' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Click or drag file here to attach (JPG, PNG, PDF up to 10MB)
                  </span>
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.75rem' }}
              >
                <Send size={16} />
                <span>{submitting ? 'Analyzing & Submitting...' : 'Submit Support Ticket'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

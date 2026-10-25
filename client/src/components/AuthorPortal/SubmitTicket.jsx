import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Send, Upload, CheckCircle, Paperclip, X } from 'lucide-react';

export function SubmitTicket({ authorId, initialBookId = null, onTicketCreated }) {
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState(initialBookId || 'General / Account Level');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingFile(true);
      setError('');
      try {
        const uploadRes = await api.uploadFile(file);
        setAttachment({
          name: uploadRes.fileName,
          url: uploadRes.fileUrl,
          size: (uploadRes.sizeBytes / 1024).toFixed(1) + ' KB'
        });
      } catch (err) {
        setError('File upload failed: ' + err.message);
      } finally {
        setUploadingFile(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both a subject line and description.');
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
        attachment_url: attachment ? attachment.url : null
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
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {submittedTicket ? (
        <div className="clean-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#f0fdf4',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <CheckCircle size={28} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
            Ticket Submitted Successfully
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Reference ID: <strong style={{ color: '#0f766e', fontFamily: 'var(--font-mono)' }}>{submittedTicket.id}</strong>. Our operations team will respond promptly.
          </p>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '1rem',
            textAlign: 'left',
            marginBottom: '1.5rem',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Assigned Category:</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{submittedTicket.category_ai}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Priority:</span>
              <span style={{ fontWeight: 600, color: submittedTicket.priority === 'Critical' ? '#be123c' : '#b45309' }}>
                {submittedTicket.priority_ai}
              </span>
            </div>
          </div>

          <button onClick={handleResetForm} className="btn btn-primary btn-sm">
            Raise Another Ticket
          </button>
        </div>
      ) : (
        <div className="clean-card">
          <div className="clean-card-header">
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Submit a Support Query</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Reach out regarding your royalties, books, retail listings, or production updates.
              </p>
            </div>
          </div>

          <div className="clean-card-body">
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Book Dropdown */}
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
                  placeholder="e.g. Inquiring about Q3 royalty payout status"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Please provide details about your question, including relevant platforms or dates..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Attachment */}
              <div className="form-group">
                <label className="form-label">File Attachment (Optional)</label>
                {attachment ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Paperclip size={14} color="#64748b" />
                      <span style={{ fontWeight: 500 }}>{attachment.name}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>({attachment.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.75rem 1rem',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: '#ffffff'
                  }}>
                    <Upload size={16} color="#64748b" />
                    <span style={{ fontSize: '0.85rem', color: uploadingFile ? '#0f766e' : '#64748b' }}>
                      {uploadingFile ? 'Uploading file to server...' : 'Upload screenshot or PDF document (up to 10MB)'}
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
                  disabled={submitting || uploadingFile}
                  className="btn btn-primary"
                >
                  <Send size={14} />
                  <span>{submitting ? 'Submitting...' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

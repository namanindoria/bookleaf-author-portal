import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BookStatusBadge } from '../Common/Badge';
import { BookOpen, DollarSign, CheckCircle2, Clock, AlertCircle, ShoppingCart, ExternalLink } from 'lucide-react';

export function MyBooks({ authorId, onSelectBookForQuery }) {
  const [books, setBooks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [booksData, metricsData] = await Promise.all([
          api.getAuthorBooks(authorId),
          api.getAuthorMetrics(authorId)
        ]);
        setBooks(booksData);
        setMetrics(metricsData);
      } catch (err) {
        console.error('Failed to load author books:', err);
      } finally {
        setLoading(false);
      }
    }
    if (authorId) loadData();
  }, [authorId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-dim)' }}>
        Loading catalog and royalty figures...
      </div>
    );
  }

  return (
    <div>
      {/* KPI Cards */}
      {metrics && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-info">
              <h4>Total Books</h4>
              <div className="kpi-value">{metrics.totalBooks}</div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                {metrics.publishedBooks} Live • {metrics.inProductionBooks} in Production
              </p>
            </div>
            <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary-400)' }}>
              <BookOpen size={22} />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-info">
              <h4>Total Copies Sold</h4>
              <div className="kpi-value">{metrics.totalCopiesSold.toLocaleString()}</div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                Across all retail channels
              </p>
            </div>
            <div className="kpi-icon" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#38bdf8' }}>
              <ShoppingCart size={22} />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-info">
              <h4>Total Royalty Earned</h4>
              <div className="kpi-value" style={{ color: 'var(--primary-300)' }}>
                ₹{metrics.totalRoyaltyEarned.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                80% Net profit share
              </p>
            </div>
            <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary-400)' }}>
              <DollarSign size={22} />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-info">
              <h4>Royalty Paid</h4>
              <div className="kpi-value" style={{ color: '#34d399' }}>
                ₹{metrics.totalRoyaltyPaid.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                Disbursed to bank
              </p>
            </div>
            <div className="kpi-icon" style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-info">
              <h4>Royalty Pending</h4>
              <div className="kpi-value" style={{ color: metrics.totalRoyaltyPending > 0 ? '#fbbf24' : 'var(--text-muted)' }}>
                ₹{metrics.totalRoyaltyPending.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                {metrics.totalRoyaltyPending >= 1000 ? 'Eligible for next payout' : 'Under ₹1,000 threshold'}
              </p>
            </div>
            <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
              <Clock size={22} />
            </div>
          </div>
        </div>
      )}

      {/* Policy Reminder Banner */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.06)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={18} color="#34d399" />
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-main)' }}>BookLeaf Royalty Payout Policy:</strong> Royalties are calculated quarterly and disbursed within 45 days of the quarter closing. Minimum payout threshold is ₹1,000 (accumulated balances below ₹1,000 roll over).
          </p>
        </div>
      </div>

      {/* Books Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Published & In-Production Titles</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Comprehensive catalog status, sales figures, and royalty earnings per platform
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Book Title & Details</th>
                <th>Status</th>
                <th>MRP / Royalty per Copy</th>
                <th>Copies Sold</th>
                <th>Royalty Breakdown</th>
                <th>Last Payout</th>
                <th>Distribution Channels</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.book_id}>
                  {/* Book Title */}
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {b.title}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>ISBN: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{b.isbn || 'Pending'}</code></span>
                      <span>•</span>
                      <span>{b.genre}</span>
                      {b.publication_date && (
                        <>
                          <span>•</span>
                          <span>Pub: {b.publication_date}</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <BookStatusBadge status={b.status} />
                  </td>

                  {/* MRP */}
                  <td>
                    {b.mrp ? (
                      <div>
                        <span style={{ fontWeight: 600 }}>₹{b.mrp}</span>
                        <div style={{ fontSize: '0.725rem', color: 'var(--primary-400)' }}>
                          +₹{b.author_royalty_per_copy} / copy
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>TBD (In Production)</span>
                    )}
                  </td>

                  {/* Copies Sold */}
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {b.total_copies_sold ? b.total_copies_sold.toLocaleString() : 0}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '0.3rem' }}>copies</span>
                  </td>

                  {/* Royalty Breakdown */}
                  <td>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        ₹{b.total_royalty_earned.toLocaleString()} earned
                      </span>
                      <div style={{ fontSize: '0.75rem', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                        <span style={{ color: '#34d399' }}>Paid: ₹{b.royalty_paid.toLocaleString()}</span>
                        <span style={{ color: b.royalty_pending > 0 ? '#fbbf24' : 'var(--text-dim)' }}>
                          Pending: ₹{b.royalty_pending.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Last Payout */}
                  <td>
                    {b.last_royalty_payout_date ? (
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {b.last_royalty_payout_date}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>None yet</span>
                    )}
                  </td>

                  {/* Available Channels */}
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxWidth: '240px' }}>
                      {b.available_on && b.available_on.length > 0 ? (
                        b.available_on.map((ch, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)'
                            }}
                          >
                            {ch}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Pending launch</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td>
                    <button
                      onClick={() => onSelectBookForQuery(b.book_id)}
                      className="btn btn-secondary btn-sm"
                      title="Raise a support query regarding this book"
                    >
                      Raise Ticket
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

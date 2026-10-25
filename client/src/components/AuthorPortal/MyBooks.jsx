import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BookStatusBadge } from '../Common/Badge';
import { BookOpen, DollarSign, CheckCircle, Clock, ShoppingBag, Info } from 'lucide-react';

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
      <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
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
            <div>
              <h4>Total Titles</h4>
              <div className="kpi-value">{metrics.totalBooks}</div>
              <div className="kpi-sub">
                {metrics.publishedBooks} live • {metrics.inProductionBooks} in production
              </div>
            </div>
            <div className="kpi-icon-wrap">
              <BookOpen size={18} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <h4>Copies Sold</h4>
              <div className="kpi-value">{metrics.totalCopiesSold.toLocaleString()}</div>
              <div className="kpi-sub">Across all distribution channels</div>
            </div>
            <div className="kpi-icon-wrap" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <ShoppingBag size={18} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <h4>Total Royalties</h4>
              <div className="kpi-value">₹{metrics.totalRoyaltyEarned.toLocaleString()}</div>
              <div className="kpi-sub">80% net profit share</div>
            </div>
            <div className="kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
              <DollarSign size={18} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <h4>Pending Payout</h4>
              <div className="kpi-value" style={{ color: metrics.totalRoyaltyPending > 0 ? '#b45309' : '#0f172a' }}>
                ₹{metrics.totalRoyaltyPending.toLocaleString()}
              </div>
              <div className="kpi-sub">
                {metrics.totalRoyaltyPending >= 1000 ? 'Eligible for next quarterly cycle' : 'Below ₹1,000 threshold (rolls over)'}
              </div>
            </div>
            <div className="kpi-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
        </div>
      )}

      {/* Policy Note */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        fontSize: '0.8rem',
        color: '#475569'
      }}>
        <Info size={16} color="#0f766e" />
        <span>
          <strong>Payout Policy:</strong> Royalties are calculated quarterly and disbursed to your linked bank account within 45 days of the quarter ending. Minimum payout is ₹1,000.
        </span>
      </div>

      {/* Books Table */}
      <div className="clean-card" style={{ overflow: 'hidden' }}>
        <div className="clean-card-header">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Book Catalog</h3>
            <p style={{ fontSize: '0.775rem', color: '#64748b' }}>
              Overview of all your published titles and works in production
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="clean-table">
            <thead>
              <tr>
                <th>Title & ISBN</th>
                <th>Status</th>
                <th>MRP / Royalty</th>
                <th>Copies Sold</th>
                <th>Earned / Pending</th>
                <th>Last Payout</th>
                <th>Available On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.book_id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      ISBN: <code style={{ fontFamily: 'var(--font-mono)' }}>{b.isbn || 'Pending Assignment'}</code> • {b.genre}
                    </div>
                  </td>

                  <td>
                    <BookStatusBadge status={b.status} />
                  </td>

                  <td>
                    {b.mrp ? (
                      <div>
                        <span style={{ fontWeight: 500 }}>₹{b.mrp}</span>
                        <span style={{ fontSize: '0.75rem', color: '#0f766e', marginLeft: '4px' }}>
                          (₹{b.author_royalty_per_copy}/copy)
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>TBD</span>
                    )}
                  </td>

                  <td>
                    <span style={{ fontWeight: 600 }}>{b.total_copies_sold ? b.total_copies_sold.toLocaleString() : 0}</span>
                  </td>

                  <td>
                    <div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{b.total_royalty_earned.toLocaleString()}</span>
                      <div style={{ fontSize: '0.725rem', color: b.royalty_pending > 0 ? '#b45309' : '#64748b' }}>
                        Pending: ₹{b.royalty_pending.toLocaleString()}
                      </div>
                    </div>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {b.last_royalty_payout_date || '—'}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '220px' }}>
                      {b.available_on && b.available_on.length > 0 ? (
                        b.available_on.map((ch, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              background: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            {ch}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pending setup</span>
                      )}
                    </div>
                  </td>

                  <td>
                    <button
                      onClick={() => onSelectBookForQuery(b.book_id)}
                      className="btn btn-secondary btn-sm"
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

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../Common/Badge';
import { Search, Flame } from 'lucide-react';

const CATEGORIES = [
  "All",
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry"
];

const PRIORITIES = ["All", "Critical", "High", "Medium", "Low"];
const STATUSES = ["All", "Open", "In Progress", "Resolved", "Closed"];

export function TicketQueue({ onSelectTicket, selectedTicketId }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('urgent_first');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await api.getTickets({
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        search: searchQuery,
        sortBy
      });
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch ticket queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    const eventSource = api.subscribeSSE((event, data) => {
      fetchQueue();
    });

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [statusFilter, categoryFilter, priorityFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQueue();
  };

  const openCount = tickets.filter(t => t.status === 'Open').length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;

  return (
    <div className="clean-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div className="clean-card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Global Support Queue</h2>
          <p style={{ fontSize: '0.775rem', color: '#64748b' }}>
            Incoming author queries with automatic AI classification and priority routing
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.2rem 0.55rem',
            borderRadius: '4px',
            background: '#e0f2fe',
            color: '#0369a1'
          }}>
            Open: {openCount}
          </span>
          {criticalCount > 0 && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
              background: '#ffe4e6',
              color: '#be123c',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Flame size={12} /> Critical Unresolved: {criticalCount}
            </span>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '0.65rem',
        alignItems: 'center'
      }}>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '1.9rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem 0.4rem 1.9rem' }}
            placeholder="Search author, book, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <select
          className="form-control"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map(s => <option key={s} value={s}>Status: {s}</option>)}
        </select>

        <select
          className="form-control"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>Category: {c}</option>)}
        </select>

        <select
          className="form-control"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          {PRIORITIES.map(p => <option key={p} value={p}>Priority: {p}</option>)}
        </select>

        <select
          className="form-control"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="urgent_first">Sort: Urgent & Oldest First</option>
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
          Updating queue...
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
          No support tickets match the selected filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="clean-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>ID</th>
                <th>Author & Book</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                const isCritical = (t.priority === 'Critical') && t.status !== 'Resolved' && t.status !== 'Closed';

                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f0fdfa' : '#ffffff',
                      borderLeft: isSelected ? '3px solid #0f766e' : isCritical ? '3px solid #f43f5e' : '3px solid transparent'
                    }}
                  >
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.785rem', fontWeight: 600, color: '#0f766e' }}>
                        {t.id}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                        {t.author_name}
                      </div>
                      {t.book_title && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {t.book_title}
                        </div>
                      )}
                    </td>

                    <td style={{ maxWidth: '300px' }}>
                      <div style={{
                        fontWeight: 500,
                        color: '#0f172a',
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {t.subject}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {t.description}
                      </div>
                    </td>

                    <td>
                      <CategoryBadge category={t.category} />
                    </td>

                    <td>
                      <PriorityBadge priority={t.priority} />
                    </td>

                    <td>
                      <StatusBadge status={t.status} />
                    </td>

                    <td>
                      <span style={{ fontSize: '0.775rem', color: '#64748b' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.id);
                        }}
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      >
                        Workbench
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

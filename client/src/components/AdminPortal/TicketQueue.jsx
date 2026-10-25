import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../Common/Badge';
import {
  Search,
  Filter,
  Flame,
  Clock,
  AlertCircle,
  Inbox,
  ArrowUpDown,
  User,
  BookOpen
} from 'lucide-react';

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

    // SSE real-time subscription
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

  // Queue analytics
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      {/* Queue Metrics Bar */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Global Ticket Queue</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real-time author support tickets triaged with AI classification & priority scoring
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(2, 132, 199, 0.12)',
            border: '1px solid rgba(2, 132, 199, 0.3)',
            fontSize: '0.775rem',
            color: '#38bdf8',
            fontWeight: 600
          }}>
            <Inbox size={14} />
            <span>Open: {openCount}</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '0.775rem',
            color: '#fbbf24',
            fontWeight: 600
          }}>
            <Clock size={14} />
            <span>In Progress: {inProgressCount}</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: criticalCount > 0 ? 'rgba(244, 63, 94, 0.18)' : 'rgba(255, 255, 255, 0.05)',
            border: criticalCount > 0 ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
            fontSize: '0.775rem',
            color: criticalCount > 0 ? '#fb7185' : 'var(--text-dim)',
            fontWeight: 700
          }}>
            <Flame size={14} />
            <span>Critical Unresolved: {criticalCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        alignItems: 'center'
      }}>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2rem', fontSize: '0.825rem' }}
            placeholder="Search tickets, author, book..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Status Filter */}
        <div>
          <select
            className="form-control"
            style={{ fontSize: '0.825rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUSES.map(s => <option key={s} value={s}>Status: {s}</option>)}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            className="form-control"
            style={{ fontSize: '0.825rem' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>Category: {c}</option>)}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            className="form-control"
            style={{ fontSize: '0.825rem' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            {PRIORITIES.map(p => <option key={p} value={p}>Priority: {p}</option>)}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <select
            className="form-control"
            style={{ fontSize: '0.825rem' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="urgent_first">🚨 Urgent & Oldest First</option>
            <option value="newest">🕒 Newest First</option>
            <option value="oldest">⏳ Oldest First</option>
          </select>
        </div>
      </div>

      {/* Ticket List Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-dim)' }}>
          Updating ticket queue...
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-dim)' }}>
          No support tickets match the selected filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>Ticket ID</th>
                <th>Author & Book</th>
                <th>Subject & Query</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Received</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                const isUrgent = (t.priority === 'Critical' || t.priority === 'High') && t.status !== 'Resolved' && t.status !== 'Closed';

                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(16, 185, 129, 0.1)'
                        : isUrgent
                        ? 'rgba(244, 63, 94, 0.04)'
                        : 'transparent',
                      borderLeft: isSelected
                        ? '3px solid var(--primary-500)'
                        : isUrgent
                        ? '3px solid #fb7185'
                        : '3px solid transparent'
                    }}
                  >
                    {/* ID */}
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.785rem',
                        fontWeight: 700,
                        color: isUrgent ? '#fb7185' : 'var(--primary-400)'
                      }}>
                        {t.id}
                      </span>
                    </td>

                    {/* Author & Book */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <User size={13} color="var(--text-dim)" />
                        {t.author_name}
                      </div>
                      {t.book_title && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                          <BookOpen size={12} color="var(--text-dim)" />
                          <em>{t.book_title}</em>
                        </div>
                      )}
                    </td>

                    {/* Subject */}
                    <td style={{ maxWidth: '320px' }}>
                      <div style={{
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {t.subject}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '0.15rem'
                      }}>
                        {t.description}
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <CategoryBadge category={t.category} />
                    </td>

                    {/* Priority */}
                    <td>
                      <PriorityBadge priority={t.priority} />
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={t.status} />
                    </td>

                    {/* Received Date */}
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Action */}
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.id);
                        }}
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        Open Workbench
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

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MyBooks } from './MyBooks';
import { SubmitTicket } from './SubmitTicket';
import { MyTickets } from './MyTickets';
import { BookOpen, PlusCircle, MessageSquare } from 'lucide-react';

export function AuthorDashboard() {
  const { user, author } = useAuth();
  const [activeTab, setActiveTab] = useState('books'); // 'books' | 'submit' | 'tickets'
  const [preselectedBookId, setPreselectedBookId] = useState(null);

  const handleSelectBookForQuery = (bookId) => {
    setPreselectedBookId(bookId);
    setActiveTab('submit');
  };

  const handleTicketCreated = () => {
    setActiveTab('tickets');
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.75rem 2rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Author Workspace
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Author ID: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-300)' }}>{user?.author_id}</code> • {author?.city || 'India'} • Member since {author?.joined_date || '2023'}
          </p>
        </div>

        {/* Tab Navigation Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.7)', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => { setActiveTab('books'); setPreselectedBookId(null); }}
            className={`btn btn-sm ${activeTab === 'books' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <BookOpen size={14} />
            <span>My Books</span>
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`btn btn-sm ${activeTab === 'submit' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <PlusCircle size={14} />
            <span>Submit Query</span>
          </button>
          <button
            onClick={() => { setActiveTab('tickets'); setPreselectedBookId(null); }}
            className={`btn btn-sm ${activeTab === 'tickets' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <MessageSquare size={14} />
            <span>My Tickets</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'books' && (
        <MyBooks
          authorId={user?.author_id}
          onSelectBookForQuery={handleSelectBookForQuery}
        />
      )}

      {activeTab === 'submit' && (
        <SubmitTicket
          authorId={user?.author_id}
          initialBookId={preselectedBookId}
          onTicketCreated={handleTicketCreated}
        />
      )}

      {activeTab === 'tickets' && (
        <MyTickets
          authorId={user?.author_id}
          onSwitchToSubmit={() => setActiveTab('submit')}
        />
      )}
    </div>
  );
}

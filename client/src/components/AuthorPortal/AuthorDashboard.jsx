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
      {/* Simple Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
          Welcome back, {user?.name}
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
          Author ID: <code style={{ fontFamily: 'var(--font-mono)', color: '#0f766e', background: '#f0fdfa', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{user?.author_id}</code> • {author?.city || 'India'} • Member since {author?.joined_date || '2023'}
        </p>
      </div>

      {/* Clean Human Tab Bar (Like GitHub / Linear) */}
      <nav className="sub-nav">
        <button
          onClick={() => { setActiveTab('books'); setPreselectedBookId(null); }}
          className={`sub-nav-item ${activeTab === 'books' ? 'active' : ''}`}
        >
          <BookOpen size={16} />
          <span>My Books</span>
        </button>
        <button
          onClick={() => setActiveTab('submit')}
          className={`sub-nav-item ${activeTab === 'submit' ? 'active' : ''}`}
        >
          <PlusCircle size={16} />
          <span>Submit Support Query</span>
        </button>
        <button
          onClick={() => { setActiveTab('tickets'); setPreselectedBookId(null); }}
          className={`sub-nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
        >
          <MessageSquare size={16} />
          <span>My Tickets</span>
        </button>
      </nav>

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

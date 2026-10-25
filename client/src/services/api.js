/**
 * BookLeaf API Client Service & Real-Time SSE Connector
 */

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('bookleaf_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  getMe: () => request('/auth/me'),
  getDemoUsers: () => request('/auth/demo-users'),
  seedDatabase: () => request('/auth/seed', { method: 'POST' }),

  // Authors & Books
  getAuthors: () => request('/authors'),
  getAuthor: (id) => request(`/authors/${id}`),
  getAuthorBooks: (id) => request(`/authors/${id}/books`),
  getAuthorMetrics: (id) => request(`/authors/${id}/metrics`),
  getBooks: () => request('/books'),
  getBook: (id) => request(`/books/${id}`),

  // Tickets
  getTickets: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.priority && filters.priority !== 'All') params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    const qs = params.toString();
    return request(`/tickets${qs ? `?${qs}` : ''}`);
  },
  getTicket: (id) => request(`/tickets/${id}`),
  createTicket: (ticketData) => request('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData)
  }),
  updateTicket: (id, updates) => request(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),
  addMessage: (id, messageData) => request(`/tickets/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(messageData)
  }),
  addInternalNote: (id, noteData) => request(`/tickets/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify(noteData)
  }),
  generateAiDraft: (id) => request(`/tickets/${id}/ai-draft`, {
    method: 'POST'
  }),

  // Real-Time SSE Subscription
  subscribeSSE: (onEvent, onError) => {
    const token = localStorage.getItem('bookleaf_token');
    if (!token) return null;

    const eventSource = new EventSource(`${API_BASE}/tickets/events?token=${token}`);

    eventSource.addEventListener('TICKET_CREATED', (e) => {
      try { onEvent('TICKET_CREATED', JSON.parse(e.data)); } catch (err) {}
    });

    eventSource.addEventListener('TICKET_UPDATED', (e) => {
      try { onEvent('TICKET_UPDATED', JSON.parse(e.data)); } catch (err) {}
    });

    eventSource.addEventListener('NEW_MESSAGE', (e) => {
      try { onEvent('NEW_MESSAGE', JSON.parse(e.data)); } catch (err) {}
    });

    eventSource.addEventListener('INTERNAL_NOTE_ADDED', (e) => {
      try { onEvent('INTERNAL_NOTE_ADDED', JSON.parse(e.data)); } catch (err) {}
    });

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return eventSource;
  }
};

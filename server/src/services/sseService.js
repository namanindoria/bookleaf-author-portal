/**
 * Server-Sent Events (SSE) Service for Real-Time Updates
 * 
 * Provides live bi-directional notifications across Author and Admin portals:
 * - Ticket created
 * - Status updated
 * - New message/reply sent
 * - Internal note added (broadcast only to admins)
 */

class SSEService {
  constructor() {
    this.clients = new Set();
  }

  /**
   * Register a new client connection
   */
  addClient(req, res) {
    const user = req.user; // populated by auth middleware
    const clientId = `${user.role}_${user.id}_${Date.now()}`;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, role: user.role })}\n\n`);

    const client = {
      id: clientId,
      user,
      res
    };

    this.clients.add(client);

    // Heartbeat every 25 seconds to keep connection alive through proxies
    const heartbeatTimer = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeatTimer);
      this.clients.delete(client);
    });
  }

  /**
   * Broadcast an event to matching clients
   * @param {string} eventName
   * @param {object} payload
   * @param {object} targetFilter { role, authorId }
   */
  broadcast(eventName, payload, targetFilter = {}) {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;

    for (const client of this.clients) {
      const u = client.user;

      // Role filter check
      if (targetFilter.role && targetFilter.role !== u.role) {
        continue;
      }

      // If targeting a specific author, only send to that author or any admin
      if (targetFilter.authorId && u.role === 'author' && u.author_id !== targetFilter.authorId) {
        continue;
      }

      try {
        client.res.write(message);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  /**
   * Convenience helpers
   */
  notifyTicketCreated(ticket) {
    this.broadcast('TICKET_CREATED', ticket);
  }

  notifyTicketUpdated(ticket) {
    this.broadcast('TICKET_UPDATED', ticket);
  }

  notifyNewMessage(ticketId, message, authorId) {
    this.broadcast('NEW_MESSAGE', { ticketId, message }, { authorId });
  }

  notifyInternalNote(ticketId, note) {
    // Strictly broadcast internal notes only to admins!
    this.broadcast('INTERNAL_NOTE_ADDED', { ticketId, note }, { role: 'admin' });
  }
}

module.exports = new SSEService();

/**
 * Database Data Access Layer
 * Encapsulates all SQL queries for Authors, Books, Users, Tickets, Messages, and Internal Notes.
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

class DBService {
  // -------------------------------------------------------------
  // USERS & AUTH
  // -------------------------------------------------------------
  getUserByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  }

  getUserById(id) {
    return db.prepare('SELECT id, email, name, role, author_id, created_at FROM users WHERE id = ?').get(id);
  }

  getAllUsers() {
    return db.prepare('SELECT id, email, name, role, author_id, created_at FROM users ORDER BY role DESC, name ASC').all();
  }

  createUser({ id = uuidv4(), email, name, password, role, author_id = null }) {
    const password_hash = bcrypt.hashSync(password, 10);
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role, author_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, email.toLowerCase(), name, password_hash, role, author_id);
    return this.getUserById(id);
  }

  // -------------------------------------------------------------
  // AUTHORS & BOOKS
  // -------------------------------------------------------------
  getAllAuthors() {
    return db.prepare(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM books b WHERE b.author_id = a.author_id) AS total_books,
        (SELECT COALESCE(SUM(b.total_royalty_earned), 0) FROM books b WHERE b.author_id = a.author_id) AS total_royalty_earned,
        (SELECT COALESCE(SUM(b.royalty_pending), 0) FROM books b WHERE b.author_id = a.author_id) AS total_royalty_pending
      FROM authors a
      ORDER BY a.name ASC
    `).all();
  }

  getAuthorById(author_id) {
    return db.prepare('SELECT * FROM authors WHERE author_id = ?').get(author_id);
  }

  getBooksByAuthor(author_id) {
    const books = db.prepare('SELECT * FROM books WHERE author_id = ? ORDER BY publication_date DESC, title ASC').all(author_id);
    return books.map(b => ({
      ...b,
      available_on: b.available_on ? JSON.parse(b.available_on) : []
    }));
  }

  getBookById(book_id) {
    const book = db.prepare('SELECT * FROM books WHERE book_id = ?').get(book_id);
    if (!book) return null;
    return {
      ...book,
      available_on: book.available_on ? JSON.parse(book.available_on) : []
    };
  }

  getAuthorMetrics(author_id) {
    const books = this.getBooksByAuthor(author_id);
    const totalBooks = books.length;
    const publishedBooks = books.filter(b => b.status === 'Published & Live').length;
    const inProductionBooks = books.filter(b => b.status.startsWith('In Production')).length;
    const totalCopiesSold = books.reduce((sum, b) => sum + (b.total_copies_sold || 0), 0);
    const totalRoyaltyEarned = books.reduce((sum, b) => sum + (b.total_royalty_earned || 0), 0);
    const totalRoyaltyPaid = books.reduce((sum, b) => sum + (b.royalty_paid || 0), 0);
    const totalRoyaltyPending = books.reduce((sum, b) => sum + (b.royalty_pending || 0), 0);

    return {
      totalBooks,
      publishedBooks,
      inProductionBooks,
      totalCopiesSold,
      totalRoyaltyEarned,
      totalRoyaltyPaid,
      totalRoyaltyPending
    };
  }

  // -------------------------------------------------------------
  // TICKETS
  // -------------------------------------------------------------
  createTicket({
    author_id,
    book_id = null,
    subject,
    description,
    category,
    category_ai,
    priority,
    priority_ai,
    priority_reasoning = '',
    attachment_url = null,
    attachment_name = null
  }) {
    const id = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tickets (
        id, author_id, book_id, subject, description,
        category, category_ai, priority, priority_ai, priority_reasoning,
        status, attachment_url, attachment_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?, ?, ?, ?)
    `).run(
      id, author_id, book_id, subject, description,
      category, category_ai, priority, priority_ai, priority_reasoning,
      attachment_url, attachment_name, now, now
    );

    // Automatically record author's initial description as the first message thread item
    const author = this.getAuthorById(author_id);
    this.addMessage({
      ticket_id: id,
      sender_id: author_id,
      sender_name: author ? author.name : 'Author',
      sender_role: 'author',
      message: description,
      attachment_url,
      attachment_name,
      created_at: now
    });

    return this.getTicketById(id);
  }

  getTicketById(id) {
    const ticket = db.prepare(`
      SELECT t.*, 
        a.name AS author_name, a.email AS author_email, a.phone AS author_phone, a.city AS author_city,
        b.title AS book_title, b.isbn AS book_isbn, b.status AS book_status,
        b.total_copies_sold, b.royalty_pending, b.last_royalty_payout_date
      FROM tickets t
      LEFT JOIN authors a ON a.author_id = t.author_id
      LEFT JOIN books b ON b.book_id = t.book_id
      WHERE t.id = ?
    `).get(id);

    if (!ticket) return null;

    ticket.messages = db.prepare(`
      SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC
    `).all(id);

    ticket.notes = db.prepare(`
      SELECT * FROM ticket_internal_notes WHERE ticket_id = ? ORDER BY created_at ASC
    `).all(id);

    ticket.latest_ai_draft = db.prepare(`
      SELECT * FROM ticket_ai_drafts WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(id);

    return ticket;
  }

  listTickets({ author_id = null, status = null, category = null, priority = null, search = null, sortBy = 'urgent_first' }) {
    let query = `
      SELECT t.*, 
        a.name AS author_name, a.email AS author_email,
        b.title AS book_title
      FROM tickets t
      LEFT JOIN authors a ON a.author_id = t.author_id
      LEFT JOIN books b ON b.book_id = t.book_id
      WHERE 1=1
    `;
    const params = [];

    if (author_id) {
      query += ` AND t.author_id = ?`;
      params.push(author_id);
    }
    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }
    if (category) {
      query += ` AND t.category = ?`;
      params.push(category);
    }
    if (priority) {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }
    if (search) {
      query += ` AND (t.id LIKE ? OR t.subject LIKE ? OR t.description LIKE ? OR a.name LIKE ? OR b.title LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    // Sort order
    if (sortBy === 'urgent_first') {
      // Prioritize Critical, High, then oldest unresolved first
      query += `
        ORDER BY 
          CASE t.status WHEN 'Open' THEN 1 WHEN 'In Progress' THEN 2 WHEN 'Resolved' THEN 3 WHEN 'Closed' THEN 4 ELSE 5 END ASC,
          CASE t.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 ELSE 5 END ASC,
          t.created_at ASC
      `;
    } else if (sortBy === 'newest') {
      query += ` ORDER BY t.created_at DESC`;
    } else if (sortBy === 'oldest') {
      query += ` ORDER BY t.created_at ASC`;
    } else {
      query += ` ORDER BY t.updated_at DESC`;
    }

    return db.prepare(query).all(...params);
  }

  updateTicket(id, updates) {
    const allowed = ['status', 'category', 'priority', 'assigned_to', 'assigned_name'];
    const sets = [];
    const params = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(updates[key]);
      }
    }

    if (sets.length === 0) return this.getTicketById(id);

    sets.push(`updated_at = ?`);
    params.push(new Date().toISOString());
    params.push(id);

    db.prepare(`UPDATE tickets SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.getTicketById(id);
  }

  // -------------------------------------------------------------
  // MESSAGES & NOTES
  // -------------------------------------------------------------
  addMessage({ ticket_id, sender_id, sender_name, sender_role, message, attachment_url = null, attachment_name = null, created_at = new Date().toISOString() }) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_name, sender_role, message, attachment_url, attachment_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, ticket_id, sender_id, sender_name, sender_role, message, attachment_url, attachment_name, created_at);

    // Update ticket updated_at and move Open to In Progress if admin responded
    const now = new Date().toISOString();
    if (sender_role === 'admin') {
      db.prepare(`
        UPDATE tickets 
        SET updated_at = ?, status = CASE WHEN status = 'Open' THEN 'In Progress' ELSE status END
        WHERE id = ?
      `).run(now, ticket_id);
    } else {
      db.prepare(`UPDATE tickets SET updated_at = ? WHERE id = ?`).run(now, ticket_id);
    }

    return db.prepare('SELECT * FROM ticket_messages WHERE id = ?').get(id);
  }

  addInternalNote({ ticket_id, author_user_id, author_name, note }) {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO ticket_internal_notes (id, ticket_id, author_user_id, author_name, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, ticket_id, author_user_id, author_name, note, now);

    db.prepare(`UPDATE tickets SET updated_at = ? WHERE id = ?`).run(now, ticket_id);
    return db.prepare('SELECT * FROM ticket_internal_notes WHERE id = ?').get(id);
  }

  saveAiDraft({ ticket_id, draft_text, model_used = 'ai-assistant', tokens_used = 0 }) {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO ticket_ai_drafts (id, ticket_id, draft_text, model_used, tokens_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, ticket_id, draft_text, model_used, tokens_used, now);
    return db.prepare('SELECT * FROM ticket_ai_drafts WHERE id = ?').get(id);
  }

  // -------------------------------------------------------------
  // SEED & RESET
  // -------------------------------------------------------------
  seedDatabase() {
    const sampleDataPath = path.resolve(__dirname, '../../data/bookleaf_sample_data.json');
    if (!fs.existsSync(sampleDataPath)) {
      throw new Error(`Sample data file not found at ${sampleDataPath}`);
    }
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));

    // Clear existing tables
    db.exec(`
      DELETE FROM ticket_ai_drafts;
      DELETE FROM ticket_internal_notes;
      DELETE FROM ticket_messages;
      DELETE FROM tickets;
      DELETE FROM users;
      DELETE FROM books;
      DELETE FROM authors;
    `);

    // 1. Create Admins
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('ADMIN001', 'admin@bookleaf.in', 'Admin Operations Desk', adminPasswordHash, 'admin');

    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('ADMIN002', 'neha.support@bookleaf.in', 'Neha Sharma (Sr. Support Lead)', adminPasswordHash, 'admin');

    // 2. Insert Authors & Author Users
    const defaultAuthorPassword = bcrypt.hashSync('author123', 10);

    for (const author of sampleData.authors) {
      db.prepare(`
        INSERT INTO authors (author_id, name, email, phone, city, joined_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        author.author_id,
        author.name,
        author.email.toLowerCase(),
        author.phone,
        author.city,
        author.joined_date
      );

      // Create login user account for author
      db.prepare(`
        INSERT INTO users (id, email, name, password_hash, role, author_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `USER_${author.author_id}`,
        author.email.toLowerCase(),
        author.name,
        defaultAuthorPassword,
        'author',
        author.author_id
      );

      // Insert Books
      for (const book of author.books) {
        db.prepare(`
          INSERT INTO books (
            book_id, author_id, title, isbn, genre, publication_date,
            status, mrp, author_royalty_per_copy, total_copies_sold,
            total_royalty_earned, royalty_paid, royalty_pending,
            last_royalty_payout_date, print_partner, available_on
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          book.book_id,
          author.author_id,
          book.title,
          book.isbn,
          book.genre,
          book.publication_date,
          book.status,
          book.mrp,
          book.author_royalty_per_copy,
          book.total_copies_sold,
          book.total_royalty_earned,
          book.royalty_paid,
          book.royalty_pending,
          book.last_royalty_payout_date,
          book.print_partner,
          JSON.stringify(book.available_on || [])
        );
      }
    }

    // 3. Seed Realistic Sample Support Tickets across different categories and edge cases
    this._seedSampleTickets();

    return {
      message: 'Database seeded successfully with 10 authors, 18 books, 2 admin accounts, and realistic support tickets.',
      totalAuthors: sampleData.authors.length,
      totalBooks: db.prepare('SELECT COUNT(*) as count FROM books').get().count,
      totalTickets: db.prepare('SELECT COUNT(*) as count FROM tickets').get().count
    };
  }

  _seedSampleTickets() {
    // Ticket 1: Urgent Overdue Royalty (Critical)
    const t1 = this.createTicket({
      author_id: 'AUTH001', // Priya Sharma
      book_id: 'BK001', // Whispers of the Ganges
      subject: "Haven't received royalty payout for over 4 months",
      description: "Hello, I published 'Whispers of the Ganges' and saw consistent sales, but I still haven't received my quarterly royalty payout for Q3/Q4. My pending royalty shows ₹3,570. What is going on?",
      category: 'Royalty & Payments',
      category_ai: 'Royalty & Payments',
      priority: 'Critical',
      priority_ai: 'Critical',
      priority_reasoning: "Extended royalty delays or severe payment disruptions heavily impact author trust; flagged as Critical for urgent resolution."
    });
    // Add Admin reply to t1
    this.addMessage({
      ticket_id: t1.id,
      sender_id: 'ADMIN002',
      sender_name: 'Neha Sharma (Sr. Support Lead)',
      sender_role: 'admin',
      message: "Hi Priya, thank you for reaching out and I completely understand your frustration. Our royalty disbursements operate on a quarterly schedule with a 45-day window. I've escalated your account directly with our finance team to expedite your pending ₹3,570 transfer within 48 hours."
    });
    this.addInternalNote({
      ticket_id: t1.id,
      author_user_id: 'ADMIN002',
      author_name: 'Neha Sharma',
      note: "Cross-checked with HDFC corporate bank batch. Priya's IFSC code had a missing leading zero. Updated in payroll system, batch queuing for tomorrow morning."
    });

    // Ticket 2: ISBN mismatch on Amazon (Critical)
    const t2 = this.createTicket({
      author_id: 'AUTH002', // Rohit Kapoor
      book_id: 'BK003', // Code & Karma
      subject: "Amazon listing displays incorrect ISBN number",
      description: "My physical book shows ISBN 978-93-5XXXX-03-5, but Amazon India product page lists a totally different ISBN. Readers are confused and reviews are getting disconnected.",
      category: 'ISBN & Metadata Issues',
      category_ai: 'ISBN & Metadata Issues',
      priority: 'Critical',
      priority_ai: 'Critical',
      priority_reasoning: "ISBN mismatches cause serious retail listing and royalty tracking failures; strictly prioritized for immediate 48h escalation."
    });

    // Ticket 3: Defective author copies received (High)
    const t3 = this.createTicket({
      author_id: 'AUTH004', // Vikram Joshi
      book_id: 'BK006', // Debugging Life
      subject: "Author copies arrived with misaligned pages and blurry cover print",
      description: "I received my batch of 10 author copies yesterday. The cover art is blurry and several pages in Chapter 3 are misaligned with text cut off. This is unacceptable for my upcoming book launch event.",
      category: 'Printing & Quality',
      category_ai: 'Printing & Quality',
      priority: 'High',
      priority_ai: 'High',
      priority_reasoning: "Defective print runs require verification for immediate free reprint dispatch."
    });

    // Ticket 4: Book unavailable on Amazon US (High)
    const t4 = this.createTicket({
      author_id: 'AUTH007', // Sneha Kulkarni
      book_id: 'BK011', // The Algorithm of Love
      subject: "Book showing 'Currently Unavailable' on Amazon US store",
      description: "Several US readers messaged me that 'The Algorithm of Love' is showing as unavailable on Amazon.com despite being published since 2022. Please fix this stock issue.",
      category: 'Distribution & Availability',
      category_ai: 'Distribution & Availability',
      priority: 'High',
      priority_ai: 'High',
      priority_reasoning: "Live availability outages on Amazon directly lose sales; requires distribution re-sync."
    });

    // Ticket 5: Book in production status check (Medium)
    const t5 = this.createTicket({
      author_id: 'AUTH009', // Kavita Deshmukh
      book_id: 'BK015', // Raising Roots (In Production)
      subject: "Typesetting timeline update for Raising Roots",
      description: "Hi team, it has been 3 weeks since I submitted my manuscript edits and Raising Roots is still showing 'In Production - Typesetting'. Could you please share an updated timeline?",
      category: 'Book Status & Production Updates',
      category_ai: 'Book Status & Production Updates',
      priority: 'Medium',
      priority_ai: 'Medium',
      priority_reasoning: "Normal operational update or inquiry within standard turnaround windows."
    });

    // Ticket 6: Minor bio update (Low)
    this.createTicket({
      author_id: 'AUTH006', // Arjun Malhotra
      book_id: 'BK010', // Turban Tales
      subject: "Update author bio on BookLeaf store and Amazon",
      description: "Hello, I recently won a local humor essay contest and would love to add two sentences to my author bio on the BookLeaf Store and Amazon author central page.",
      category: 'General Inquiry',
      category_ai: 'General Inquiry',
      priority: 'Low',
      priority_ai: 'Low',
      priority_reasoning: "Standard non-blocking inquiry or minor metadata update."
    });
  }
}

module.exports = new DBService();

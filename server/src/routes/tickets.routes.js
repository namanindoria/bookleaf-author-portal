const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const dbService = require('../services/dbService');
const aiService = require('../services/aiService');
const sseService = require('../services/sseService');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { CATEGORIES, PRIORITIES } = require('../config/knowledgeBase');

// Setup multer storage
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext) || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF documents are supported.'));
    }
  }
});

/**
 * POST /api/tickets/upload
 * Actual file attachment upload handler (Bonus Feature)
 */
router.post('/upload', authenticate, upload.single('attachment'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: true, message: 'No file uploaded.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({
    fileUrl,
    fileName: req.file.originalname,
    sizeBytes: req.file.size,
    mimeType: req.file.mimetype
  });
});

/**
 * GET /api/tickets/events
 * Real-time Server-Sent Events (SSE) stream for ticket synchronization
 */
router.get('/events', authenticate, (req, res) => {
  sseService.addClient(req, res);
});

/**
 * GET /api/tickets
 * List tickets with filtering and role-based access
 */
router.get('/', authenticate, (req, res) => {
  const { status, category, priority, search, sortBy } = req.query;

  const author_id = req.user.role === 'author' ? req.user.author_id : null;

  const tickets = dbService.listTickets({
    author_id,
    status,
    category,
    priority,
    search,
    sortBy: sortBy || 'urgent_first'
  });

  res.json(tickets);
});

/**
 * POST /api/tickets
 * Author creates a new support query
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { book_id, subject, description, attachment_url, attachment_name } = req.body;

    if (!subject || !subject.trim() || !description || !description.trim()) {
      return res.status(400).json({
        error: true,
        message: 'Both subject and description are required.'
      });
    }

    const author_id = req.user.role === 'author' ? req.user.author_id : req.body.author_id;
    if (!author_id) {
      return res.status(400).json({
        error: true,
        message: 'Author identification is required.'
      });
    }

    // Retrieve associated book data if provided
    let book = null;
    let actualBookId = book_id;
    if (book_id && book_id !== 'general' && book_id !== 'General / Account Level') {
      book = dbService.getBookById(book_id);
    } else {
      actualBookId = null;
    }

    // 1. Run AI Auto-Classification & Priority Scoring
    const aiAnalysis = await aiService.classifyAndScoreTicket(
      { subject: subject.trim(), description: description.trim() },
      book
    );

    // 2. Create ticket record in database
    const ticket = dbService.createTicket({
      author_id,
      book_id: actualBookId,
      subject: subject.trim(),
      description: description.trim(),
      category: aiAnalysis.category,
      category_ai: aiAnalysis.category,
      priority: aiAnalysis.priority,
      priority_ai: aiAnalysis.priority,
      priority_reasoning: aiAnalysis.reasoning,
      attachment_url: attachment_url || null,
      attachment_name: attachment_name || null
    });

    // 3. Pre-generate AI draft response in background so it's ready when admin opens it
    const author = dbService.getAuthorById(author_id);
    aiService.generateDraftResponse(ticket, author, book).then(draftResult => {
      dbService.saveAiDraft({
        ticket_id: ticket.id,
        draft_text: draftResult.draft,
        model_used: draftResult.provider,
        tokens_used: draftResult.tokensUsed || 0
      });
    }).catch(err => {
      console.warn('[Background AI Draft Generation Warning]', err.message);
    });

    // 4. Notify connected users in real time via SSE
    sseService.notifyTicketCreated(ticket);

    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tickets/:id
 * Retrieve single ticket details, message thread, and internal notes
 */
router.get('/:id', authenticate, (req, res) => {
  const ticket = dbService.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: true, message: 'Ticket not found.' });
  }

  // RBAC: Authors can only view their own tickets
  if (req.user.role === 'author') {
    if (ticket.author_id !== req.user.author_id) {
      return res.status(403).json({
        error: true,
        message: 'Access denied: you can only view tickets raised by yourself.'
      });
    }

    // Strictly redact internal ops notes and raw AI reasoning for author
    const safeTicket = { ...ticket };
    delete safeTicket.notes;
    delete safeTicket.latest_ai_draft;
    delete safeTicket.priority_reasoning;
    return res.json(safeTicket);
  }

  // Admins receive full view including internal notes and AI draft
  res.json(ticket);
});

/**
 * PATCH /api/tickets/:id
 * Admin updates ticket status, category override, priority override, or assignment
 */
router.patch('/:id', authenticate, requireAdmin, (req, res) => {
  const { status, category, priority, assigned_to, assigned_name } = req.body;

  const ticket = dbService.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: true, message: 'Ticket not found.' });
  }

  if (status && !['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
    return res.status(400).json({ error: true, message: 'Invalid ticket status.' });
  }

  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: true, message: 'Invalid category selection.' });
  }

  if (priority && !PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: true, message: 'Invalid priority selection.' });
  }

  const updatedTicket = dbService.updateTicket(req.params.id, {
    status,
    category,
    priority,
    assigned_to,
    assigned_name
  });

  // Notify real-time subscribers
  sseService.notifyTicketUpdated(updatedTicket);

  res.json(updatedTicket);
});

/**
 * POST /api/tickets/:id/messages
 * Add response/reply (Author or Admin)
 */
router.post('/:id/messages', authenticate, (req, res) => {
  const { message, attachment_url, attachment_name } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: true, message: 'Message content cannot be empty.' });
  }

  const ticket = dbService.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: true, message: 'Ticket not found.' });
  }

  if (req.user.role === 'author' && ticket.author_id !== req.user.author_id) {
    return res.status(403).json({
      error: true,
      message: 'Access denied: you can only respond to your own tickets.'
    });
  }

  const sender_name = req.user.role === 'admin'
    ? `${req.user.name} (BookLeaf Support)`
    : req.user.name;

  const msg = dbService.addMessage({
    ticket_id: ticket.id,
    sender_id: req.user.id,
    sender_name,
    sender_role: req.user.role,
    message: message.trim(),
    attachment_url: attachment_url || null,
    attachment_name: attachment_name || null
  });

  // Notify clients
  sseService.notifyNewMessage(ticket.id, msg, ticket.author_id);
  sseService.notifyTicketUpdated(dbService.getTicketById(ticket.id));

  res.status(201).json(msg);
});

/**
 * POST /api/tickets/:id/notes
 * Admin: Add internal note (hidden from author)
 */
router.post('/:id/notes', authenticate, requireAdmin, (req, res) => {
  const { note } = req.body;

  if (!note || !note.trim()) {
    return res.status(400).json({ error: true, message: 'Internal note cannot be empty.' });
  }

  const ticket = dbService.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: true, message: 'Ticket not found.' });
  }

  const newNote = dbService.addInternalNote({
    ticket_id: ticket.id,
    author_user_id: req.user.id,
    author_name: req.user.name,
    note: note.trim()
  });

  // Broadcast only to admin users
  sseService.notifyInternalNote(ticket.id, newNote);

  res.status(201).json(newNote);
});

/**
 * POST /api/tickets/:id/ai-draft
 * Admin: Request or regenerate an AI drafted response based on KB & ticket context
 */
router.post('/:id/ai-draft', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const ticket = dbService.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: true, message: 'Ticket not found.' });
    }

    const author = dbService.getAuthorById(ticket.author_id);
    let book = null;
    if (ticket.book_id) {
      book = dbService.getBookById(ticket.book_id);
    }

    const aiResult = await aiService.generateDraftResponse(ticket, author, book);

    const savedDraft = dbService.saveAiDraft({
      ticket_id: ticket.id,
      draft_text: aiResult.draft,
      model_used: aiResult.provider,
      tokens_used: aiResult.tokensUsed || 0
    });

    res.json({
      draft: savedDraft.draft_text,
      model: savedDraft.model_used,
      tokensUsed: savedDraft.tokens_used,
      createdAt: savedDraft.created_at
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

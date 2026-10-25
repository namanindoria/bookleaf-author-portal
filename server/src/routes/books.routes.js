const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/books
 * List books (Authors get their own books; Admins get all books)
 */
router.get('/', authenticate, (req, res) => {
  if (req.user.role === 'author') {
    const books = dbService.getBooksByAuthor(req.user.author_id);
    return res.json(books);
  }

  // Admin access
  const authors = dbService.getAllAuthors();
  let allBooks = [];
  for (const author of authors) {
    const books = dbService.getBooksByAuthor(author.author_id);
    allBooks = allBooks.concat(books);
  }
  res.json(allBooks);
});

/**
 * GET /api/books/:id
 * Get single book details
 */
router.get('/:id', authenticate, (req, res) => {
  const book = dbService.getBookById(req.params.id);
  if (!book) {
    return res.status(404).json({ error: true, message: 'Book not found.' });
  }

  if (req.user.role === 'author' && book.author_id !== req.user.author_id) {
    return res.status(403).json({
      error: true,
      message: 'Access denied: you do not have permission to view this title.'
    });
  }

  res.json(book);
});

module.exports = router;

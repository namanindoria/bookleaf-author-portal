const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

/**
 * GET /api/authors
 * Admin: List all authors with aggregate metrics
 */
router.get('/', authenticate, requireAdmin, (req, res) => {
  const authors = dbService.getAllAuthors();
  res.json(authors);
});

/**
 * GET /api/authors/:id
 * Get single author details (Author can only access self; Admin can access any)
 */
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'author' && req.user.author_id !== id) {
    return res.status(403).json({
      error: true,
      message: 'Access denied: authors can only view their own account profile.'
    });
  }

  const author = dbService.getAuthorById(id);
  if (!author) {
    return res.status(404).json({ error: true, message: 'Author not found.' });
  }

  res.json(author);
});

/**
 * GET /api/authors/:id/books
 * Get author's published/in-production books with sales & royalty figures
 */
router.get('/:id/books', authenticate, (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'author' && req.user.author_id !== id) {
    return res.status(403).json({
      error: true,
      message: 'Access denied: authors can only view their own books.'
    });
  }

  const books = dbService.getBooksByAuthor(id);
  res.json(books);
});

/**
 * GET /api/authors/:id/metrics
 * Get aggregate KPI metrics for dashboard cards
 */
router.get('/:id/metrics', authenticate, (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'author' && req.user.author_id !== id) {
    return res.status(403).json({
      error: true,
      message: 'Access denied: authors can only view their own metrics.'
    });
  }

  const metrics = dbService.getAuthorMetrics(id);
  res.json(metrics);
});

module.exports = router;

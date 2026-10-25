const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dbService = require('../services/dbService');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Simple email/password login
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: 'Both email and password are required.'
    });
  }

  const user = dbService.getUserByEmail(email.trim());
  if (!user) {
    return res.status(401).json({
      error: true,
      message: 'Invalid email or password.'
    });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({
      error: true,
      message: 'Invalid email or password.'
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, author_id: user.author_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  let author = null;
  if (user.role === 'author' && user.author_id) {
    author = dbService.getAuthorById(user.author_id);
  }

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      author_id: user.author_id
    },
    author
  });
});

/**
 * GET /api/auth/me
 * Get currently authenticated profile
 */
router.get('/me', authenticate, (req, res) => {
  let author = null;
  if (req.user.role === 'author' && req.user.author_id) {
    author = dbService.getAuthorById(req.user.author_id);
  }

  res.json({
    user: req.user,
    author
  });
});

/**
 * GET /api/auth/demo-users
 * Provides demo accounts for rapid testing & evaluation
 */
router.get('/demo-users', (req, res) => {
  const users = dbService.getAllUsers();
  res.json({
    admins: users.filter(u => u.role === 'admin'),
    authors: users.filter(u => u.role === 'author').slice(0, 10),
    defaultPassword: 'password is author123 for authors, admin123 for admins'
  });
});

/**
 * POST /api/auth/seed
 * Resets database to sample data
 */
router.post('/seed', (req, res) => {
  try {
    const result = dbService.seedDatabase();
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: true,
      message: 'Failed to seed database: ' + err.message
    });
  }
});

module.exports = router;

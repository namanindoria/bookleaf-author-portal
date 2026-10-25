const jwt = require('jsonwebtoken');
const dbService = require('../services/dbService');

const JWT_SECRET = process.env.JWT_SECRET || 'bookleaf_jwt_secure_secret_key_2026_dev_key';

function authenticate(req, res, next) {
  // Support Bearer header or token query parameter (essential for EventSource SSE)
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Authentication token missing. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = dbService.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid session: user no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: true,
      message: 'Invalid or expired session token.',
      details: err.message
    });
  }
}

module.exports = {
  authenticate,
  JWT_SECRET
};

/**
 * Role-Based Access Control Middleware
 */

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: true, message: 'Unauthorized. Please authenticate.' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        error: true,
        message: `Forbidden: this action requires '${role}' privilege. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
}

function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

function requireAuthor(req, res, next) {
  return requireRole('author')(req, res, next);
}

module.exports = {
  requireRole,
  requireAdmin,
  requireAuthor
};

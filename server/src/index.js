require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const dbService = require('./services/dbService');
const authRoutes = require('./routes/auth.routes');
const authorRoutes = require('./routes/authors.routes');
const bookRoutes = require('./routes/books.routes');
const ticketRoutes = require('./routes/tickets.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory for optional attachments
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Swagger OpenAPI documentation
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'BookLeaf Portal API Docs'
  }));
  app.get('/api/docs.json', (req, res) => res.json(swaggerDocument));
} catch (err) {
  console.warn('[Swagger] Notice: Could not mount Swagger docs:', err.message);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BookLeaf Author Support Portal API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/tickets', ticketRoutes);

// 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Ensure initial database seed if empty
try {
  const authorCount = dbService.getAllAuthors().length;
  if (authorCount === 0) {
    console.log('[Database] No authors found. Auto-seeding initial dataset...');
    dbService.seedDatabase();
    console.log('[Database] Seed completed successfully.');
  }
} catch (err) {
  console.error('[Database Seed Error]', err);
}

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 BookLeaf Support API Server running on port ${PORT}`);
  console.log(`📚 Swagger Docs: http://localhost:${PORT}/api/docs`);
  console.log(`⚡ Real-Time SSE: http://localhost:${PORT}/api/tickets/events`);
  console.log(`====================================================`);
});

module.exports = app;

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { connectDB } = require('./db/connection');

const app = express();

// Enable compression for all responses
app.use(compression());

// Middleware
const requestIdMiddleware = require('./middleware/requestId');
app.use(requestIdMiddleware);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_PREVIEW_URLS || '')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      // Allow localhost dev or backend health checks
      return callback(null, true);
    }
    
    // In development mode, allow local frontend servers
    if (process.env.NODE_ENV !== 'production') {
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight health check endpoint (for Render uptime pings)
// Returns immediately without checking database
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// MongoDB connection - start in background (non-blocking)
// Server will start even if DB connection is still establishing
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/linkedin', require('./routes/linkedin'));
app.use('/api/master-dashboard', require('./routes/master-dashboard'));
app.use('/api/company-analysis', require('./routes/company-analysis'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/admin', require('./routes/admin'));

// Detailed health check endpoint (includes database status)
app.get('/api/health', (req, res) => {
  const { isDBConnected } = require('./db/connection');
  res.json({ 
    status: 'OK',
    database: isDBConnected() ? 'Connected' : 'Disconnected'
  });
});

// Global Error Handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const { csrfSync } = require('csrf-sync');
const rateLimit = require('express-rate-limit');
const flash = require('connect-flash');
const path = require('path');
const sequelize = require('./config/database');
const { setLocals } = require('./middleware/authMiddleware');
const logger = require('./utils/logger');

// Setup CSRF Protection
const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => {
    return (req.body && req.body['_csrf']) || req.query['_csrf'] || req.headers['x-csrf-token'];
  }
});

const app = express();

// Security Middlewares
// Use Helmet for secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));

// Apply Rate Limiting to prevent Brute Force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased limit for easier testing/development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Express config
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Management (OWASP ASVS V2 / A2)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevents XSS accessing cookie
    secure: process.env.NODE_ENV === 'production', // Use secure cookies over HTTPS
    maxAge: 3600000 // 1 hour session timeout
  }
}));

app.use(flash());

// Apply CSRF Protection to all state-changing routes
app.use((req, res, next) => {
  // We only require CSRF token for POST/PUT/DELETE
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return csrfSynchronisedProtection(req, res, next);
  }
  next();
});

// Generate CSRF Token for views
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req, true); // true = overwrite
  next();
});

// Make user available to all templates
app.use(setLocals);

// Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/admin', adminRoutes);
app.use('/profile', profileRoutes);

// Root Redirect
app.get('/', (req, res) => {
  res.redirect('/tasks');
});

// Custom 404 Handler
app.use((req, res, next) => {
  res.status(404).render('error', { status: 404, message: 'Page Not Found' });
});

// Global Error Handler (OWASP ASVS V7 - No Stack Traces Exposed)
app.use((err, req, res, next) => {
  logger.error(`Unhandled Exception: ${err.message}`);
  // Do not send err.stack to the client
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('error', { status: 403, message: 'Form tampered with (CSRF attack detected)' });
  }
  res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

// Sync Database and Start Server
sequelize.sync({ force: false }).then(() => {
  logger.info('Database synced successfully.');
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server started on http://localhost:${PORT}`);
  });
}).catch(err => {
  logger.error('Database connection failed:', err);
});

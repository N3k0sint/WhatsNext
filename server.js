require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const lusca = require('lusca');
const rateLimit = require('express-rate-limit');
const flash = require('connect-flash');
const path = require('path');
const sequelize = require('./config/database');
const { setLocals } = require('./middleware/authMiddleware');
const logger = require('./utils/logger');

// Setup CSRF Protection
// CSRF Configuration handled by lusca directly

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

// Copy CSRF token from query parameters to headers for multipart/form-data upload compatibility
app.use((req, res, next) => {
  if (req.query && req.query._csrf) {
    // Replace space characters with '+' since URL query parser converts '+' to a space
    const token = req.query._csrf.replace(/ /g, '+');
    req.headers['x-csrf-token'] = token;
  }
  next();
});

// Apply CSRF Protection
app.use(lusca.csrf());

// Map lusca's _csrf token to csrfToken for our existing views
app.use((req, res, next) => {
  res.locals.csrfToken = res.locals._csrf;
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
  if (err.code === 'EBADCSRFTOKEN' || err.message === 'CSRF token mismatch') {
    const reqToken = (req.body && req.body._csrf) || req.headers['x-csrf-token'] || (req.query && req.query._csrf);
    const sessToken = req.session ? req.session._csrf : 'No Session';
    logger.warn(`CSRF Token Mismatch! Request token: ${reqToken}. Session token: ${sessToken}`);
    return res.status(403).render('error', { status: 403, message: 'Form tampered with (CSRF attack detected)' });
  }
  if (err.status === 403) {
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

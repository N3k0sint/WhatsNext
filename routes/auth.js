const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const { strictLimiter, generalLimiter } = require('../middleware/rateLimiter');

// GET Registration
router.get('/register', generalLimiter, (req, res) => {
  res.render('register', { errors: [] });
});

// POST Registration
router.post('/register', strictLimiter, [
  body('username').trim().isLength({ min: 3, max: 50 }).escape().withMessage('Username must be 3-50 characters.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('register', { errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.render('register', { errors: [{ msg: 'Username already exists' }] });
    }

    // Creating first user as admin for demonstration purposes
    const count = await User.count();
    const role = count === 0 ? 'admin' : 'user';

    await User.create({ username, password, role });
    
    req.flash('success', 'Registration successful! You can now log in.');
    res.redirect('/auth/login');
  } catch (err) {
    logger.error(`Registration error: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
  }
});

// GET Login
router.get('/login', generalLimiter, (req, res) => {
  res.render('login', { errors: [] });
});

// POST Login
router.post('/login', strictLimiter, [
  body('username').trim().escape().notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user || !(await user.validPassword(password))) {
      await AuditLog.create({
        action: 'FAILED_LOGIN',
        details: 'Invalid credentials provided',
        username: username,
        ipAddress: req.ip
      });
      logger.warn(`Failed login attempt for username: ${username} from IP: ${req.ip}`);
      return res.render('login', { errors: [{ msg: 'Invalid username or password' }] });
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.user = { id: user.id, username: user.username, role: user.role };

    await AuditLog.create({
      action: 'SUCCESSFUL_LOGIN',
      details: 'User logged in successfully',
      username: username,
      ipAddress: req.ip
    });

    req.flash('success', `Welcome back, ${user.username}!`);
    res.redirect('/tasks');
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
  }
});

// GET Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) logger.error(`Logout error: ${err.message}`);
    res.redirect('/auth/login');
  });
});

module.exports = router;

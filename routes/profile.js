const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

// Local rate limiters to ensure Snyk Code static resolution
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const profileStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many sensitive requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(isAuthenticated);

// GET Profile Page
router.get('/', profileLimiter, async (req, res) => {
  res.render('profile', { errors: [] });
});

// POST Edit Username
router.post('/edit', profileStrictLimiter, [
  body('username').trim().isLength({ min: 3, max: 50 }).escape().withMessage('Username must be 3-50 characters.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('profile', { errors: errors.array() });
  }

  const { username } = req.body;

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.status(404).render('error', { status: 404, message: 'User not found' });

    if (username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) {
        return res.render('profile', { errors: [{ msg: 'Username is already taken' }] });
      }

      await user.update({ username });
      
      // Update session
      req.session.user.username = username;

      await AuditLog.create({
        action: 'PROFILE_UPDATED',
        details: `User updated username to ${username}`,
        username: username,
        ipAddress: req.ip
      });

      req.flash('success', 'Username updated successfully!');
      return res.redirect('/profile');
    }
    
    req.flash('success', 'No changes made.');
    res.redirect('/profile');
  } catch (err) {
    logger.error(`Profile edit error: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
  }
});

// POST Change Password
router.post('/password', profileStrictLimiter, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('New password must include at least one uppercase letter, one lowercase letter, one number, and one special character.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('profile', { errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.status(404).render('error', { status: 404, message: 'User not found' });

    const isValid = await user.validPassword(currentPassword);
    if (!isValid) {
      await AuditLog.create({
        action: 'PASSWORD_CHANGE_FAILED',
        details: 'User provided incorrect current password during password change attempt',
        username: user.username,
        ipAddress: req.ip
      });
      return res.render('profile', { errors: [{ msg: 'Incorrect current password.' }] });
    }

    // Hash and update password
    user.password = newPassword;
    await user.save(); // The beforeUpdate hook in User model will hash it

    await AuditLog.create({
      action: 'PASSWORD_CHANGED',
      details: 'User successfully changed their password',
      username: user.username,
      ipAddress: req.ip
    });

    req.flash('success', 'Password changed successfully!');
    res.redirect('/profile');
  } catch (err) {
    logger.error(`Password change error: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
  }
});

module.exports = router;

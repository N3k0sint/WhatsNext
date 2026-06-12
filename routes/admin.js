const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

router.use(isAuthenticated, isAdmin);

// GET Admin Dashboard (Audit Logs & User Management)
router.get('/', async (req, res) => {
  try {
    const logs = await AuditLog.findAll({ order: [['createdAt', 'DESC']], limit: 100 });
    const users = await User.findAll({ attributes: ['id', 'username', 'role', 'createdAt'] });
    res.render('admin', { logs, users });
  } catch (err) {
    logger.error(`Admin dashboard error: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Error loading admin panel' });
  }
});

// GET /api/users for AJAX Polling
router.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'username', 'role', 'createdAt'] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET Edit User Page
router.get('/users/:id/edit', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);

    // IDOR Guard: reject non-integer IDs immediately
    if (isNaN(targetId)) {
      logger.warn(`IDOR attempt: Admin '${req.session.user.username}' tried to access edit with invalid ID '${req.params.id}' from IP: ${req.ip}`);
      return res.status(400).render('error', { status: 400, message: 'Invalid user ID.' });
    }

    // Self-edit via admin panel is blocked — use Profile page instead
    if (targetId === req.session.userId) {
      req.flash('error', 'Use the Profile page to edit your own account.');
      return res.redirect('/admin');
    }

    const editUser = await User.findByPk(targetId);
    if (!editUser) return res.status(404).render('error', { status: 404, message: 'User not found' });

    // Audit: log every admin access to the edit form (SSDLC Audit & Accountability)
    await AuditLog.create({
      action: 'ADMIN_EDIT_PAGE_ACCESS',
      details: `Admin accessed edit form for user ID ${targetId} (${editUser.username})`,
      username: req.session.user.username,
      ipAddress: req.ip
    });

    res.render('admin_edit_user', { editUser, errors: [] });
  } catch (err) {
    logger.error(`Error loading edit user page: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
  }
});


// POST Edit User
router.post('/users/:id/edit', [
  body('username').trim().isLength({ min: 3, max: 50 }).escape().withMessage('Username must be 3-50 characters.'),
  body('role').isIn(['user', 'admin']).withMessage('Invalid role selected.')
], async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (isNaN(targetId)) {
      logger.warn(`IDOR attempt on POST edit: Admin '${req.session.user.username}' used invalid ID '${req.params.id}' from IP: ${req.ip}`);
      return res.status(400).render('error', { status: 400, message: 'Invalid user ID.' });
    }

    // Prevent self-edit via admin panel POST (use Profile instead)
    if (targetId === req.session.userId) {
      req.flash('error', 'Use the Profile page to edit your own account.');
      return res.redirect('/admin');
    }

    const editUser = await User.findByPk(targetId);
    if (!editUser) return res.status(404).render('error', { status: 404, message: 'User not found' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('admin_edit_user', { editUser, errors: errors.array() });
    }

    const { username, role } = req.body;
    
    // Check if new username is already taken by someone else
    if (username !== editUser.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) {
        return res.render('admin_edit_user', { editUser, errors: [{ msg: 'Username is already taken' }] });
      }
    }

    // Prevent demoting the last admin
    if (editUser.role === 'admin' && role !== 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        req.flash('error', 'Cannot demote the only remaining administrator.');
        return res.redirect('/admin');
      }
    }

    await editUser.update({ username, role });

    await AuditLog.create({
      action: 'USER_EDITED',
      details: `Admin updated user ID ${editUser.id} to Username: ${username}, Role: ${role}`,
      username: req.session.user.username,
      ipAddress: req.ip
    });

    req.flash('success', `User '${username}' updated successfully.`);
    res.redirect('/admin');
  } catch (err) {
    logger.error(`Error editing user: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
  }
});


// POST Delete User
router.post('/users/:id/delete', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (isNaN(targetId)) {
      logger.warn(`IDOR attempt on delete: Admin '${req.session.user.username}' used invalid ID '${req.params.id}' from IP: ${req.ip}`);
      return res.status(400).render('error', { status: 400, message: 'Invalid user ID.' });
    }

    const userToDelete = await User.findByPk(targetId);
    if (!userToDelete) return res.status(404).render('error', { status: 404, message: 'User not found' });

    // Prevent deleting yourself
    if (userToDelete.id === req.session.userId) {
      req.flash('error', 'You cannot delete your own account.');
      return res.redirect('/admin');
    }

    // Prevent deleting the last admin
    if (userToDelete.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        req.flash('error', 'Cannot delete the only remaining administrator.');
        return res.redirect('/admin');
      }
    }

    const deletedUsername = userToDelete.username;
    await userToDelete.destroy();

    await AuditLog.create({
      action: 'USER_DELETED',
      details: `Admin deleted user: ${deletedUsername}`,
      username: req.session.user.username,
      ipAddress: req.ip
    });

    req.flash('success', `User '${deletedUsername}' has been deleted.`);
    res.redirect('/admin');
  } catch (err) {
    logger.error(`Error deleting user: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
  }
});

module.exports = router;

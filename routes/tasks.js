const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { isAuthenticated } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

router.use(isAuthenticated);

// GET Tasks Dashboard
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { userId: req.session.userId } });
    res.render('dashboard', { tasks, errors: [] });
  } catch (err) {
    logger.error(`Error fetching tasks: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Error fetching tasks' });
  }
});

// POST Create Task
router.post('/', upload.single('attachment'), [
  body('title').trim().notEmpty().escape().withMessage('Title is required'),
  body('description').trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const tasks = await Task.findAll({ where: { userId: req.session.userId } });
    return res.render('dashboard', { tasks, errors: errors.array() });
  }

  try {
    const attachmentPath = req.file ? req.file.filename : null;
    await Task.create({
      title: req.body.title,
      description: req.body.description,
      userId: req.session.userId,
      attachmentPath
    });
    res.redirect('/tasks');
  } catch (err) {
    logger.error(`Task creation error: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Error creating task' });
  }
});

// POST Update Task Status (IDOR Protection via userId check)
router.post('/:id/status', async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.session.userId } });
    if (!task) return res.status(404).render('error', { status: 404, message: 'Task not found' });
    
    // Toggle status
    const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
    await task.update({ status: newStatus });
    
    res.redirect('/tasks');
  } catch (err) {
    logger.error(`Task update error: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Error updating task' });
  }
});

// POST Delete Task (IDOR Protection via userId check)
router.post('/:id/delete', async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.session.userId } });
    if (!task) return res.status(404).render('error', { status: 404, message: 'Task not found' });
    
    // Delete attached file if exists
    if (task.attachmentPath) {
      const filePath = path.join(__dirname, '..', 'uploads', task.attachmentPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await task.destroy();
    res.redirect('/tasks');
  } catch (err) {
    logger.error(`Task deletion error: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Error deleting task' });
  }
});

// GET Download Attachment
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    // Verify user owns a task with this attachment to prevent unauthorized downloads
    const task = await Task.findOne({ where: { attachmentPath: filename, userId: req.session.userId } });
    
    // Admins can download any file
    if (!task && req.session.role !== 'admin') {
      return res.status(403).render('error', { status: 403, message: 'Forbidden' });
    }
    
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    res.download(filePath);
  } catch (err) {
    res.status(500).render('error', { status: 500, message: 'Error downloading file' });
  }
});

module.exports = router;

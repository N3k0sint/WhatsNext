const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
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
    
    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.render('dashboard', { 
      tasks, 
      stats: { totalTasks, completedTasks, pendingTasks, completionRate },
      errors: [] 
    });
  } catch (err) {
    logger.error(`Error fetching tasks: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Error fetching tasks' });
  }
});

// POST Create Task
router.post('/', upload.single('attachment'), [
  body('title').trim().notEmpty().escape().withMessage('Title is required'),
  body('description').trim().escape(),
  body('priority').isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority selected')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const tasks = await Task.findAll({ where: { userId: req.session.userId } });
    
    // Recalculate stats for error re-render
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return res.render('dashboard', { 
      tasks, 
      stats: { totalTasks, completedTasks, pendingTasks, completionRate },
      errors: errors.array() 
    });
  }

  try {
    const attachmentPath = req.file ? req.file.filename : null;
    await Task.create({
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority || 'Medium',
      userId: req.session.userId,
      attachmentPath
    });

    await AuditLog.create({
      action: 'TASK_CREATED',
      details: `User created task '${req.body.title}'${attachmentPath ? ' with attachment: ' + attachmentPath : ''}`,
      username: req.session.user.username,
      ipAddress: req.ip
    });

    req.flash('success', 'Task created successfully!');
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
    
    req.flash('success', `Task marked as ${newStatus}!`);
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
      // Use path.basename to ensure no path traversal characters are used
      const safeFilename = path.basename(task.attachmentPath);
      const filePath = path.join(__dirname, '..', 'uploads', safeFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await task.destroy();

    await AuditLog.create({
      action: 'TASK_DELETED',
      details: `User deleted task: ${task.title}`,
      username: req.session.user.username,
      ipAddress: req.ip
    });

    req.flash('success', 'Task deleted successfully.');
    res.redirect('/tasks');
  } catch (err) {
    logger.error(`Task deletion error: ${err.message}`);
    res.status(500).render('error', { status: 500, message: 'Error deleting task' });
  }
});

// GET Download Attachment
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    // Verify user owns a task with this attachment. 
    // PoLP: Even Admins cannot download other users' files to ensure data privacy.
    const task = await Task.findOne({ where: { attachmentPath: filename, userId: req.session.userId } });
    
    if (!task) {
      logger.warn(`Unauthorized download attempt for file: ${filename} by User ID: ${req.session.userId}`);
      return res.status(403).render('error', { status: 403, message: 'Access Denied: You can only download your own attachments.' });
    }
    
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    res.download(filePath);
  } catch (err) {
    res.status(500).render('error', { status: 500, message: 'Error downloading file' });
  }
});

module.exports = router;

// Checks if the user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect('/auth/login');
};

// Checks if the user is an admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.role === 'admin') {
    return next();
  }
  return res.status(403).render('error', { status: 403, message: 'Forbidden. Admin access required.' });
};

// Middleware to expose session data to all views
const setLocals = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  setLocals
};

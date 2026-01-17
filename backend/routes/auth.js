const express = require('express');
const router = express.Router();

// Demo users
const USERS = [
  { email: 'admin@gmail.com', password: 'Admin@123' },
  { email: 'manager@gmail.com', password: 'manager123' },
  { email: 'staff@gmail.com', password: 'staff123' }



];

// POST /api/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = USERS.find(u => u.email === email && u.password === password);

  if (user) {
    // Set session user
    req.session.user = {
      email: user.email
    };

    return res.json({
      success: true,
      message: 'Logged in successfully'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid email or password'
  });
});

// POST /api/logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// GET /api/status - Check auth status
router.get('/status', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ authenticated: true, user: req.session.user });
  }
  return res.json({ authenticated: false });
});

module.exports = router;

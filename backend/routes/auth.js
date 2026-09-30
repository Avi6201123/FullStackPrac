const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (request, response, next) => {
  try {
    const { username, password } = request.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
      return response.status(400).json({ message: 'Enter a username and password.' });
    }

    const user = await User.findOne({ username: username.trim() }).select('+password');
    if (!user || !(await user.checkPassword(password))) {
      return response.status(401).json({ message: 'Username or password is incorrect.' });
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'local-development-secret', { expiresIn: '8h' });
    return response.json({ token, user: payload });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (_request, response) => response.json({ message: 'Signed out.' }));

router.get('/me', authenticate, (request, response) => response.json({ user: request.user }));

module.exports = router;
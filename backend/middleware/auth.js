const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return response.status(401).json({ message: 'Sign in to continue.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'local-development-secret');
    const user = await User.findById(payload.id).select('username role');
    if (!user) return response.status(401).json({ message: 'Your account is no longer available.' });
    request.user = { id: user.id, username: user.username, role: user.role };
    return next();
  } catch (_error) {
    return response.status(401).json({ message: 'Your session has expired. Sign in again.' });
  }
}

module.exports = authenticate;
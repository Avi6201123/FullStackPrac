const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const authenticate = require('../middleware/auth');
const allowRoles = require('../middleware/roleCheck');

const router = express.Router();
router.use(authenticate, allowRoles('admin'));

router.get('/', async (_request, response, next) => {
  try {
    const users = await User.find().select('username role createdAt').sort({ createdAt: 1 });
    return response.json({ users });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id/role', async (request, response, next) => {
  try {
    const { role } = request.body;
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return response.status(400).json({ message: 'Choose admin, editor, or viewer.' });
    }
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ message: 'User not found.' });
    const user = await User.findByIdAndUpdate(request.params.id, { role }, { new: true, runValidators: true })
      .select('username role createdAt');
    if (!user) return response.status(404).json({ message: 'User not found.' });
    return response.json({ user });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
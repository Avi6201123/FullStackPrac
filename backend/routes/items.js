const express = require('express');
const mongoose = require('mongoose');
const Item = require('../models/Item');
const authenticate = require('../middleware/auth');
const allowRoles = require('../middleware/roleCheck');

const router = express.Router();
router.use(authenticate);

router.get('/', async (_request, response, next) => {
  try {
    const items = await Item.find().populate('createdBy', 'username role').sort({ createdAt: -1 });
    return response.json({ items });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ message: 'Item not found.' });
    const item = await Item.findById(request.params.id).populate('createdBy', 'username role');
    if (!item) return response.status(404).json({ message: 'Item not found.' });
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
});

router.post('/', allowRoles('admin', 'editor'), async (request, response, next) => {
  try {
    const { title, description } = request.body;
    if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim()) {
      return response.status(400).json({ message: 'Title and description are required.' });
    }
    const item = await Item.create({ title, description, createdBy: request.user.id });
    await item.populate('createdBy', 'username role');
    return response.status(201).json({ item });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ message: 'Item not found.' });
    const item = await Item.findById(request.params.id);
    if (!item) return response.status(404).json({ message: 'Item not found.' });
    const isOwner = item.createdBy.toString() === request.user.id;
    if (request.user.role !== 'admin' && !(request.user.role === 'editor' && isOwner)) {
      return response.status(403).json({ message: 'Only an admin or the item creator can edit it.' });
    }

    const { title, description } = request.body;
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    await item.save();
    await item.populate('createdBy', 'username role');
    return response.json({ item });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', allowRoles('admin'), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ message: 'Item not found.' });
    const item = await Item.findByIdAndDelete(request.params.id);
    if (!item) return response.status(404).json({ message: 'Item not found.' });
    return response.json({ message: 'Item deleted.' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
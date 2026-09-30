const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'editor', 'viewer'], required: true, default: 'viewer' },
  createdAt: { type: Date, default: Date.now },
});

userSchema.methods.checkPassword = function checkPassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
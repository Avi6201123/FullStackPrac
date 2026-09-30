require('dotenv').config();

const cors = require('cors');
const express = require('express');
const connectDatabase = require('./config/db');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const userRoutes = require('./routes/users');
const User = require('./models/User');
const Item = require('./models/Item');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
}));
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/users', userRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error.status || 500).json({ message: error.message || 'Server error' });
});

async function seedDemoData() {
  if (await User.exists()) return;

  const demoUsers = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'editor', password: 'editor123', role: 'editor' },
    { username: 'viewer', password: 'viewer123', role: 'viewer' },
  ];
  const users = await User.insertMany(await Promise.all(demoUsers.map(async (user) => ({
    ...user,
    password: await bcrypt.hash(user.password, 12),
  }))));

  await Item.insertMany([
    { title: 'Quarterly launch plan', description: 'Coordinate the product launch across design, engineering, and support.', createdBy: users[1]._id },
    { title: 'Support knowledge base', description: 'A shared guide to the most common customer questions.', createdBy: users[0]._id },
    { title: 'Mobile app refresh', description: 'Review the navigation and accessibility improvements for the next release.', createdBy: users[1]._id },
  ]);
}

async function start() {
  await connectDatabase();
  await seedDemoData();
  app.listen(port, () => console.log(`RBAC API listening on http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Unable to start the API:', error.message);
    process.exit(1);
  });
}

module.exports = app;
const express = require('express');
const cors = require('cors');

// Ensure DB connection is initialized
require('../db');

const authRoutes = require('../routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

module.exports = app;


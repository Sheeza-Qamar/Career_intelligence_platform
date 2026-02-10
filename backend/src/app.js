const express = require('express');
const cors = require('cors');

// Ensure DB connection is initialized
require('../db');

const requireAuth = require('../middleware/authMiddleware');

const authRoutes = require('../routes/authRoutes');
const resumeRoutes = require('../routes/resumeRoutes');
const jobRoleRoutes = require('../routes/jobRoleRoutes');
const analysisRoutes = require('../routes/analysisRoutes');
const atsRoutes = require('../routes/atsRoutes');
const jobSearchRoutes = require('../routes/jobSearchRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simple protected route example to verify JWTs from the frontend
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/job-roles', jobRoleRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/job-search', jobSearchRoutes);

module.exports = app;


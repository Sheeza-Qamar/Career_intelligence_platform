const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { analyzeATS } = require('../controllers/atsController');

const router = express.Router();

// ATS analysis endpoint - auth optional but recommended
router.post('/analyze', (req, res, next) => {
  // Try to use auth if available, but allow without auth for flexibility
  if (req.user) {
    analyzeATS(req, res).catch(next);
  } else {
    // Allow without auth but validate resume_id
    analyzeATS(req, res).catch(next);
  }
});

module.exports = router;

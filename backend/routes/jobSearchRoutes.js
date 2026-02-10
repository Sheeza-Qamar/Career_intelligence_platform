const express = require('express');
const { searchJobs, clearExpiredCache } = require('../controllers/jobSearchController');

const router = express.Router();

// POST /api/job-search - Search for jobs
router.post('/', searchJobs);

// GET /api/job-search/cache/clear - Clear expired cache (maintenance)
router.get('/cache/clear', clearExpiredCache);

module.exports = router;

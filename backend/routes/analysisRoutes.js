const express = require('express');
const { runAnalysis, getAnalysis } = require('../controllers/analysisController');

const router = express.Router();

router.post('/', runAnalysis);
router.get('/:id', getAnalysis);

module.exports = router;

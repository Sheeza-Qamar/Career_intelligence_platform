const express = require('express');
const multer = require('multer');
const requireAuth = require('../middleware/authMiddleware');
const { getMyResume, upload } = require('../controllers/resumeController');

const router = express.Router();

router.get('/me', requireAuth, (req, res, next) => {
  getMyResume(req, res).catch(next);
});

// Use in-memory storage and upload directly to Cloudinary in the controller.
const storage = multer.memoryStorage();

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' || (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
    if (ok) cb(null, true);
    else cb(new Error('Only PDF files are allowed.'), false);
  },
});

router.post('/upload', (req, res, next) => {
  uploadMiddleware.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Max 10MB.' });
      }
      return res.status(400).json({ message: err.message || 'Invalid file.' });
    }
    upload(req, res).catch(next);
  });
});

module.exports = router;

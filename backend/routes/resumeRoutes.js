const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const requireAuth = require('../middleware/authMiddleware');
const { getMyResume, upload, getAtsTemplates } = require('../controllers/resumeController');

const router = express.Router();

router.get('/me', requireAuth, (req, res, next) => {
  getMyResume(req, res).catch(next);
});

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_').slice(0, 80);
    const unique = `${Date.now()}-${base}${ext}`;
    cb(null, unique);
  },
});

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

router.get('/:id/ats-templates', (req, res, next) => {
  getAtsTemplates(req, res).catch(next);
});

module.exports = router;

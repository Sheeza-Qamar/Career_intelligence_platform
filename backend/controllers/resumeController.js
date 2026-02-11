const axios = require('axios');
const FormData = require('form-data');
const db = require('../db');
const cloudinary = require('../utils/cloudinaryClient');
const { parseResumeText } = require('../utils/resumeParser');
const { Readable } = require('stream');

const connection = db.promise();

// Local: http://localhost:8000
// Vercel: can be https://your-nlp.vercel.app or https://your-nlp.vercel.app/api
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

const getNlpApiBase = () => {
  const base = (NLP_SERVICE_URL || '').replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
};

/**
 * GET /api/resumes/me (auth required)
 * Returns the logged-in user's single resume (latest). 404 if none.
 */
exports.getMyResume = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const [rows] = await connection.query(
      `SELECT id, user_id, original_filename, file_url, parsed_success, created_at, updated_at
       FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
      [user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No resume found for this user.' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/resumes/me error:', err);
    return res.status(500).json({ message: 'Failed to fetch resume.' });
  }
};

/**
 * POST /api/resumes/upload
 * Form: file (PDF), optional user_id
 * If user_id provided and user already has a resume: UPDATE that row (one resume per user). Else INSERT.
 */
exports.upload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded. Send a PDF as "file".' });
  }

  const originalFilename = req.file.originalname || 'resume.pdf';
  const fileBuffer = req.file.buffer;
  const user_id = req.body.user_id ? parseInt(req.body.user_id, 10) : null;
  if (req.body.user_id && isNaN(user_id)) {
    return res.status(400).json({ message: 'Invalid user_id.' });
  }

  let extractedText = '';
  let parsed_success = 0;
  let cloudinaryUrl = null;

  // 1) Send PDF buffer to NLP service for text extraction
  try {
    const form = new FormData();
    const nlpStream = Readable.from(fileBuffer);
    form.append('file', nlpStream, {
      filename: originalFilename,
      contentType: 'application/pdf',
    });

    let headers = form.getHeaders();
    try {
      const length = await new Promise((resolve, reject) => {
        form.getLength((err, len) => (err ? reject(err) : resolve(len)));
      });
      headers = { ...headers, 'Content-Length': length };
    } catch {
      // If length can't be determined, proceed without it.
    }

    const response = await axios.post(`${getNlpApiBase()}/extract-text`, form, {
      headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000,
    });

    if (response.data && typeof response.data.text === 'string') {
      extractedText = response.data.text;
      parsed_success = 1;
    }
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail || err.response?.data?.message;
    console.error(
      'NLP extract-text error:',
      err.message || err,
      status ? `(${status})` : '',
      detail ? String(detail) : ''
    );
  }

  // 2) Upload the same buffer directly to Cloudinary (no local disk storage)
  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'resumes',
          public_id: `${user_id || 'anon'}-${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(fileBuffer);
    });

    cloudinaryUrl = uploadResult.secure_url;
  } catch (err) {
    console.error('Cloudinary upload error:', err.message || err);
  }

  // Resume storage requires Cloudinary; do not save if upload failed
  if (!cloudinaryUrl) {
    return res.status(503).json({
      message: 'Resume could not be saved. Check that CLOUDINARY_URL (or Cloud name, API key, API secret) is set correctly in backend environment and try again.',
    });
  }

  const file_url = cloudinaryUrl;

  try {
    if (user_id) {
      const [existing] = await connection.query(
        'SELECT id, file_url FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
        [user_id]
      );
      if (existing.length > 0) {
        const oldFileUrl = existing[0].file_url;
        // If old file_url was a Cloudinary URL, we could optionally delete it via API.
        // Skip deletion for now to avoid accidentally removing user files.
        await connection.query(
          `UPDATE resumes SET original_filename = ?, file_url = ?, extracted_text = ?, parsed_success = ?
           WHERE id = ?`,
          [originalFilename, file_url, extractedText, parsed_success, existing[0].id]
        );
        return res.status(200).json({
          resume_id: existing[0].id,
          parsed_success: parsed_success === 1,
          message: parsed_success ? 'Resume updated and text extracted.' : 'Resume updated; text extraction failed.',
          updated: true,
        });
      }
    }

    const [result] = await connection.query(
      `INSERT INTO resumes (user_id, original_filename, file_url, extracted_text, parsed_success)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, originalFilename, file_url, extractedText, parsed_success]
    );

    return res.status(201).json({
      resume_id: result.insertId,
      parsed_success: parsed_success === 1,
      message: parsed_success ? 'Resume uploaded and text extracted.' : 'Resume uploaded; text extraction failed.',
    });
  } catch (dbErr) {
    const code = dbErr.code || '';
    const errMsg = dbErr.message || '';
    console.error('Resume insert/update error:', code, errMsg);
    // User-friendly message; full code/message visible in Vercel logs
    let msg = 'Failed to save resume.';
    if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
      msg = 'Database unreachable. Set DB_HOST, DB_PORT on Vercel and allow Vercel IPs (or 0.0.0.0/0) in your DB host.';
    } else if (code === 'ER_ACCESS_DENIED_ERROR' || errMsg.includes('Access denied')) {
      msg = 'Database credentials invalid. Check DB_USER, DB_PASSWORD (and DB_NAME) on Vercel.';
    } else if (code === 'ER_BAD_DB_ERROR') {
      msg = 'Database name invalid. Check DB_NAME on Vercel.';
    }
    return res.status(500).json({ message: msg });
  }
};


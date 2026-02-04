const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const db = require('../db');
const { parseResumeText } = require('../utils/resumeParser');

const connection = db.promise();
// On Vercel use /tmp (writable); otherwise use local uploads folder
const uploadsDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, '..', 'uploads');

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

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
  const filePath = req.file.path;
  const user_id = req.body.user_id ? parseInt(req.body.user_id, 10) : null;
  if (req.body.user_id && isNaN(user_id)) {
    return res.status(400).json({ message: 'Invalid user_id.' });
  }

  let extractedText = '';
  let parsed_success = 0;

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: originalFilename,
      contentType: 'application/pdf',
    });

    // When NLP is on Vercel, set NLP_SERVICE_URL to https://your-nlp.vercel.app/api
const response = await axios.post(`${NLP_SERVICE_URL.replace(/\/$/, '')}/extract-text`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000,
    });

    if (response.data && typeof response.data.text === 'string') {
      extractedText = response.data.text;
      parsed_success = 1;
    }
  } catch (err) {
    console.error('NLP extract-text error:', err.message || err);
  }

  const file_url = path.basename(filePath);

  try {
    if (user_id) {
      const [existing] = await connection.query(
        'SELECT id, file_url FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
        [user_id]
      );
      if (existing.length > 0) {
        const oldFileUrl = existing[0].file_url;
        if (oldFileUrl) {
          const oldPath = path.join(uploadsDir, oldFileUrl);
          try {
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          } catch (e) {
            console.warn('Could not delete old resume file:', e.message);
          }
        }
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
    console.error('Resume insert/update error:', dbErr);
    // Log code for debugging (Vercel logs); don't expose to client
    const code = dbErr.code || '';
    const msg = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND'
      ? 'Database connection failed. Check DB_HOST, DB_PORT, and Aiven network access.'
      : 'Failed to save resume.';
    return res.status(500).json({ message: msg });
  }
};


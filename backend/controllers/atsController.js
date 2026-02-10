const axios = require('axios');
const FormData = require('form-data');
const db = require('../db');

const connection = db.promise();

// ATS Service URL - use NLP service (same as extract-text service)
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';
const ATS_SERVICE_URL = NLP_SERVICE_URL; // Use same service

/**
 * POST /api/ats/analyze
 * Analyzes uploaded resume for ATS compatibility
 * Requires: resume_id (or user must be authenticated)
 */
exports.analyzeATS = async (req, res) => {
  try {
    const { resume_id } = req.body;
    const user_id = req.user?.id || req.body.user_id;

    if (!resume_id) {
      return res.status(400).json({ message: 'resume_id is required.' });
    }

    // Fetch resume from database
    const [resumes] = await connection.query(
      'SELECT id, file_url, original_filename, user_id FROM resumes WHERE id = ?',
      [resume_id]
    );

    if (resumes.length === 0) {
      return res.status(404).json({ message: 'Resume not found.' });
    }

    const resume = resumes[0];

    // Check if user has access (if authenticated)
    if (user_id && resume.user_id && resume.user_id !== user_id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Resume file_url now stores a Cloudinary URL (or other remote URL).
    // Download the file as a stream and forward it to the ATS service.
    const fileUrl = resume.file_url;
    if (!fileUrl) {
      return res.status(404).json({ message: 'Resume file URL is missing.' });
    }

    let fileStream;
    try {
      const fileResponse = await axios.get(fileUrl, { responseType: 'stream' });
      fileStream = fileResponse.data;
    } catch (downloadErr) {
      console.error('Failed to download resume from Cloudinary/remote URL:', downloadErr.message || downloadErr);
      return res.status(404).json({ message: 'Resume file not found on server.' });
    }

    // Prepare file for ATS service
    const form = new FormData();
    form.append('file', fileStream, {
      filename: resume.original_filename || 'resume.pdf',
      contentType: 'application/pdf',
    });

    // Call ATS analysis service
    try {
      // Normalize base URL to avoid double /api or trailing slash issues.
      // Convention: NLP_SERVICE_URL should point to the base API root,
      // e.g. https://your-nlp-service.vercel.app/api
      const baseUrl = (ATS_SERVICE_URL || '').replace(/\/$/, '');

      const response = await axios.post(`${baseUrl}/analyze`, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000, // 60 seconds timeout
      });

      return res.status(200).json({
        success: true,
        ...response.data,
      });
    } catch (atsError) {
      console.error('ATS Service error:', atsError.message || atsError);
      
      if (atsError.code === 'ECONNREFUSED' || atsError.code === 'ETIMEDOUT') {
        return res.status(503).json({
          message: 'ATS analysis service is unavailable. Please ensure the ATS service is running.',
          error: 'Service unavailable',
        });
      }

      if (atsError.response?.data) {
        return res.status(atsError.response.status || 500).json({
          message: atsError.response.data.detail || atsError.response.data.message || 'ATS analysis failed.',
          error: atsError.response.data,
        });
      }

      return res.status(500).json({
        message: 'Failed to analyze resume. Please try again.',
        error: atsError.message,
      });
    }
  } catch (err) {
    console.error('POST /api/ats/analyze error:', err);
    return res.status(500).json({ message: 'Failed to process ATS analysis request.' });
  }
};

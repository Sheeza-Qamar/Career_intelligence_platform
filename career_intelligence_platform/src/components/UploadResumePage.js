import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import Navbar from './Navbar';
import { API_BASE } from '../config';

const UploadResumePage = () => {
  const navigate = useNavigate();
  const logoPattern = `/web_logo.png`;
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resumeId, setResumeId] = useState(null);
  const [myResumeFilename, setMyResumeFilename] = useState(null);
  const [user, setUser] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const fileInputRef = useRef(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('authUser');
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!user?.id || !token) {
      setMeLoading(false);
      return;
    }
    const fetchMyResume = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/resumes/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.id) {
          setResumeId(res.data.id);
          setMyResumeFilename(res.data.original_filename || 'Your resume');
        } else {
          setResumeId(null);
          setMyResumeFilename(null);
        }
      } catch {
        setResumeId(null);
        setMyResumeFilename(null);
      } finally {
        setMeLoading(false);
      }
    };
    fetchMyResume();
  }, [user?.id, token]);

  const handleFileChange = (e) => {
    const chosen = e.target.files?.[0];
    setError('');
    setSuccess('');
    if (!chosen) {
      setFile(null);
      setFileName('');
      return;
    }
    if (chosen.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      setFile(null);
      setFileName('');
      e.target.value = '';
      return;
    }
    if (chosen.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      setFile(null);
      setFileName('');
      e.target.value = '';
      return;
    }
    setFile(chosen);
    setFileName(chosen.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!file) {
      fileInputRef.current?.click();
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (user?.id) {
        formData.append('user_id', String(user.id));
      }

      const res = await axios.post(`${API_BASE}/api/resumes/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      const id = res.data?.resume_id;
      const parsed = res.data?.parsed_success;
      const updated = res.data?.updated;
      setResumeId(id);
      setMyResumeFilename(file?.name || myResumeFilename);
      setSuccess(
        id
          ? updated
            ? (parsed ? 'Resume updated and text extracted.' : 'Resume updated; text extraction failed. You can still analyze.')
            : parsed
              ? 'Resume uploaded and text extracted successfully.'
              : 'Resume uploaded; text extraction failed. You can still use it for analysis.'
          : 'Upload completed.'
      );
    } catch (err) {
      let message =
        err.response?.data?.message || err.message || 'Upload failed. Please try again.';
      if (err.response?.status === 404) {
        message =
          'Backend route not found (404). Make sure backend is running: in backend folder run "node server.js" and restart if you just added resume upload.';
      }
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        message =
          'Cannot reach backend. Start the backend (node server.js in backend folder) and ensure it runs on the same URL as your API (e.g. http://localhost:5000).';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const hasResume = resumeId != null && myResumeFilename;
  const showUpdate = user && hasResume;
  return (
    <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
      <Navbar />

      <main className="auth-main">
        <div className="auth-card upload-card">
          <h1 className="auth-title upload-title">Resume</h1>
          <p className="auth-subtitle">
            {user
              ? 'One resume per account. Upload or replace your PDF for analysis.'
              : 'Upload a PDF resume. We\'ll extract text and save it for analysis.'}
          </p>

          {meLoading && user && (
            <p className="auth-subtitle">Loading your resume...</p>
          )}

          {!meLoading && (
            <form className="auth-form upload-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h2 className="form-section-title">Step 1: Upload resume</h2>

                {showUpdate && (
                  <div className="upload-my-resume">
                    <span className="upload-my-resume-label">Your resume:</span>
                    <span className="upload-my-resume-filename">{myResumeFilename}</span>
                  </div>
                )}

                <label className="auth-label upload-label">
                  {showUpdate ? 'Replace with new PDF (max 10MB)' : 'PDF file (max 10MB)'}
                  <div className="upload-input-wrap">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="upload-file-input"
                      id="resume-file"
                    />
                    <span className="upload-file-name">
                      {fileName || (showUpdate ? 'Choose a new PDF' : 'Choose a PDF file')}
                    </span>
                  </div>
                </label>

                {error && <p className="auth-error">{error}</p>}
                {success && (
                  <p className="auth-success">
                    {success}
                    {resumeId != null && !showUpdate && (
                      <span className="upload-resume-id"> Resume ID: {resumeId}</span>
                    )}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary auth-submit"
                  disabled={loading}
                >
                  {loading
                    ? (showUpdate && file ? 'Updating...' : 'Uploading...')
                    : showUpdate
                      ? (file ? 'Update resume' : 'Choose file to replace')
                      : file
                        ? 'Upload Resume'
                        : 'Choose PDF file'}
                </button>

                {hasResume && (
                  <button
                    type="button"
                    className="btn btn-primary auth-submit upload-next-btn"
                    onClick={() =>
                      navigate('/analyze', {
                        state: { resumeId, myResumeFilename },
                      })
                    }
                  >
                    Next
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default UploadResumePage;

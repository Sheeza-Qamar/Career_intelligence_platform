import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../App.css';
import Navbar from './Navbar';
import { API_BASE } from '../config';

const AnalyzePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const logoPattern = `${process.env.PUBLIC_URL || ''}/web_logo.png`;
  const [resumeId, setResumeId] = useState(null);
  const [myResumeFilename, setMyResumeFilename] = useState('');
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRoleId, setSelectedJobRoleId] = useState('');
  const [jobRoleQuery, setJobRoleQuery] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(true);
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
    const state = location.state || {};
    if (state.resumeId != null && state.myResumeFilename) {
      setResumeId(state.resumeId);
      setMyResumeFilename(state.myResumeFilename);
      setResumeLoading(false);
      return;
    }
    if (!user?.id || !token) {
      setResumeLoading(false);
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
          setMyResumeFilename('');
        }
      } catch {
        setResumeId(null);
        setMyResumeFilename('');
      } finally {
        setResumeLoading(false);
      }
    };
    fetchMyResume();
  }, [user?.id, token, location.state]);

  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/job-roles`);
        setJobRoles(Array.isArray(res.data) ? res.data : []);
      } catch {
        setJobRoles([]);
      }
    };
    fetchJobRoles();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeId || !selectedJobRoleId) {
      setError('Please select a job role.');
      return;
    }
    setError('');
    setAnalyzeLoading(true);
    try {
      const payload = {
        resume_id: Number(resumeId),
        job_role_id: Number(selectedJobRoleId),
      };
      if (user?.id) payload.user_id = user.id;
      const res = await axios.post(`${API_BASE}/api/analyses`, payload, { timeout: 60000 });
      const analysisId = res.data?.analysis_id;
      if (analysisId) navigate(`/analysis/${analysisId}`);
      else setError('Analysis completed but no result id returned.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Analysis failed.');
    } finally {
      setAnalyzeLoading(false);
    }
  };

  if (resumeLoading) {
    return (
      <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
        <Navbar />
        <main className="auth-main">
          <div className="auth-card">
            <p className="auth-subtitle">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!resumeId) {
    return (
      <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
        <Navbar />
        <main className="auth-main">
          <div className="auth-card">
            <p className="auth-subtitle">Please upload a resume first.</p>
            <Link to="/upload" className="btn btn-primary auth-submit" style={{ marginTop: '1rem' }}>
              Go to Upload
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
      <Navbar />

      <main className="auth-main">
        <div className="auth-card upload-card">
          <h1 className="auth-title upload-title">Choose job role</h1>
          <p className="auth-subtitle">
            Your resume: <strong>{myResumeFilename}</strong>
          </p>

          <form className="auth-form upload-form" onSubmit={handleAnalyze}>
            <div className="form-section">
              <label className="auth-label">
                <span className="job-role-label">Target job role you want to apply for:</span>
                <div className="job-role-select">
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Select job"
                    value={jobRoleQuery}
                    list="analyze-job-role-options"
                    onChange={(e) => {
                      const value = e.target.value;
                      setJobRoleQuery(value);
                      const match = jobRoles.find(
                        (role) =>
                          (role.name || role.title || '').trim().toLowerCase() ===
                          value.trim().toLowerCase()
                      );
                      setSelectedJobRoleId(match ? String(match.id) : '');
                    }}
                  />
                  <datalist id="analyze-job-role-options">
                    {jobRoles.map((role) => (
                      <option key={role.id} value={role.name || role.title} />
                    ))}
                  </datalist>
                </div>
              </label>

              {error && <p className="auth-error">{error}</p>}

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={!selectedJobRoleId || analyzeLoading}
              >
                {analyzeLoading ? 'Analyzing...' : 'Check Your Job Readiness'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AnalyzePage;

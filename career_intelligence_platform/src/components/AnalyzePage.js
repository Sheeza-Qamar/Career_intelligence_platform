import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../App.css';
import { API_BASE } from '../config';
import { getCachedAnalysis, setCachedAnalysis } from '../utils/jobFitnessAnalysisCache';

const AnalyzePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const logoPattern = `/web_logo.png`;
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
    
    // Load cached job role selection
    try {
      const cachedRoleId = localStorage.getItem('lastSelectedJobRoleId');
      const cachedRoleQuery = localStorage.getItem('lastSelectedJobRoleQuery');
      if (cachedRoleId && cachedRoleQuery) {
        setSelectedJobRoleId(cachedRoleId);
        setJobRoleQuery(cachedRoleQuery);
      }
    } catch (e) {
      console.warn('Failed to load cached job role:', e);
    }
  }, []);

  // If user has a resume and a valid cached analysis (< 7 days, same resume), show that result
  useEffect(() => {
    if (resumeLoading || !resumeId) return;
    const cached = getCachedAnalysis(resumeId);
    if (cached?.analysisId) navigate(`/analysis/${cached.analysisId}`, { replace: true });
  }, [resumeId, resumeLoading, navigate]);

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
      const res = await axios.post(`${API_BASE}/api/analyses`, payload, { timeout: 180000 }); // 3 min (RAG + embeddings can be slow)
      const analysisId = res.data?.analysis_id;
      
      // Persist analysis so it stays when user navigates away (reset on new CV or after 7 days)
      if (analysisId && resumeId) setCachedAnalysis(analysisId, resumeId);
      
      try {
        localStorage.setItem('lastSelectedJobRoleId', selectedJobRoleId);
        localStorage.setItem('lastSelectedJobRoleQuery', jobRoleQuery);
      } catch (e) {
        console.warn('Failed to cache job role:', e);
      }
      
      if (analysisId) navigate(`/analysis/${analysisId}`);
      else setError('Analysis completed but no result id returned.');
    } catch (err) {
      const msg = err.code === 'ECONNABORTED'
        ? 'Analysis is taking longer than expected. Please try again (it may take 1–2 minutes).'
        : (err.response?.data?.message || err.message || 'Analysis failed.');
      setError(msg);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  if (resumeLoading) {
    return (
      <div className="app-root auth-page landing-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
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
      <div className="app-root auth-page landing-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
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
    <div className="app-root auth-page landing-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
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
                      const roleId = match ? String(match.id) : '';
                      setSelectedJobRoleId(roleId);
                      
                      // Cache the selection
                      try {
                        if (roleId) {
                          localStorage.setItem('lastSelectedJobRoleId', roleId);
                          localStorage.setItem('lastSelectedJobRoleQuery', value);
                        }
                      } catch (e) {
                        console.warn('Failed to cache job role:', e);
                      }
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
                {analyzeLoading ? 'Analyzing... (may take 1–2 min)' : 'Check Your Job Readiness'}
              </button>
              {analyzeLoading && (
                <p className="auth-subtitle" style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                  Please wait. Do not refresh.
                </p>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AnalyzePage;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../App.css';
import { API_BASE } from '../config';

const ATSCompatibilityPage = () => {
  const logoPattern = `/web_logo.png`;
  const [resumeId, setResumeId] = useState(null);
  const [myResumeFilename, setMyResumeFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
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
          setMyResumeFilename(null);
        }
      } catch {
        setResumeId(null);
        setMyResumeFilename(null);
      } finally {
        setResumeLoading(false);
      }
    };
    fetchMyResume();
  }, [user?.id, token]);

  // Auto-run ATS analysis when user has a resume so they land directly on results
  const hasAutoRun = React.useRef(false);
  useEffect(() => {
    if (!resumeId || !user?.id || resumeLoading || hasAutoRun.current) return;
    hasAutoRun.current = true;
    const runAnalysis = async () => {
      setError('');
      setLoading(true);
      setAnalysisData(null);
      try {
        const payload = { resume_id: Number(resumeId) };
        payload.user_id = user.id;
        const res = await axios.post(`${API_BASE}/api/ats/analyze`, payload, {
          timeout: 90000,
        });
        setAnalysisData(res.data);
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'ATS analysis failed.';
        if (err.response?.status === 503) {
          setError('ATS analysis service is unavailable. Please ensure the ATS service is running.');
        } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
          setError('Cannot reach backend. Please check your connection.');
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };
    runAnalysis();
  }, [resumeId, user?.id, resumeLoading]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeId) {
      setError('Please upload a resume first.');
      return;
    }

    setError('');
    setLoading(true);
    setAnalysisData(null);

    try {
      const payload = { resume_id: Number(resumeId) };
      if (user?.id) payload.user_id = user.id;

      const res = await axios.post(`${API_BASE}/api/ats/analyze`, payload, {
        timeout: 90000, // 90 seconds for ATS analysis
      });

      setAnalysisData(res.data);
    } catch (err) {
      let message = err.response?.data?.message || err.message || 'ATS analysis failed.';
      if (err.response?.status === 503) {
        message = 'ATS analysis service is unavailable. Please ensure the ATS service is running.';
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        message = 'Cannot reach backend. Please check your connection.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    if (score >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getScoreCategory = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor';
  };

  if (resumeLoading) {
    return (
      <div className="app-root auth-page landing-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
        <main className="auth-main">
          <div className="auth-card">
            <p className="auth-subtitle">Loading your resume...</p>
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
            <h1 className="auth-title">ATS Compatibility</h1>
            <p className="auth-subtitle">Please upload a resume first to check ATS compatibility.</p>
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
        <div className="auth-card upload-card" style={{ maxWidth: '900px' }}>
          <h1 className="auth-title upload-title">ATS Compatibility Check</h1>
          <p className="auth-subtitle">
            Your resume: <strong>{myResumeFilename}</strong>
          </p>

          {!analysisData && (
            <div className="form-section">
              {loading && (
                <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
                  Analyzing your resume for ATS compatibility...
                </p>
              )}
              {error && !loading && (
                <>
                  <p className="auth-error" style={{ marginBottom: '1rem' }}>{error}</p>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="btn btn-primary auth-submit"
                    disabled={loading}
                  >
                    Retry Analysis
                  </button>
                </>
              )}
            </div>
          )}

          {analysisData && (
            <div className="ats-results" style={{ marginTop: '2rem' }}>
              {/* Score Display */}
              <div className="ats-score-section" style={{
                textAlign: 'center',
                marginBottom: '2rem',
                padding: '2rem',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '1rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
              }}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: getScoreColor(analysisData.ats_score),
                  marginBottom: '0.5rem',
                }}>
                  {analysisData.ats_score}
                </div>
                <div style={{
                  fontSize: '1.2rem',
                  color: '#cbd5f5',
                  marginBottom: '1rem',
                }}>
                  {getScoreCategory(analysisData.ats_score)}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                  {analysisData.score_category || 'ATS Compatibility Score'}
                </div>
              </div>

              {/* Score Breakdown */}
              {analysisData.score_breakdown && (
                <div className="ats-breakdown" style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#e5e7eb' }}>Score Breakdown</h2>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {Object.entries(analysisData.score_breakdown).map(([key, value]) => (
                      <div key={key} style={{
                        padding: '1rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#cbd5f5', textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span style={{ color: getScoreColor(value), fontWeight: 'bold' }}>
                            {value}%
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(148, 163, 184, 0.2)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${value}%`,
                            height: '100%',
                            background: getScoreColor(value),
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Domain Info */}
              {analysisData.domain && (
                <div className="ats-domain" style={{
                  marginBottom: '2rem',
                  padding: '1rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#e5e7eb' }}>Detected Domain</h2>
                  <div style={{ color: '#cbd5f5' }}>
                    <strong>{analysisData.domain.primary}</strong>
                    {analysisData.domain.confidence && (
                      <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>
                        ({Math.round(analysisData.domain.confidence * 100)}% confidence)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {analysisData.skills && (
                <div className="ats-skills" style={{
                  marginBottom: '2rem',
                  padding: '1rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#e5e7eb' }}>Detected Skills</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {analysisData.skills.programming_languages?.map((skill, idx) => (
                      <span key={idx} style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(79, 70, 229, 0.3)',
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        color: '#cbd5f5',
                      }}>{skill}</span>
                    ))}
                    {analysisData.skills.frameworks?.map((skill, idx) => (
                      <span key={idx} style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(99, 102, 241, 0.3)',
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        color: '#cbd5f5',
                      }}>{skill}</span>
                    ))}
                    {analysisData.skills.tools?.map((skill, idx) => (
                      <span key={idx} style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(139, 92, 246, 0.3)',
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        color: '#cbd5f5',
                      }}>{skill}</span>
                    ))}
                  </div>
                  {analysisData.skills.total_count && (
                    <div style={{ marginTop: '1rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                      Total Skills Detected: {analysisData.skills.total_count}
                    </div>
                  )}
                </div>
              )}

              {/* Issues */}
              {analysisData.issues && analysisData.issues.length > 0 && (
                <div className="ats-issues" style={{
                  marginBottom: '2rem',
                  padding: '1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#e5e7eb' }}>Issues Found</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analysisData.issues.map((issue, idx) => (
                      <div key={idx} style={{
                        padding: '0.75rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        borderRadius: '0.5rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ color: '#cbd5f5', fontWeight: 'bold' }}>{issue.type}</span>
                          <span style={{
                            color: issue.severity === 'High' ? '#ef4444' : issue.severity === 'Medium' ? '#f59e0b' : '#9ca3af',
                            fontSize: '0.85rem',
                          }}>{issue.severity}</span>
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                          {issue.description}
                        </div>
                        {issue.suggestion && (
                          <div style={{ color: '#cbd5f5', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            💡 {issue.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysisData.suggestions && analysisData.suggestions.length > 0 && (
                <div className="ats-suggestions" style={{
                  marginBottom: '2rem',
                  padding: '1rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#e5e7eb' }}>Improvement Suggestions</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analysisData.suggestions.map((suggestion, idx) => (
                      <div key={idx} style={{
                        padding: '0.75rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        borderRadius: '0.5rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ color: '#cbd5f5', fontWeight: 'bold' }}>{suggestion.title}</span>
                          <span style={{
                            color: suggestion.priority === 'High' ? '#ef4444' : suggestion.priority === 'Medium' ? '#f59e0b' : '#9ca3af',
                            fontSize: '0.85rem',
                          }}>{suggestion.priority}</span>
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          {suggestion.description}
                        </div>
                        {suggestion.examples && suggestion.examples.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <div style={{ color: '#cbd5f5', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Examples:</div>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                              {suggestion.examples.map((example, exIdx) => (
                                <li key={exIdx}>{example}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords Analysis */}
              {analysisData.keywords_analysis && (
                <div className="ats-keywords" style={{
                  marginBottom: '2rem',
                  padding: '1rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#e5e7eb' }}>Keywords Analysis</h2>
                  {analysisData.keywords_analysis.found && analysisData.keywords_analysis.found.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ color: '#22c55e', fontSize: '0.9rem', marginBottom: '0.5rem' }}>✅ Found Keywords:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {analysisData.keywords_analysis.found.map((kw, idx) => (
                          <span key={idx} style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(34, 197, 94, 0.2)',
                            borderRadius: '0.25rem',
                            fontSize: '0.85rem',
                            color: '#86efac',
                          }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysisData.keywords_analysis.missing && analysisData.keywords_analysis.missing.length > 0 && (
                    <div>
                      <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '0.5rem' }}>❌ Missing Keywords:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {analysisData.keywords_analysis.missing.map((kw, idx) => (
                          <span key={idx} style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(239, 68, 68, 0.2)',
                            borderRadius: '0.25rem',
                            fontSize: '0.85rem',
                            color: '#fca5a5',
                          }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={handleAnalyze}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Re-analyzing...' : 'Re-analyze Resume'}
                </button>
                <Link
                  to="/upload"
                  className="btn btn-ghost"
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  Upload New Resume
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ATSCompatibilityPage;

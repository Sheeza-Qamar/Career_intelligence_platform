import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import Navbar from './Navbar';
import { API_BASE } from '../config';

const AnalysisResultPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const logoPattern = `${process.env.PUBLIC_URL || ''}/web_logo.png`;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState('');
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRoleId, setSelectedJobRoleId] = useState('');
  const [jobRoleQuery, setJobRoleQuery] = useState('');
  const [reAnalyzing, setReAnalyzing] = useState(false);
  const [reAnalyzeError, setReAnalyzeError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('authUser');
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  }, []);

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

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchAnalysis = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/analyses/${id}`);
        if (!cancelled) {
          setData(res.data);
          setSelectedJobRoleId(res.data.job_role_id != null ? String(res.data.job_role_id) : '');
          setJobRoleQuery(res.data.job_role_title || '');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load analysis.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAnalysis();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!data?.resume_id) return;
    let cancelled = false;
    const fetchTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError('');
      try {
        const res = await axios.get(`${API_BASE}/api/resumes/${data.resume_id}/ats-templates`);
        if (!cancelled) {
          setTemplates(Array.isArray(res.data?.templates) ? res.data.templates : []);
        }
      } catch (err) {
        if (!cancelled) {
          setTemplatesError(
            err.response?.data?.message || err.message || 'Failed to load ATS templates.'
          );
        }
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    };
    fetchTemplates();
    return () => {
      cancelled = true;
    };
  }, [data?.resume_id]);

  if (loading) {
    return (
      <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
        <Navbar />
        <main className="auth-main">
          <div className="auth-card">
            <p className="auth-subtitle">Loading analysis...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
        <Navbar />
        <main className="auth-main">
          <div className="auth-card">
            <p className="auth-error">{error || 'Analysis not found.'}</p>
            <Link to="/upload" className="btn btn-ghost" style={{ marginTop: '1rem' }}>
              Back to Upload
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleReAnalyze = async (e) => {
    e.preventDefault();
    if (!data?.resume_id || !selectedJobRoleId) return;
    setReAnalyzing(true);
    setReAnalyzeError('');
    try {
      const payload = {
        resume_id: Number(data.resume_id),
        job_role_id: Number(selectedJobRoleId),
      };
      if (user?.id) payload.user_id = user.id;
      const res = await axios.post(`${API_BASE}/api/analyses`, payload, { timeout: 60000 });
      const analysisId = res.data?.analysis_id;
      if (analysisId) navigate(`/analysis/${analysisId}`);
    } catch (err) {
      setReAnalyzeError(err.response?.data?.message || err.message || 'Analysis failed.');
    } finally {
      setReAnalyzing(false);
    }
  };

  const missingGaps = data.gaps?.filter((g) => g.gap_type === 'missing') ?? [];
  const weakGaps = data.gaps?.filter((g) => g.gap_type === 'weak') ?? [];
  const matchedCount = (data.gaps?.length ?? 0) === 0 ? 0 : Math.round((data.match_score / 100) * (data.gaps?.length + missingGaps.length + weakGaps.length)) || 0;
  const atsLayout = data.ats_layout || null;

  return (
    <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
      <Navbar />

      <main className="auth-main analysis-result-main">
        <div className="analysis-result-card analysis-result-card-with-select">
          <div className="analysis-job-select-bar">
            <label className="analysis-job-select-label">
              <span>Analyze for another job role</span>
              <div className="analysis-job-select-row">
                <input
                  type="text"
                  className="auth-input analysis-job-input"
                  placeholder="Select job role"
                  value={jobRoleQuery}
                  list="analysis-job-role-options"
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
                <datalist id="analysis-job-role-options">
                  {jobRoles.map((role) => (
                    <option key={role.id} value={role.name || role.title} />
                  ))}
                </datalist>
                <button
                  type="button"
                  className="btn btn-primary analysis-analyze-btn"
                  disabled={!selectedJobRoleId || reAnalyzing}
                  onClick={handleReAnalyze}
                >
                  {reAnalyzing ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
              {reAnalyzeError && (
                <p className="auth-error" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                  {reAnalyzeError}
                </p>
              )}
            </label>
          </div>

          {reAnalyzing && (
            <div className="analysis-result-loader">
              <div className="analysis-result-loader-spinner" />
              <p className="analysis-result-loader-text">Analyzing for selected role...</p>
            </div>
          )}

          <h1 className="auth-title">Analysis Result</h1>
          <p className="auth-subtitle">
            {data.resume_filename} vs {data.job_role_title}
          </p>

          <div className="analysis-score-wrap">
            <div className="analysis-score-circle" style={{ '--score': data.match_score }}>
              <span className="analysis-score-value">{data.match_score}%</span>
              <span className="analysis-score-label">Match</span>
            </div>
          </div>

          <section className="analysis-section">
            <h2 className="analysis-section-title">Skill gaps (missing)</h2>
            {missingGaps.length === 0 ? (
              <p className="analysis-empty">No missing skills for this role.</p>
            ) : (
              <ul className="analysis-skill-list">
                {missingGaps.map((g) => (
                  <li key={g.skill_id}>{g.skill_name}</li>
                ))}
              </ul>
            )}
          </section>

          {weakGaps.length > 0 && (
            <section className="analysis-section">
              <h2 className="analysis-section-title">Weak skills</h2>
              <ul className="analysis-skill-list">
                {weakGaps.map((g) => (
                  <li key={g.skill_id}>{g.skill_name}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="analysis-section">
            <h2 className="analysis-section-title">Learning roadmap</h2>
            {!data.roadmap?.length ? (
              <p className="analysis-empty">No roadmap items.</p>
            ) : (
              <ul className="analysis-roadmap-list">
                {data.roadmap.map((r, i) => (
                  <li key={i} className="analysis-roadmap-item">
                    <strong>{r.skill_name}</strong>
                    {r.note && (
                      <span className="analysis-roadmap-note">
                        {(() => {
                          if (typeof r.note !== 'string') return r.note;
                          if (r.note.startsWith('[')) {
                            try {
                              const arr = JSON.parse(r.note);
                              return Array.isArray(arr) ? arr.join(' → ') : r.note;
                            } catch {
                              return r.note;
                            }
                          }
                          return r.note;
                        })()}
                      </span>
                    )}
                    {r.resource_url && (
                      <a href={r.resource_url} target="_blank" rel="noopener noreferrer" className="analysis-resource-link">
                        {r.resource_title || 'Resource'}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {atsLayout && (
            <section className="analysis-section">
              <h2 className="analysis-section-title">ATS layout score</h2>
              <p className="auth-subtitle">
                Score: <strong>{atsLayout.ats_layout_score}</strong>
              </p>
              {Array.isArray(atsLayout.issues) && atsLayout.issues.length > 0 ? (
                <ul className="analysis-skill-list">
                  {atsLayout.issues.map((issue, i) => (
                    <li key={`${issue}-${i}`}>{issue}</li>
                  ))}
                </ul>
              ) : (
                <p className="analysis-empty">No formatting issues detected.</p>
              )}
            </section>
          )}

          <section className="analysis-section">
            <h2 className="analysis-section-title">ATS resume templates</h2>
            {templatesLoading && <p className="analysis-empty">Generating templates...</p>}
            {templatesError && <p className="auth-error">{templatesError}</p>}
            {!templatesLoading && !templatesError && templates.length === 0 && (
              <p className="analysis-empty">No templates available yet.</p>
            )}
            {templates.map((tpl) => (
              <div key={tpl.id} className="analysis-result-card" style={{ marginTop: '1rem' }}>
                <h3 className="analysis-section-title" style={{ marginTop: 0 }}>
                  {tpl.title}
                </h3>
                <div dangerouslySetInnerHTML={{ __html: tpl.html }} />
              </div>
            ))}
          </section>

        </div>
      </main>
    </div>
  );
};

export default AnalysisResultPage;

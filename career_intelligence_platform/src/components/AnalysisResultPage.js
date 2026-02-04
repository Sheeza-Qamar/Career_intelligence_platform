import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { API_BASE } from '../config';

const AnalysisResultPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const logoPattern = `/web_logo.png`;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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


  if (loading) {
    return (
      <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
        <Sidebar />
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
        <Sidebar />
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

  // Extract skills by type for 3-section display
  const missingGaps = data.gaps?.filter((g) => g.gap_type === 'missing') ?? [];
  const otherSkillsGaps = data.gaps?.filter((g) => g.gap_type === 'weak') ?? [];
  
  // Get appreciated skills from API response
  const appreciatedSkills = Array.isArray(data.appreciated_core_skills) 
    ? data.appreciated_core_skills 
    : [];

  return (
    <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
      <Sidebar />
      <Navbar />

      <main className="auth-main analysis-result-main">
        {/* Job Role Selector - Separate Card */}
        <div className="analysis-section-card">
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
        </div>

        {reAnalyzing && (
          <div className="analysis-result-loader">
            <div className="analysis-result-loader-spinner" />
            <p className="analysis-result-loader-text">Analyzing for selected role...</p>
          </div>
        )}

        {/* Analysis Summary - Separate Card */}
        <div className="analysis-section-card">
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
        </div>

          {/* Section 1: Appreciated Core Skills */}
          <div className="analysis-section-card">
            <section className="analysis-section">
              <h2 className="analysis-section-title">✅ Appreciated Core & Technical Skills</h2>
              <p className="analysis-section-subtitle">
                Skills present in your resume that are highly valued for {data.job_role_title} role
              </p>
              {appreciatedSkills.length === 0 && missingGaps.length === 0 && otherSkillsGaps.length === 0 ? (
                <p className="analysis-empty">No skills data available yet.</p>
              ) : appreciatedSkills.length === 0 ? (
                <p className="analysis-empty">Analyzing your skills...</p>
              ) : (
                <ul className="analysis-skill-list">
                  {appreciatedSkills.map((skill, idx) => (
                    <li key={idx} className="skill-appreciated">✓ {skill}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Section 2: Missing Core Skills */}
          <div className="analysis-section-card">
            <section className="analysis-section">
              <h2 className="analysis-section-title">❌ Missing Core & Technical Skills</h2>
              <p className="analysis-section-subtitle">
                Critical skills required for {data.job_role_title} role that are missing from your resume
              </p>
              {missingGaps.length === 0 ? (
                <p className="analysis-empty">Great! No missing core skills.</p>
              ) : (
                <ul className="analysis-skill-list">
                  {missingGaps.map((g) => (
                    <li key={g.skill_id} className="skill-missing">✗ {g.skill_name}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Section 3: Other Skills */}
          {otherSkillsGaps.length > 0 && (
            <div className="analysis-section-card">
              <section className="analysis-section">
                <h2 className="analysis-section-title">ℹ️ Other Skills</h2>
                <p className="analysis-section-subtitle">
                  Nice-to-have skills that are not critical but would be beneficial
                </p>
                <ul className="analysis-skill-list">
                  {otherSkillsGaps.map((g) => (
                    <li key={g.skill_id} className="skill-other">• {g.skill_name}</li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {/* Learning Roadmap Section */}
          <div className="analysis-section-card">
            <section className="analysis-section">
              <h2 className="analysis-section-title">📚 Learning Roadmap</h2>
              <p className="analysis-section-subtitle">
                Step-by-step learning path for missing core skills
              </p>
              {!data.roadmap?.length ? (
                <p className="analysis-empty">No roadmap items available.</p>
              ) : (
                <div className="analysis-roadmap-container">
                  {data.roadmap.map((r, i) => {
                    // Parse roadmap data
                    const steps = Array.isArray(r.steps) ? r.steps : [];
                    const resources = Array.isArray(r.resources) ? r.resources : 
                      (r.resource_url ? [{ title: r.resource_title || 'Resource', url: r.resource_url, type: 'tutorial', thumbnail: '' }] : []);
                    const projectIdeas = Array.isArray(r.project_ideas) ? r.project_ideas : [];
                    
                    return (
                      <div key={i} className="analysis-roadmap-item-wrapper">
                        <h3 className="analysis-roadmap-skill-title">{r.skill_name}</h3>
                        
                        <div className="analysis-roadmap-content-grid">
                          {/* Learning Steps */}
                          {steps.length > 0 && (
                            <div className="analysis-roadmap-steps">
                              <h4 className="analysis-roadmap-subtitle">Learning Steps:</h4>
                              <ol className="analysis-roadmap-steps-list">
                                {steps.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                          
                          {/* Resources with YouTube Thumbnails */}
                          {resources.length > 0 && (
                            <div className="analysis-roadmap-resources">
                              <h4 className="analysis-roadmap-subtitle">Resources:</h4>
                              <div className="analysis-resources-grid">
                                {resources.map((resource, idx) => {
                                  const isYouTube = resource.url && (resource.url.includes('youtube.com') || resource.url.includes('youtu.be'));
                                  return (
                                    <a
                                      key={idx}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="analysis-resource-card"
                                    >
                                      {isYouTube && resource.thumbnail && (
                                        <img 
                                          src={resource.thumbnail} 
                                          alt={resource.title}
                                          className="analysis-resource-thumbnail"
                                          onError={(e) => { 
                                            // Fallback: Hide thumbnail if it fails to load
                                            e.target.style.display = 'none';
                                            // Optionally show a placeholder icon
                                            const parent = e.target.parentElement;
                                            if (parent && !parent.querySelector('.youtube-placeholder')) {
                                              const placeholder = document.createElement('div');
                                              placeholder.className = 'youtube-placeholder';
                                              placeholder.innerHTML = '▶';
                                              placeholder.style.cssText = 'width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; background: rgba(148, 163, 184, 0.2); color: #9ca3af; font-size: 2rem;';
                                              parent.insertBefore(placeholder, e.target);
                                            }
                                          }}
                                        />
                                      )}
                                      {isYouTube && !resource.thumbnail && (
                                        <div className="youtube-placeholder" style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(148, 163, 184, 0.2)', color: '#9ca3af', fontSize: '2rem' }}>
                                          ▶
                                        </div>
                                      )}
                                      <div className="analysis-resource-content">
                                        <span className="analysis-resource-title">{resource.title}</span>
                                        <span className="analysis-resource-type">{resource.type || 'tutorial'}</span>
                                      </div>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Project Ideas */}
                          {projectIdeas.length > 0 && (
                            <div className="analysis-roadmap-projects">
                              <h4 className="analysis-roadmap-subtitle">Project Ideas:</h4>
                              <ul className="analysis-project-ideas-list">
                                {projectIdeas.map((project, idx) => {
                                  const projectObj = typeof project === 'string' 
                                    ? { title: project, description: '', difficulty: 'intermediate' }
                                    : project;
                                  return (
                                    <li key={idx} className="analysis-project-item">
                                      <strong>{projectObj.title}</strong>
                                      {projectObj.description && (
                                        <p className="analysis-project-description">{projectObj.description}</p>
                                      )}
                                      {projectObj.difficulty && (
                                        <span className={`analysis-project-difficulty difficulty-${projectObj.difficulty}`}>
                                          {projectObj.difficulty}
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AnalysisResultPage;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import '../App.css';
import Navbar from './Navbar';
import { API_BASE } from '../config';

const AnalysisResultPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchAnalysis = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/analyses/${id}`);
        if (!cancelled) setData(res.data);
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
      <div className="app-root auth-page">
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
      <div className="app-root auth-page">
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

  const missingGaps = data.gaps?.filter((g) => g.gap_type === 'missing') ?? [];
  const weakGaps = data.gaps?.filter((g) => g.gap_type === 'weak') ?? [];
  const matchedCount = (data.gaps?.length ?? 0) === 0 ? 0 : Math.round((data.match_score / 100) * (data.gaps?.length + missingGaps.length + weakGaps.length)) || 0;

  return (
    <div className="app-root auth-page">
      <Navbar />

      <main className="auth-main analysis-result-main">
        <div className="analysis-result-card">
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

          <p className="upload-links">
            <Link to="/upload" className="link-ghost">
              Upload & analyze another resume
            </Link>
            <Link to="/" className="link-ghost" style={{ marginLeft: '1rem' }}>
              Home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default AnalysisResultPage;

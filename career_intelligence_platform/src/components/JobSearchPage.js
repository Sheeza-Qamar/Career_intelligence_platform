import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';
import { API_BASE } from '../config';
import { getJobSearchCache, setJobSearchCache } from '../utils/jobSearchCache';

const JobSearchPage = () => {
  const [jobRole, setJobRole] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [searchStats, setSearchStats] = useState(null);
  const [isCached, setIsCached] = useState(false);

  // Restore last search results when user comes back (valid for 7 days)
  useEffect(() => {
    const cached = getJobSearchCache();
    if (!cached) return;
    if (cached.jobRole) setJobRole(cached.jobRole);
    if (cached.location) setLocation(cached.location);
    if (Array.isArray(cached.jobs) && cached.jobs.length > 0) {
      setJobs(cached.jobs);
      setSearchStats({
        total: cached.total_jobs ?? cached.jobs.length,
        indeed: cached.indeed_count ?? 0,
        linkedin: cached.linkedin_count ?? 0,
      });
      setIsCached(!!cached.cached);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!jobRole.trim() || !location.trim()) {
      setError('Please enter both job role and location.');
      return;
    }

    setError('');
    setLoading(true);
    setJobs([]);
    setSearchStats(null);
    setIsCached(false);

    try {
      const response = await axios.post(
        `${API_BASE}/api/job-search`,
        {
          job_role: jobRole.trim(),
          location: location.trim()
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 300000 // 5 minutes timeout
        }
      );

      if (response.data.success) {
        const jobsList = response.data.jobs || [];
        const stats = {
          total: response.data.total_jobs || 0,
          indeed: response.data.indeed_count || 0,
          linkedin: response.data.linkedin_count || 0
        };
        setJobs(jobsList);
        setSearchStats(stats);
        setIsCached(response.data.cached || false);
        // Save to cache so results persist when user navigates away (7 days)
        setJobSearchCache({
          jobRole: jobRole.trim(),
          location: location.trim(),
          jobs: jobsList,
          total_jobs: stats.total,
          indeed_count: stats.indeed,
          linkedin_count: stats.linkedin,
          cached: response.data.cached || false
        });
      } else {
        setError(response.data.message || 'Failed to search jobs.');
      }
    } catch (err) {
      console.error('Job search error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again with a more specific search.');
      } else {
        setError('Failed to search jobs. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-search-container">
      <div className="job-search-content">
        <div className="job-search-header">
          <h1 className="job-search-title">Find Your Dream Job</h1>
          <p className="job-search-subtitle">
            Search for opportunities on LinkedIn and Indeed
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="job-search-form">
          <div className="job-search-form-row">
            <div className="job-search-form-group">
              <label htmlFor="jobRole" className="job-search-label">
                Job Role / Title
              </label>
              <input
                type="text"
                id="jobRole"
                className="job-search-input"
                placeholder="e.g., Software Engineer, Data Scientist"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="job-search-form-group">
              <label htmlFor="location" className="job-search-label">
                Location
              </label>
              <input
                type="text"
                id="location"
                className="job-search-input"
                placeholder="e.g., San Francisco, CA or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="job-search-form-group job-search-form-group-button">
              <button
                type="submit"
                className="job-search-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="job-search-spinner"></span>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Jobs
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="job-search-error">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Search Stats */}
        {searchStats && (
          <div className="job-search-stats">
            {isCached && (
              <span className="job-search-cache-badge">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Cached Results
              </span>
            )}
            <span className="job-search-stat-item">
              <strong>{searchStats.total}</strong> Total Jobs
            </span>
            <span className="job-search-stat-item">
              <strong>{searchStats.linkedin}</strong> from LinkedIn
            </span>
            <span className="job-search-stat-item">
              <strong>{searchStats.indeed}</strong> from Indeed
            </span>
          </div>
        )}

        {/* Jobs Table */}
        {jobs.length > 0 && (
          <div className="job-search-results">
            <div className="job-search-table-container">
              <table className="job-search-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Job Title</th>
                    <th>Location</th>
                    <th>Employment Type</th>
                    <th>Source</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, index) => (
                    <tr key={index}>
                      <td className="job-search-company">
                        {job.company_logo_url && (
                          <img
                            src={job.company_logo_url}
                            alt={job.company_name}
                            className="job-search-company-logo"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <span>{job.company_name}</span>
                      </td>
                      <td className="job-search-title-cell">
                        <strong>{job.job_title}</strong>
                      </td>
                      <td>{job.location}</td>
                      <td>
                        <span className="job-search-badge">
                          {job.employment_type}
                        </span>
                      </td>
                      <td>
                        <span className={`job-search-source-badge job-search-source-${job.source}`}>
                          {job.source === 'linkedin' ? 'LinkedIn' : 'Indeed'}
                        </span>
                      </td>
                      <td>
                        <a
                          href={job.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="job-search-apply-btn"
                        >
                          Apply
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && !error && searchStats === null && (
          <div className="job-search-empty">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3>Start Your Job Search</h3>
            <p>Enter a job role and location above to find opportunities</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearchPage;

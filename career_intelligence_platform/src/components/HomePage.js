import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import Navbar from './Navbar';

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Add class to html and body to hide scrollbar
    document.documentElement.classList.add('landing-page-active');
    document.body.classList.add('landing-page-active');

    // Smooth scroll for navigation links
    const handleAnchorClick = (e) => {
      const href = e.target.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
      link.addEventListener('click', handleAnchorClick);
    });

    return () => {
      // Remove class when component unmounts
      document.documentElement.classList.remove('landing-page-active');
      document.body.classList.remove('landing-page-active');
      anchorLinks.forEach(link => {
        link.removeEventListener('click', handleAnchorClick);
      });
    };
  }, []);

  const handleCTAClick = () => {
    // Check if user is logged in
    const user = localStorage.getItem('authUser');
    if (user) {
      navigate('/upload');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-container">
          {/* Left Content */}
          <div className="landing-hero-left">
            <div className="landing-hero-content">
              <div className="landing-hero-badge">
                <span className="landing-badge-dot"></span>
                Intelligent Career Guidance
              </div>
              <h1 className="landing-hero-title">
                Your <span className="gradient-text">Career Intelligence</span> Partner
              </h1>
              <div className="landing-hero-line"></div>
              <p className="landing-hero-subtitle">
                Harness the power of AI-driven insights to analyze your CV, master job matching, optimize for ATS systems, and land your dream role with actionable intelligence at every step.
              </p>
            </div>
            {/* CTA Buttons */}
            <div className="landing-hero-actions">
              <button onClick={handleCTAClick} className="landing-cta-main-btn">
                <span>Unlock Your Potential</span>
                <svg className="w-5 h-5 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button className="landing-cta-secondary-btn">
                Watch Demo
                <svg className="w-5 h-5 inline ml-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            {/* Trust Indicators */}
            <div className="landing-trust-indicators">
              <div className="landing-avatars">
                <div className="landing-avatar avatar-1"></div>
                <div className="landing-avatar avatar-2"></div>
                <div className="landing-avatar avatar-3"></div>
              </div>
              <p className="landing-trust-text">Join 5,000+ professionals transforming their careers</p>
            </div>
          </div>

          {/* Right Visual */}
          <div className="landing-hero-right">
            <div className="landing-floating-bg"></div>
            {/* Floating Cards */}
            <div className="landing-cards-container">
              {/* Card 1 */}
              <div className="landing-card card-1">
                <div className="landing-card-header">
                  <div className="landing-card-icon">⚡</div>
                  <div>
                    <p className="landing-card-title">Job Fitness</p>
                    <p className="landing-card-subtitle">94% Match</p>
                  </div>
                </div>
                <div className="landing-progress-bar">
                  <div className="landing-progress-fill" style={{ width: '94%' }}></div>
                </div>
              </div>
              {/* Card 2 */}
              <div className="landing-card card-2">
                <div className="landing-card-header">
                  <div className="landing-card-icon">✓</div>
                  <div>
                    <p className="landing-card-title">ATS Score</p>
                    <p className="landing-card-subtitle">85% Compatible</p>
                  </div>
                </div>
                <div className="landing-progress-bar">
                  <div className="landing-progress-fill progress-blue" style={{ width: '85%' }}></div>
                </div>
              </div>
              {/* Card 3 */}
              <div className="landing-card card-3">
                <div className="landing-card-header">
                  <div className="landing-card-icon">📊</div>
                  <div>
                    <p className="landing-card-title">Career Path</p>
                    <p className="landing-card-subtitle">3 Recommendations</p>
                  </div>
                </div>
                <div className="landing-card-icons">
                  <div className="landing-icon-box">💼</div>
                  <div className="landing-icon-box">🎯</div>
                  <div className="landing-icon-box">🚀</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="landing-section">
        <div className="landing-section-divider"></div>
        <div className="landing-section-header">
          <div className="landing-section-badge">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Our Vision
          </div>
          <h2 className="landing-section-title">
            Empowering Your <span className="gradient-text">Career Journey</span>
          </h2>
          <p className="landing-section-description">
            We believe every professional deserves intelligent tools to understand their market value, showcase their strengths, and navigate their career path with confidence. Our platform transforms career growth from guesswork into data-driven strategy.
          </p>
        </div>
        {/* Vision Pillars */}
        <div className="landing-pillars-grid">
          <div className="landing-pillar-card">
            <div className="landing-pillar-icon">🧠</div>
            <h3 className="landing-pillar-title">Intelligent Insight</h3>
            <p className="landing-pillar-description">
              AI-powered analysis that reveals hidden opportunities, matches you with roles aligned to your unique skills, and provides personalized growth recommendations.
            </p>
          </div>
          <div className="landing-pillar-card">
            <div className="landing-pillar-icon">🎯</div>
            <h3 className="landing-pillar-title">Strategic Precision</h3>
            <p className="landing-pillar-description">
              Optimize every aspect of your candidacy—from ATS compatibility to job fitness scores—ensuring you're positioned perfectly for every opportunity.
            </p>
          </div>
          <div className="landing-pillar-card">
            <div className="landing-pillar-icon">🚀</div>
            <h3 className="landing-pillar-title">Accelerated Growth</h3>
            <p className="landing-pillar-description">
              Move faster in your career with actionable intelligence, learning recommendations, and job opportunities that match your ambitions and skill level.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-section">
        <div className="landing-section-divider"></div>
        <div className="landing-section-header">
          <div className="landing-section-badge">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 012-2h6a2 2 0 012 2v2h4a1 1 0 010 2h-.089l1.476 7.378A2 2 0 0116.364 15H3.636a2 2 0 01-1.99-2.244L1.089 7H1a1 1 0 010-2h4V3zm0 2v2h10V5H5z" />
            </svg>
            Powerful Tools
          </div>
          <h2 className="landing-section-title">
            Four Essential <span className="gradient-text">Capabilities</span>
          </h2>
          <p className="landing-section-description">
            Everything you need to master your career progression in one intelligent platform
          </p>
        </div>
        {/* Features Grid */}
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-header">
              <div className="landing-feature-icon-large">⚡</div>
              <div className="landing-feature-arrow">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
            <h3 className="landing-feature-title">Job Fitness Analysis</h3>
            <p className="landing-feature-description">
              Upload your CV and discover your match percentage for any role. Get personalized skill recommendations with curated learning resources to bridge gaps.
            </p>
            <ul className="landing-feature-list">
              <li><span className="landing-list-dot dot-green"></span> Match scoring algorithm</li>
              <li><span className="landing-list-dot dot-green"></span> Skill gap identification</li>
              <li><span className="landing-list-dot dot-green"></span> Learning path recommendations</li>
            </ul>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-header">
              <div className="landing-feature-icon-large">✓</div>
              <div className="landing-feature-arrow">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
            <h3 className="landing-feature-title">ATS Compatibility Check</h3>
            <p className="landing-feature-description">
              Know exactly how ATS systems will parse your resume. Get a detailed compatibility score and actionable feedback to ensure you pass the first filter.
            </p>
            <ul className="landing-feature-list">
              <li><span className="landing-list-dot dot-blue"></span> Formatting analysis</li>
              <li><span className="landing-list-dot dot-blue"></span> Keyword optimization tips</li>
              <li><span className="landing-list-dot dot-blue"></span> Issue prioritization</li>
            </ul>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-header">
              <div className="landing-feature-icon-large">📄</div>
              <div className="landing-feature-arrow">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
            <h3 className="landing-feature-title">ATS Resume Generator</h3>
            <p className="landing-feature-description">
              Generate ATS-optimized resumes automatically. Edit, customize, and download in seconds—ensuring your resume works perfectly with every tracking system.
            </p>
            <ul className="landing-feature-list">
              <li><span className="landing-list-dot dot-purple"></span> Smart formatting</li>
              <li><span className="landing-list-dot dot-purple"></span> Real-time editing</li>
              <li><span className="landing-list-dot dot-purple"></span> PDF download</li>
            </ul>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-header">
              <div className="landing-feature-icon-large">💼</div>
              <div className="landing-feature-arrow">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
            <h3 className="landing-feature-title">Intelligent Job Finder</h3>
            <p className="landing-feature-description">
              Discover opportunities matched to your skills and aspirations. Apply directly to LinkedIn jobs with complete company and role information at a glance.
            </p>
            <ul className="landing-feature-list">
              <li><span className="landing-list-dot dot-pink"></span> Smart filtering</li>
              <li><span className="landing-list-dot dot-pink"></span> LinkedIn integration</li>
              <li><span className="landing-list-dot dot-pink"></span> One-click apply</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="landing-section">
        <div className="landing-section-divider"></div>
        <div className="landing-stats-grid">
          <div className="landing-stat-item">
            <div className="landing-stat-number">5K+</div>
            <p className="landing-stat-label">Active Users</p>
          </div>
          <div className="landing-stat-item">
            <div className="landing-stat-number">1.5K+</div>
            <p className="landing-stat-label">Jobs Matched</p>
          </div>
          <div className="landing-stat-item">
            <div className="landing-stat-number">92%</div>
            <p className="landing-stat-label">Avg Match Score</p>
          </div>
          <div className="landing-stat-item">
            <div className="landing-stat-number">500+</div>
            <p className="landing-stat-label">Users Hired</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-section">
        <div className="landing-section-divider"></div>
        <div className="landing-cta-section">
          <div className="landing-cta-content">
            <h2 className="landing-cta-title">Ready to Transform Your Career?</h2>
            <p className="landing-cta-description">
              Join thousands of professionals who've already unlocked their career potential with intelligent insights, personalized recommendations, and strategic job matching.
            </p>
            <div className="landing-cta-buttons">
              <button onClick={handleCTAClick} className="landing-cta-primary">
                Start Free Today
                <svg className="w-5 h-5 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button className="landing-cta-secondary-white">
                Schedule Demo
              </button>
            </div>
            <p className="landing-cta-note">No credit card required. Start analyzing in under 2 minutes.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-section-divider"></div>
        <div className="landing-footer-grid">
          <div>
            <div className="landing-footer-logo">
              <div className="landing-footer-logo-icon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="landing-footer-logo-text">Career Intelligence</span>
            </div>
            <p className="landing-footer-description">Empowering careers through intelligent insights.</p>
          </div>
          <div>
            <h4 className="landing-footer-title">Product</h4>
            <ul className="landing-footer-links">
              <li><a href="#features" className="landing-footer-link">Features</a></li>
              <li><a href="#" className="landing-footer-link">Pricing</a></li>
              <li><a href="#" className="landing-footer-link">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="landing-footer-title">Company</h4>
            <ul className="landing-footer-links">
              <li><a href="#" className="landing-footer-link">About</a></li>
              <li><a href="#" className="landing-footer-link">Blog</a></li>
              <li><a href="#" className="landing-footer-link">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="landing-footer-title">Connect</h4>
            <ul className="landing-footer-links">
              <li><a href="#" className="landing-footer-link">Twitter</a></li>
              <li><a href="#" className="landing-footer-link">LinkedIn</a></li>
              <li><a href="#" className="landing-footer-link">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="landing-section-divider"></div>
        <div className="landing-footer-bottom">
          <p>© 2024 Career Intelligence Platform. All rights reserved.</p>
          <div className="landing-footer-bottom-links">
            <a href="#" className="landing-footer-link">Privacy Policy</a>
            <a href="#" className="landing-footer-link">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

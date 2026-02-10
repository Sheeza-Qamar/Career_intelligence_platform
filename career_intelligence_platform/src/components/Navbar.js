import React, { useEffect, useState, memo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import '../App.css';

const Navbar = memo(() => {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const loadUserFromStorage = () => {
    try {
      const raw = localStorage.getItem('authUser');
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUserFromStorage();

    const handleAuthChanged = () => loadUserFromStorage();
    window.addEventListener('auth-changed', handleAuthChanged);
    window.addEventListener('storage', handleAuthChanged);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChanged);
      window.removeEventListener('storage', handleAuthChanged);
    };
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      window.dispatchEvent(new Event('auth-changed'));
    } catch (e) {
      console.warn('Failed to clear auth data', e);
    }

    navigate('/login');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const displayName = user?.name || user?.email || '';
  const firstInitial = displayName ? displayName.trim().charAt(0).toUpperCase() : '';

  return (
    <nav className="landing-nav">
      <div className="landing-nav-container">
        <Link to="/" className="landing-nav-logo">
          <span className="landing-nav-mark">
            <img
              src="/web_logo.png"
              alt="Career Intelligence logo"
              className="landing-nav-logo-image"
            />
          </span>
          <span className="landing-nav-brand-text">
            <span className="landing-nav-title">Career Intelligence</span>
            <span className="landing-nav-subtitle">Smart Resume Analyzer</span>
          </span>
        </Link>
        <div className="landing-nav-links">
          <NavLink
            to="/upload"
            className={({ isActive }) => `landing-nav-link ${isActive ? 'active' : ''}`}
          >
            Upload Resume
          </NavLink>
          <NavLink
            to="/analyze"
            className={({ isActive }) => `landing-nav-link ${isActive ? 'active' : ''}`}
          >
            Job Fitness
          </NavLink>
          <NavLink
            to="/ats-compatibility"
            className={({ isActive }) => `landing-nav-link ${isActive ? 'active' : ''}`}
          >
            ATS Compatibility
          </NavLink>
          <NavLink
            to="/ats-generate"
            className={({ isActive }) => `landing-nav-link ${isActive ? 'active' : ''}`}
          >
            Generate ATS Resume
          </NavLink>
          <NavLink
            to="/job-search"
            className={({ isActive }) => `landing-nav-link ${isActive ? 'active' : ''}`}
          >
            Find Jobs
          </NavLink>
        </div>

        {/* Mobile hamburger + auth on the right */}
        <div className="landing-nav-right">
          {!user && (
            <div className="landing-nav-auth-buttons landing-nav-auth-buttons-desktop">
              <Link to="/login" className="landing-nav-link landing-nav-link-btn">
                Login
              </Link>
              <Link to="/signup" className="landing-cta-nav-btn">
                Sign up
              </Link>
            </div>
          )}

          {user && (
            <div className="landing-nav-user landing-nav-user-desktop">
              <div className="landing-avatar-circle">{firstInitial}</div>
              <div className="landing-nav-user-info">
                <span className="landing-nav-username">{displayName}</span>
                <button
                  type="button"
                  className="landing-nav-logout"
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="landing-nav-mobile-toggle"
            aria-label="Toggle navigation"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <span className="landing-nav-mobile-line" />
            <span className="landing-nav-mobile-line" />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobileMenuOpen && (
        <div className="landing-nav-mobile-menu">
          <NavLink
            to="/upload"
            className={({ isActive }) => `landing-nav-mobile-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Upload Resume
          </NavLink>
          <NavLink
            to="/analyze"
            className={({ isActive }) => `landing-nav-mobile-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Job Fitness
          </NavLink>
          <NavLink
            to="/ats-compatibility"
            className={({ isActive }) => `landing-nav-mobile-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            ATS Compatibility
          </NavLink>
          <NavLink
            to="/ats-generate"
            className={({ isActive }) => `landing-nav-mobile-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Generate ATS Resume
          </NavLink>
          <NavLink
            to="/job-search"
            className={({ isActive }) => `landing-nav-mobile-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Find Jobs
          </NavLink>

          {!user && (
            <div className="landing-nav-mobile-auth">
              <Link
                to="/login"
                className="landing-nav-mobile-link"
                onClick={closeMobileMenu}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="landing-nav-mobile-link primary"
                onClick={closeMobileMenu}
              >
                Sign up
              </Link>
            </div>
          )}

          {user && (
            <button
              type="button"
              className="landing-nav-mobile-link"
              onClick={() => {
                closeMobileMenu();
                handleLogout();
              }}
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;


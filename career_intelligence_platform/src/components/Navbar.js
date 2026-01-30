import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
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

  const displayName = user?.name || user?.email || '';
  const firstInitial = displayName ? displayName.trim().charAt(0).toUpperCase() : '';

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <span className="navbar-mark">
            <img
              src={`${process.env.PUBLIC_URL}/web_logo.png`}
              alt="Career Intelligence logo"
              className="navbar-logo-image"
            />
          </span>
          <span className="navbar-brand-text">
            <span className="navbar-title">Career Intelligence</span>
            <span className="navbar-subtitle">Smart Resume Analyzer</span>
          </span>
        </Link>
      </div>

      <div className="navbar-center">
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/upload" className="nav-link">
          Upload
        </Link>
      </div>

      <div className="navbar-right">
        {!user && (
          <>
            <Link to="/login" className="btn btn-ghost">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Sign up
            </Link>
          </>
        )}

        {user && (
          <div className="navbar-user">
            <div className="avatar-circle">{firstInitial}</div>
            <div className="navbar-user-info">
              <span className="navbar-username">{displayName}</span>
              <button
                type="button"
                className="navbar-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


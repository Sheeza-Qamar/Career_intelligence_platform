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

  const firstInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : '';

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="navbar-logo">Career Intelligence</span>
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
            <span className="navbar-username">{user.name}</span>
            <button
              type="button"
              className="navbar-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


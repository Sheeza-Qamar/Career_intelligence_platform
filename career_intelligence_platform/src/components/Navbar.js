import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const Navbar = () => {
  const [user, setUser] = useState(null);

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
            <div className="avatar-circle">
              {firstInitial}
            </div>
            <span className="navbar-username">{user.name}</span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


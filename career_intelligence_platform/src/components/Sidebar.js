import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../App.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen) {
        const sidebar = document.querySelector('.sidebar');
        const hamburger = document.querySelector('.sidebar-toggle');
        if (sidebar && !sidebar.contains(e.target) && !hamburger?.contains(e.target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Hamburger Menu Button - 3 lines */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        <div className="hamburger-lines">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-content">
          <Link
            to="/upload"
            className={`sidebar-button ${isActive('/upload') || isActive('/analyze') || isActive('/analysis') ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Check Job Compatibility
          </Link>

          <Link
            to="/ats-compatibility"
            className={`sidebar-button ${isActive('/ats-compatibility') ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Check ATS Compatibility
          </Link>

          <Link
            to="/ats-generate"
            className={`sidebar-button ${isActive('/ats-generate') ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Generate ATS Resume
          </Link>

          <Link
            to="/"
            className={`sidebar-button ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Job Apply
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

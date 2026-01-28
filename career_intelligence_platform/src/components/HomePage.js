import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const HomePage = () => {
  return (
    <div className="app-root">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-logo">Career Intelligence</span>
        </div>
        <div className="navbar-right">
          <Link to="/login" className="btn btn-ghost">
            Login
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Sign up
          </Link>
        </div>
      </nav>

      <main className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Smart Resume Analyzer</h1>
          <p className="hero-subtitle">
            Upload your resume, choose a target role, and instantly see your skill match,
            gaps, and a personalized learning roadmap.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Learn More
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;


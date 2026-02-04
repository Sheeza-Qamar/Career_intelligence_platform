import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const HomePage = () => {
  const logoPattern = `/web_logo.png`;

  return (
    <div className="app-root" style={{ '--logo-pattern': `url(${logoPattern})` }}>
      <Sidebar />
      <Navbar />

      <main className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Smart Resume Analyzer</h1>
          <p className="hero-subtitle">
            Upload your resume, choose a target role, and instantly see your skill match,
            gaps, and a personalized learning roadmap.
          </p>
          <div className="hero-actions">
            <Link to="/upload" className="btn btn-primary">
              Upload Resume
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;


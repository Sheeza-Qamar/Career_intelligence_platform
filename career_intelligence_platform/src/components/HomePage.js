import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import Navbar from './Navbar';

const HomePage = () => {
  return (
    <div className="app-root">
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
            <Link to="/signup" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;


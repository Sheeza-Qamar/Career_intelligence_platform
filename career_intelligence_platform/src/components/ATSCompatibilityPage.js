import React from 'react';
import '../App.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const ATSCompatibilityPage = () => {
  const logoPattern = `/web_logo.png`;

  return (
    <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
      <Sidebar />
      <Navbar />

      <main className="auth-main">
  
      </main>
    </div>
  );
};

export default ATSCompatibilityPage;

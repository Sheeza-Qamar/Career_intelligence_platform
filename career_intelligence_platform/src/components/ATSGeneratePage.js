import React from 'react';
import '../App.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Builder from './resumeBuilder/builder';

const ATSGeneratePage = () => {
  const logoPattern = `/web_logo.png`;

  return (
    <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
      <Sidebar />
      <Navbar />

      <main className="auth-main" style={{ padding: 0, overflow: 'hidden' }}>
        <Builder />
      </main>
    </div>
  );
};

export default ATSGeneratePage;

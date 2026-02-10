import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import UploadResumePage from './components/UploadResumePage';
import AnalyzePage from './components/AnalyzePage';
import AnalysisResultPage from './components/AnalysisResultPage';
import ATSCompatibilityPage from './components/ATSCompatibilityPage';
import ATSGeneratePage from './components/ATSGeneratePage';
import JobSearchPage from './components/JobSearchPage';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />
        <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
        <Route path="/upload" element={<Layout><UploadResumePage /></Layout>} />
        <Route path="/analyze" element={<Layout><AnalyzePage /></Layout>} />
        <Route path="/analysis/:id" element={<Layout><AnalysisResultPage /></Layout>} />
        <Route path="/ats-compatibility" element={<Layout><ATSCompatibilityPage /></Layout>} />
        <Route path="/ats-generate" element={<Layout><ATSGeneratePage /></Layout>} />
        <Route path="/job-search" element={<Layout><JobSearchPage /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;

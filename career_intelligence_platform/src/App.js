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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/upload" element={<UploadResumePage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/analysis/:id" element={<AnalysisResultPage />} />
        <Route path="/ats-compatibility" element={<ATSCompatibilityPage />} />
        <Route path="/ats-generate" element={<ATSGeneratePage />} />
      </Routes>
    </Router>
  );
}

export default App;

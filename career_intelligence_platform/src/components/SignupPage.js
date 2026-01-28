import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

const API_BASE = 'http://localhost:5000';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/auth/signup`, {
        name,
        email,
        password,
      });
      setSuccess('Account created successfully.');
      console.log('Signup response:', res.data);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Signup failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root auth-page">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-logo">Career Intelligence</span>
        </div>
      </nav>

      <main className="auth-main">
        <div className="auth-card">
          <h1 className="auth-title">Sign up</h1>
          <p className="auth-subtitle">Create your account to get started.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-label">
              Name
              <input
                type="text"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="auth-label">
              Email
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="auth-label">
              Password
              <input
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className="auth-error">{error}</p>}
            {success && <p className="auth-success">{success}</p>}

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SignupPage;


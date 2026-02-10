import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { API_BASE } from '../config';

const LoginPage = () => {
  const navigate = useNavigate();
  const logoPattern = `/web_logo.png`;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
      });

      const { user, token } = res.data || {};

      if (user && token) {
        try {
          localStorage.setItem('authUser', JSON.stringify(user));
          localStorage.setItem('authToken', token);
          window.dispatchEvent(new Event('auth-changed'));
        } catch (e) {
          console.warn('Failed to persist auth data', e);
        }
      }

      setSuccess('Logged in successfully.');
      console.log('Login response:', res.data);
      navigate('/');
    } catch (err) {
      const message =
        err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="app-root auth-page login-page-bg" 
      style={{ 
        '--logo-pattern': `url(${logoPattern})`,
        backgroundImage: 'url(/career.png)'
      }}
    >
      <main className="auth-main">
        <div className="auth-card">
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Welcome back. Sign in to continue.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
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
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  &#128065;
                </button>
              </div>
            </label>

            {error && <p className="auth-error">{error}</p>}
            {success && <p className="auth-success">{success}</p>}

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;


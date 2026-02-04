import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { API_BASE } from '../config';

const SignupPage = () => {
  const navigate = useNavigate();
  const logoPattern = `/web_logo.png`;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password validation: 8 chars, 1 uppercase, 1 number, 1 special character
  const passwordValid = useMemo(() => {
    const lengthOk = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return lengthOk && hasUppercase && hasNumber && hasSpecial;
  }, [password]);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const canSubmit = passwordValid && passwordsMatch && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordValid) {
      setError(
        'Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character.'
      );
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API_BASE}/api/auth/signup`, {
        name,
        email,
        password,
      });

      setSuccess('Signup successful. You can now login with your credentials.');
      setError('');

      // Optionally clear fields except email
      setPassword('');
      setConfirmPassword('');
      setPasswordTouched(false);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Signup failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root auth-page" style={{ '--logo-pattern': `url(${logoPattern})` }}>
      <Sidebar />
      <Navbar />

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
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={(e) => {
                    if (!passwordTouched) setPasswordTouched(true);
                    setPassword(e.target.value);
                  }}
                  onFocus={() => setPasswordTouched(true)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {/* Eye icon (always visible, white from CSS) */}
                  &#128065;
                </button>
              </div>
            </label>

            {passwordTouched && !passwordValid && (
              <p className="password-hint">
                Password must be at least 8 characters, include 1 uppercase letter, 1
                number, and 1 special character.
              </p>
            )}

            <label className="auth-label">
              Confirm Password
              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!passwordValid}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  &#128065;
                </button>
              </div>
            </label>

            {error && <p className="auth-error">{error}</p>}
            {success && (
              <div className="auth-success">
                {success}{' '}
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginLeft: '0.25rem', padding: '0.15rem 0.6rem', fontSize: '0.8rem' }}
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </button>
              </div>
            )}

            <button
              className="btn btn-primary auth-submit"
              type="submit"
              disabled={!canSubmit}
            >
              {loading ? 'Signing up...' : 'Sign up'}
            </button>

            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#a5b4fc', textDecoration: 'underline' }}>
                Login
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SignupPage;


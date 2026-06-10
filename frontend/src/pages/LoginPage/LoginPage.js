import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (user) {
    if (user.role === 'BILLBOARD_OWNER') navigate('/dashboard/owner', { replace: true });
    else if (user.role === 'BUSINESS') navigate('/dashboard/business', { replace: true });
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const role = await login(form.email, form.password);
      if (role === 'BILLBOARD_OWNER') navigate('/dashboard/owner');
      else if (role === 'BUSINESS') navigate('/dashboard/business');
      else navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error;
      if (err.response?.status === 401 || err.response?.status === 404) {
        setError('Invalid email or password. Please try again.');
      } else if (msg) {
        setError(msg);
      } else {
        setError('Unable to connect to server. Make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left panel — branding */}
        <div className="login-left">
          <div className="login-left-content">
            <div className="login-logo">
              <svg width="56" height="56" viewBox="0 0 40 40" fill="none">
                <rect x="2" y="8" width="36" height="24" rx="4" fill="#3B82F6" stroke="#1E40AF" strokeWidth="2"/>
                <rect x="6" y="12" width="28" height="16" rx="2" fill="#60A5FA"/>
                <circle cx="32" cy="32" r="6" fill="#1E40AF"/>
                <rect x="29" y="35" width="6" height="3" fill="#374151"/>
              </svg>
            </div>
            <h2 className="login-brand-name">AdBoard Pro</h2>
            <p className="login-brand-tagline">Premium Billboard Marketplace</p>
            <div className="login-features">
              <div className="login-feature-item">
                <span className="lf-icon">📍</span>
                <span>10,000+ Premium Locations</span>
              </div>
              <div className="login-feature-item">
                <span className="lf-icon">👁</span>
                <span>5M+ Daily Impressions</span>
              </div>
              <div className="login-feature-item">
                <span className="lf-icon">📊</span>
                <span>Real-time Analytics</span>
              </div>
              <div className="login-feature-item">
                <span className="lf-icon">🔒</span>
                <span>Secure & Verified Platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="login-right">
          <div className="login-form-wrapper">
            <div className="login-header">
              <h1 className="login-title">Welcome Back</h1>
              <p className="login-subtitle">Sign in to your AdBoard Pro account</p>
            </div>

            {error && (
              <div className="login-error">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>Don't have an account?{' '}
                <Link to="/register" className="login-link">Create account</Link>
              </p>
              <Link to="/" className="back-home-link">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

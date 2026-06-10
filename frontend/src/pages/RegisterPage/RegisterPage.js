import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './RegisterPage.css';

const INITIAL_FORM = {
  role: '',
  companyName: '',
  companyAddress: '',
  gstNumber: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+=!]).{8,}$/;
const phoneRegex = /^\+91[6-9][0-9]{9}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const RegisterPage = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const selectRole = (role) => {
    setForm({ ...form, role });
    setFieldErrors((prev) => ({ ...prev, role: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.role) errors.role = 'Please select your role.';
    if (!form.companyName.trim()) errors.companyName = 'Company name is required.';
    if (!form.companyAddress.trim()) errors.companyAddress = 'Company address is required.';
    if (form.gstNumber && !gstRegex.test(form.gstNumber))
      errors.gstNumber = 'Invalid GST format (e.g. 22AAAAA0000A1Z5)';
    if (!form.firstName.trim()) errors.firstName = 'First name is required.';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!form.phone) errors.phone = 'Phone number is required.';
    else if (!phoneRegex.test(form.phone))
      errors.phone = 'Must be +91 followed by 10 digits starting with 6-9 (e.g. +919876543210)';
    if (!form.email) errors.email = 'Email is required.';
    if (!form.password) errors.password = 'Password is required.';
    else if (!passwordRegex.test(form.password))
      errors.password = 'Min 8 chars, 1 uppercase, 1 number, 1 special character (@#$%^&+=!)';
    if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword)
      errors.confirmPassword = 'Passwords do not match.';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.gstNumber) delete payload.gstNumber; // optional field
      const role = await register(payload);
      if (role === 'BILLBOARD_OWNER') navigate('/dashboard/owner');
      else if (role === 'BUSINESS') navigate('/dashboard/business');
      else navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error;
      if (err.response?.status === 409 || (msg && msg.toLowerCase().includes('email'))) {
        setFieldErrors({ email: 'This email is already registered.' });
      } else if (msg) {
        setError(msg);
      } else {
        setError('Unable to connect to server. Make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ name }) =>
    fieldErrors[name] ? <span className="field-error">{fieldErrors[name]}</span> : null;

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1 className="register-title">Create Your Account</h1>
          <p className="register-subtitle">
            Join AdBoard Pro — the premium billboard marketplace
          </p>
        </div>

        {error && (
          <div className="reg-error">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form" noValidate>

          {/* ── Step 1: Role Selection ── */}
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-number">1</span>
              I am a...
            </h2>
            <div className="role-cards">
              <div
                className={`role-card ${form.role === 'BILLBOARD_OWNER' ? 'selected' : ''}`}
                onClick={() => selectRole('BILLBOARD_OWNER')}
              >
                <div className="role-card-icon">🏙️</div>
                <h3>Billboard Owner</h3>
                <p>I own billboard locations and want to list them on the marketplace</p>
                {form.role === 'BILLBOARD_OWNER' && (
                  <span className="role-check">✓ Selected</span>
                )}
              </div>
              <div
                className={`role-card ${form.role === 'BUSINESS' ? 'selected' : ''}`}
                onClick={() => selectRole('BUSINESS')}
              >
                <div className="role-card-icon">🏢</div>
                <h3>Advertiser / Business</h3>
                <p>I want to advertise my brand on premium billboard locations</p>
                {form.role === 'BUSINESS' && (
                  <span className="role-check">✓ Selected</span>
                )}
              </div>
            </div>
            <FieldError name="role" />
          </div>

          {/* ── Step 2: Company Details ── */}
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-number">2</span>
              Company Details
            </h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Company Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.companyName ? 'input-error' : ''}`}
                  placeholder="Your company or business name"
                />
                <FieldError name="companyName" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Company Address <span className="required">*</span></label>
              <textarea
                name="companyAddress"
                value={form.companyAddress}
                onChange={handleChange}
                className={`form-textarea ${fieldErrors.companyAddress ? 'input-error' : ''}`}
                placeholder="Full registered company address"
                rows={3}
              />
              <FieldError name="companyAddress" />
            </div>
            <div className="form-group">
              <label className="form-label">
                GST Number
                <span className="optional-tag">Optional</span>
              </label>
              <input
                type="text"
                name="gstNumber"
                value={form.gstNumber}
                onChange={(e) => handleChange({ target: { name: 'gstNumber', value: e.target.value.toUpperCase() } })}
                className={`form-input ${fieldErrors.gstNumber ? 'input-error' : ''}`}
                placeholder="e.g. 22AAAAA0000A1Z5"
                maxLength={15}
              />
              <FieldError name="gstNumber" />
            </div>
          </div>

          {/* ── Step 3: Personal Details ── */}
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-number">3</span>
              Personal Details
            </h2>
            <div className="form-row two-cols">
              <div className="form-group">
                <label className="form-label">First Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.firstName ? 'input-error' : ''}`}
                  placeholder="First name"
                />
                <FieldError name="firstName" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.lastName ? 'input-error' : ''}`}
                  placeholder="Last name"
                />
                <FieldError name="lastName" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number <span className="required">*</span></label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={`form-input ${fieldErrors.phone ? 'input-error' : ''}`}
                placeholder="+919876543210"
              />
              <span className="field-hint">Format: +91 followed by 10 digits (6-9 start)</span>
              <FieldError name="phone" />
            </div>
          </div>

          {/* ── Step 4: Credentials ── */}
          <div className="form-section">
            <h2 className="section-title">
              <span className="section-number">4</span>
              Login Credentials
            </h2>
            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <FieldError name="email" />
            </div>
            <div className="form-row two-cols">
              <div className="form-group">
                <label className="form-label">Password <span className="required">*</span></label>
                <div className="input-pw-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                    placeholder="Create password"
                    autoComplete="new-password"
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                <span className="field-hint">Min 8 chars · 1 uppercase · 1 number · 1 special (@#$%^&+=!)</span>
                <FieldError name="password" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password <span className="required">*</span></label>
                <div className="input-pw-wrapper">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex="-1">
                    {showConfirm ? '🙈' : '👁'}
                  </button>
                </div>
                <FieldError name="confirmPassword" />
              </div>
            </div>
          </div>

          <button type="submit" className="register-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </>
            )}
          </button>

          <p className="register-login-link">
            Already have an account?{' '}
            <Link to="/login" className="reg-link">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

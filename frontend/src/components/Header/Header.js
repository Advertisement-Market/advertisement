import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'BILLBOARD_OWNER') return { path: '/dashboard/owner',    label: 'My Assets'    };
    if (user.role === 'BUSINESS')        return { path: '/dashboard/business', label: 'Marketplace'  };
    return null;
  };

  const dashLink = getDashboardLink();

  return (
    <header className="header">
      <div className="header-container">

        {/* Logo */}
        <Link to="/" className="brand-section" style={{ textDecoration: 'none' }}>
          <div className="logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="2" y="8" width="36" height="24" rx="4" fill="#3B82F6" stroke="#1E40AF" strokeWidth="2"/>
              <rect x="6" y="12" width="28" height="16" rx="2" fill="#60A5FA"/>
              <circle cx="32" cy="32" r="6" fill="#1E40AF"/>
              <rect x="29" y="35" width="6" height="3" fill="#374151"/>
            </svg>
          </div>
          <div className="brand-text">
            <h1 className="company-name">AdBoard Pro</h1>
            <p className="tagline">Premium Billboard Solutions</p>
          </div>
        </Link>

        {/* Search — hide on auth pages */}
        {!isAuthPage && (
          <div className="search-section">
            <form onSubmit={handleSearchSubmit} className="search-form">
              <div className="search-input-wrapper">
                <svg className="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search locations, billboards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-button">Search</button>
              </div>
            </form>
          </div>
        )}

        {/* Nav links */}
        {!isAuthPage && (
          <nav className="navigation">
            <div className="nav-links">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>
              {dashLink && (
                <Link
                  to={dashLink.path}
                  className={`nav-link ${location.pathname.startsWith('/dashboard') ? 'active' : ''}`}
                >
                  {dashLink.label}
                </Link>
              )}
              <a href="#services" className="nav-link">Services</a>
              <a href="#contact" className="nav-link">Contact</a>
            </div>
          </nav>
        )}

        {/* Auth section */}
        <div className="auth-section">
          {user ? (
            <div className="user-section">
              <div className="user-info">
                <span className="user-email">{user.email}</span>
                <span className={`role-badge ${user.role === 'BILLBOARD_OWNER' ? 'badge-owner' : 'badge-business'}`}>
                  {user.role === 'BILLBOARD_OWNER' ? 'Owner' : 'Business'}
                </span>
              </div>
              <button className="logout-button" onClick={handleLogout}>
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login"    className="btn-login">Login</Link>
              <Link to="/register" className="btn-register">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span><span></span><span></span>
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        {!isAuthPage && (
          <div className="mobile-search">
            <form onSubmit={handleSearchSubmit}>
              <div className="mobile-search-wrapper">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mobile-search-input"
                />
                <button type="submit" className="mobile-search-button">Search</button>
              </div>
            </form>
          </div>
        )}
        <div className="mobile-nav-links">
          <Link to="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          {dashLink && (
            <Link to={dashLink.path} className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              {dashLink.label}
            </Link>
          )}
          {user ? (
            <>
              <div className="mobile-user-info">{user.email}</div>
              <button className="mobile-logout-button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="mobile-nav-link"      onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" className="mobile-register-link" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

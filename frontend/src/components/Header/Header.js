import React, { useState } from 'react';
import './Header.css';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Search query:', searchQuery);
    // Placeholder for search functionality
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo and Brand */}
        <div className="brand-section">
          <div className="logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search locations, billboards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Navigation Menu */}
        <nav className="navigation">
          <div className="nav-links">
            <a href="#home" className="nav-link active">Home</a>
            <a href="#services" className="nav-link">Services</a>
            <a href="#about" className="nav-link">About Us</a>
            <a href="#contact" className="nav-link">Contact Us</a>
          </div>
        </nav>

        {/* Login/Register Button */}
        <div className="auth-section">
          <button className="login-button">
            <svg className="login-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Login / Register
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
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
        <div className="mobile-nav-links">
          <a href="#home" className="mobile-nav-link">Home</a>
          <a href="#services" className="mobile-nav-link">Services</a>
          <a href="#about" className="mobile-nav-link">About Us</a>
          <a href="#contact" className="mobile-nav-link">Contact Us</a>
          <button className="mobile-login-button">Login / Register</button>
        </div>
      </div>
    </header>
  );
};

export default Header;

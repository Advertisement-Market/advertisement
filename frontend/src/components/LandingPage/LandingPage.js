import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <main className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Transform Your Brand with 
                <span className="gradient-text"> Premium Billboards</span>
              </h1>
              <p className="hero-description">
                Connect with millions of potential customers through our extensive network of 
                high-impact billboard locations. Boost your brand visibility with strategic 
                outdoor advertising that delivers measurable results.
              </p>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">10,000+</span>
                  <span className="stat-label">Premium Locations</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">5M+</span>
                  <span className="stat-label">Daily Impressions</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">98%</span>
                  <span className="stat-label">Client Satisfaction</span>
                </div>
              </div>
              <div className="hero-actions">
                <button className="primary-button">
                  <svg className="button-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  Find Locations
                </button>
                <button className="secondary-button">
                  <svg className="button-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a3.5 3.5 0 100-7H9v7zm0 0v6"/>
                  </svg>
                  Get Quote
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="billboard-mockup">
                <div className="billboard-frame">
                  <div className="billboard-screen">
                    <div className="demo-ad">
                      <h3>Your Brand Here</h3>
                      <p>Premium Visibility</p>
                      <div className="demo-metrics">
                        <span>📍 High-Traffic Location</span>
                        <span>👁 2.5M Monthly Views</span>
                      </div>
                    </div>
                  </div>
                  <div className="billboard-post"></div>
                </div>
                <div className="floating-cards">
                  <div className="feature-card">
                    <div className="card-icon">📊</div>
                    <span>Real-time Analytics</span>
                  </div>
                  <div className="feature-card">
                    <div className="card-icon">🎯</div>
                    <span>Targeted Campaigns</span>
                  </div>
                  <div className="feature-card">
                    <div className="card-icon">⚡</div>
                    <span>Quick Setup</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Why Choose AdBoard Pro?</h2>
            <p className="section-description">
              Discover the advantages that make us the leading billboard advertising platform
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h3 className="feature-title">Prime Locations</h3>
              <p className="feature-description">
                Access premium billboard locations in high-traffic areas including highways, city centers, and commercial districts.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="feature-title">Data-Driven Insights</h3>
              <p className="feature-description">
                Get detailed analytics and performance metrics to track your campaign's success and optimize ROI.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="feature-title">24/7 Campaign Management</h3>
              <p className="feature-description">
                Professional campaign management with 24/7 monitoring and support to ensure maximum impact.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 className="feature-title">Digital & Traditional</h3>
              <p className="feature-description">
                Choose from both digital LED displays and traditional print billboards to match your campaign needs.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
              <h3 className="feature-title">Flexible Pricing</h3>
              <p className="feature-description">
                Transparent pricing with flexible packages to suit businesses of all sizes, from startups to enterprises.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <svg className="feature-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="feature-title">Expert Support</h3>
              <p className="feature-description">
                Dedicated account managers and creative teams to help design and optimize your advertising campaigns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="process-section">
        <div className="process-container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-description">
              Get your billboard campaign live in just four simple steps
            </p>
          </div>

          <div className="process-steps">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Choose Location</h3>
                <p className="step-description">
                  Browse our extensive network of premium billboard locations and select the ones that best match your target audience.
                </p>
              </div>
            </div>

            <div className="step-connector"></div>

            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Design Campaign</h3>
                <p className="step-description">
                  Work with our creative team to design compelling advertisements or upload your existing creative assets.
                </p>
              </div>
            </div>

            <div className="step-connector"></div>

            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Launch & Monitor</h3>
                <p className="step-description">
                  Your campaign goes live with real-time monitoring and analytics to track performance and engagement.
                </p>
              </div>
            </div>

            <div className="step-connector"></div>

            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3 className="step-title">Optimize Results</h3>
                <p className="step-description">
                  Review detailed reports and optimize your campaign based on data-driven insights for maximum ROI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Amplify Your Brand?</h2>
            <p className="cta-description">
              Join thousands of successful brands who trust AdBoard Pro for their outdoor advertising needs. 
              Start your campaign today and see the difference premium billboard advertising can make.
            </p>
            <div className="cta-actions">
              <button className="cta-primary-button">
                Start Your Campaign
                <svg className="button-arrow" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </button>
              <button className="cta-secondary-button">
                Schedule Demo
              </button>
            </div>
            <div className="cta-trust-indicators">
              <div className="trust-item">
                <span className="trust-icon">🏆</span>
                <span className="trust-text">Award-Winning Platform</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <span className="trust-text">Secure & Reliable</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✨</span>
                <span className="trust-text">Premium Quality</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;

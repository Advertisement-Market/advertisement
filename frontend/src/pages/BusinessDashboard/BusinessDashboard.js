import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './BusinessDashboard.css';

// Mock listings — real browse API will be added when backend exposes it
const MOCK_LISTINGS = [
  { id: 1, type: 'BILLBOARD',    icon: '🏙️', location: 'MG Road, Bangalore', state: 'Karnataka', impressions: '2.5M/mo', price: '₹45,000/mo',  status: 'Available', size: '40×20 ft' },
  { id: 2, type: 'DIGITAL',      icon: '📺', location: 'Connaught Place, Delhi', state: 'Delhi', impressions: '1.8M/mo', price: '₹80,000/mo', status: 'Available', size: '20×10 ft' },
  { id: 3, type: 'HOARDING',     icon: '🖼️', location: 'Marine Drive, Mumbai', state: 'Maharashtra', impressions: '3.2M/mo', price: '₹65,000/mo', status: 'Available', size: '60×30 ft' },
  { id: 4, type: 'BUS_SHELTER',  icon: '🚌', location: 'Anna Salai, Chennai', state: 'Tamil Nadu', impressions: '900K/mo', price: '₹12,000/mo', status: 'Available', size: '12×5 ft' },
  { id: 5, type: 'BILLBOARD',    icon: '🏙️', location: 'Banjara Hills, Hyderabad', state: 'Telangana', impressions: '1.5M/mo', price: '₹38,000/mo', status: 'Booked', size: '40×20 ft' },
  { id: 6, type: 'DIGITAL',      icon: '📺', location: 'Park Street, Kolkata', state: 'West Bengal', impressions: '1.1M/mo', price: '₹55,000/mo', status: 'Available', size: '20×10 ft' },
];

const TYPES = ['All', 'BILLBOARD', 'DIGITAL', 'HOARDING', 'BUS_SHELTER'];

const BusinessDashboard = () => {
  const { user } = useAuth();
  const [search, setSearch]     = useState('');
  const [typeFilter, setType]   = useState('All');
  const [enquired, setEnquired] = useState({});

  const filtered = MOCK_LISTINGS.filter(l => {
    const matchType   = typeFilter === 'All' || l.type === typeFilter;
    const matchSearch = !search ||
      l.location.toLowerCase().includes(search.toLowerCase()) ||
      l.state.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleEnquire = (id) => {
    setEnquired(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setEnquired(prev => ({ ...prev, [id]: false })), 3000);
  };

  return (
    <div className="biz-dashboard">
      {/* Header */}
      <div className="biz-header">
        <div className="biz-header-inner">
          <div>
            <h1 className="biz-title">Browse Billboard Locations</h1>
            <p className="biz-subtitle">
              Welcome, <strong>{user?.email}</strong>
              <span className="biz-role-tag">Advertiser</span>
            </p>
          </div>
          <div className="biz-header-stats">
            <div className="biz-stat">
              <span className="biz-stat-val">{MOCK_LISTINGS.filter(l => l.status === 'Available').length}</span>
              <span className="biz-stat-label">Available Now</span>
            </div>
            <div className="biz-stat">
              <span className="biz-stat-val">15+</span>
              <span className="biz-stat-label">Cities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="biz-controls">
        <div className="biz-search-wrapper">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            className="biz-search"
            placeholder="Search by city or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="biz-type-filters">
          {TYPES.map(t => (
            <button
              key={t}
              className={`biz-type-btn ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setType(t)}
            >
              {t === 'All' ? 'All Types' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="biz-results-info">
        Showing <strong>{filtered.length}</strong> location{filtered.length !== 1 ? 's' : ''}
        {typeFilter !== 'All' && ` · ${typeFilter.replace('_', ' ')}`}
        {search && ` · "${search}"`}
      </div>

      {/* Listings Grid */}
      {filtered.length === 0 ? (
        <div className="biz-empty">
          <div style={{ fontSize: '3rem' }}>🔍</div>
          <h3>No locations found</h3>
          <p>Try a different search term or type filter.</p>
        </div>
      ) : (
        <div className="biz-grid">
          {filtered.map(listing => (
            <div key={listing.id} className="biz-card">
              <div className="biz-card-header">
                <div className="biz-card-type">
                  <span className="biz-type-icon">{listing.icon}</span>
                  <span className="biz-type-text">{listing.type.replace('_', ' ')}</span>
                </div>
                <span className={`biz-avail-badge ${listing.status === 'Available' ? 'avail' : 'booked'}`}>
                  {listing.status}
                </span>
              </div>

              <div className="biz-card-visual">
                <span className="biz-visual-icon">{listing.icon}</span>
              </div>

              <div className="biz-card-body">
                <h3 className="biz-location">{listing.location}</h3>
                <p className="biz-state">📍 {listing.state}</p>

                <div className="biz-meta-grid">
                  <div className="biz-meta-item">
                    <span className="biz-meta-label">Size</span>
                    <span className="biz-meta-val">{listing.size}</span>
                  </div>
                  <div className="biz-meta-item">
                    <span className="biz-meta-label">Impressions</span>
                    <span className="biz-meta-val">{listing.impressions}</span>
                  </div>
                </div>

                <div className="biz-price">{listing.price}</div>

                <button
                  className={`biz-enquire-btn ${listing.status !== 'Available' ? 'disabled' : ''} ${enquired[listing.id] ? 'sent' : ''}`}
                  onClick={() => listing.status === 'Available' && handleEnquire(listing.id)}
                  disabled={listing.status !== 'Available'}
                >
                  {enquired[listing.id] ? (
                    '✓ Enquiry Sent!'
                  ) : listing.status === 'Available' ? (
                    'Send Enquiry'
                  ) : (
                    'Currently Booked'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coming soon notice */}
      <div className="biz-coming-soon">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Live marketplace listings from verified billboard owners coming soon.
        Enquiries are recorded and forwarded to the relevant owner.
      </div>
    </div>
  );
};

export default BusinessDashboard;

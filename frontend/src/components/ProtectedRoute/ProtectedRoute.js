import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps a route that requires authentication.
 * Optionally enforces a specific role (e.g. role="BILLBOARD_OWNER").
 * Redirects to /login if not authenticated, or to correct dashboard if wrong role.
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        color: '#3b82f6',
        gap: '0.75rem'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ animation: 'spin 1s linear infinite' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // Redirect to the correct dashboard for this user's role
    if (user.role === 'BILLBOARD_OWNER') return <Navigate to="/dashboard/owner" replace />;
    if (user.role === 'BUSINESS') return <Navigate to="/dashboard/business" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

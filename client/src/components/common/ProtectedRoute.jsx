import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Route protection wrapper.
 * Ensures user is authenticated and possesses required role if specified.
 */
export default function ProtectedRoute({ allowedRoles = null }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh', 
          backgroundColor: 'var(--bg-page, #f8fafc)',
          fontFamily: 'inherit'
        }}
      >
        <div 
          style={{ 
            width: 44, 
            height: 44, 
            border: '3px solid #e2e8f0', 
            borderTopColor: '#2563eb', 
            borderRadius: '50%', 
            animation: 'spin 0.8s linear infinite' 
          }} 
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <span style={{ marginTop: 16, fontSize: 14, color: '#64748b', fontWeight: 600 }}>
          Verifying security credentials...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to /login and preserve attempted URL for post-login redirection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role restrictions apply, enforce user's backend role (ADMIN has global clearance)
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = user?.role;
    const hasRole = userRole === 'ADMIN' || allowedRoles.includes(userRole);

    if (!hasRole) {
      return (
        <div style={{ padding: '40px 20px', maxWidth: '640px', margin: '60px auto', textAlign: 'center' }}>
          <div 
            style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              padding: '36px 24px', 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' 
            }}
          >
            <div 
              style={{ 
                width: '52px', 
                height: '52px', 
                borderRadius: '50%', 
                backgroundColor: '#fef2f2', 
                color: '#ef4444', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px' 
              }}
            >
              <ShieldAlert size={28} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Access Forbidden (403)
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              You do not have permission to access this module. Your active security role is{' '}
              <strong style={{ color: '#0f172a' }}>{userRole || 'UNKNOWN'}</strong>.
            </p>
            <Link 
              to="/dashboard" 
              className="btn btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex', padding: '9px 18px', borderRadius: '6px' }}
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
}

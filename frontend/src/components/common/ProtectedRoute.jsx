import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullPage />;
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <Outlet />;
}

export function AdminRoute() {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ fontSize: '3rem' }}>🚫</p>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>You need admin privileges to access this page.</p>
        <a href="/" className="btn btn-accent" style={{ marginTop: 16, display: 'inline-flex' }}>Go Home</a>
      </div>
    );
  }
  return <Outlet />;
}

export default ProtectedRoute;

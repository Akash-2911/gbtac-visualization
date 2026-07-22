import React from 'react';
import { Navigate } from 'react-router-dom';
import { msalInstance } from './msalInstance';
import { useUser } from './UserContext';
import PendingApproval from '../pages/PendingApproval';
import AccessDenied from '../pages/AccessDenied';

export default function ProtectedRoute({ children, allowedRoles }) {
  const accounts = msalInstance.getAllAccounts();
  const isAuthenticated = accounts.length > 0;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const { user, status } = useUser();

  if (status === 'checking') {
    return null;
  }

  if (status === 'pending') {
    return <PendingApproval />;
  }

  if (status === 'denied') {
    return <AccessDenied />;
  }

  if (status === 'error') {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
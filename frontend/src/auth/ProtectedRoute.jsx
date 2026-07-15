import React from 'react';
import { Navigate } from 'react-router-dom';
import { msalInstance } from './msalInstance';

export default function ProtectedRoute({ children }) {
  const accounts = msalInstance.getAllAccounts();
  const isAuthenticated = accounts.length > 0;

  console.log('ProtectedRoute check (direct instance) — isAuthenticated:', isAuthenticated, 'accounts:', accounts);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
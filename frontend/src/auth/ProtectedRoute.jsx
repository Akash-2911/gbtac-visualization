import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { msalInstance } from './msalInstance';
import { authFetch } from '../services/apiClient';
import PendingApproval from '../pages/PendingApproval';

export default function ProtectedRoute({ children }) {
  const accounts = msalInstance.getAllAccounts();
  const isAuthenticated = accounts.length > 0;

  console.log('ProtectedRoute check (direct instance) — isAuthenticated:', isAuthenticated, 'accounts:', accounts);

  const [status, setStatus] = useState('checking'); // checking | active | pending | error

  useEffect(() => {
    if (!isAuthenticated) return;

    authFetch('/me')
      .then(() => setStatus('active'))
      .catch((err) => {
        if (err.status === 428) {
          setStatus('pending');
        } else {
          console.error('ProtectedRoute /me check failed:', err.message);
          setStatus('error');
        }
      });
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (status === 'checking') {
    return null; // could swap for a loading spinner if you want one
  }

  if (status === 'pending') {
    return <PendingApproval />;
  }

  if (status === 'error') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
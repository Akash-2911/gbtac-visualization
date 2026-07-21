import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { fetchMe } from '../services/adminService';

const UserContext = createContext(null);

// Single source of truth for the logged-in user's real role and upload
// permission, read from the database via /me. Every page that needs role
// info (Layout, Settings, Admin, Upload, route guards) reads from here
// instead of each independently reading the JWT token, which is how the
// old "sidebar shows Admin but you're really Viewer" bug happened.
export function UserProvider({ children }) {
  const { accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking'); // checking | ready | pending | error

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus('checking');
      return;
    }
    fetchMe()
      .then((data) => {
        setUser(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (err.status === 428) {
          setStatus('pending');
        } else {
          console.error('UserContext /me check failed:', err.message);
          setStatus('error');
        }
      });
  }, [isAuthenticated]);

  return (
    <UserContext.Provider value={{ user, status }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used inside a UserProvider');
  }
  return ctx;
}
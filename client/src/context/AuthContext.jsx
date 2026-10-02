import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextInstance';
import authService from '../services/authService';

/**
 * Enterprise Authentication & Session Provider.
 * Maintains authenticated user state, JWT tokens, authoritative backend profile sync,
 * role status, and clean sign-in/sign-out lifecycles.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Set loading to true initially if a token exists to avoid rendering mock/wrong data
  const [loading, setLoading] = useState(() => {
    try {
      return Boolean(localStorage.getItem('token'));
    } catch {
      return false;
    }
  });

  const [authError, setAuthError] = useState(null);

  /**
   * Verify token validity and fetch authoritative authenticated user from backend.
   * Calls GET /api/auth/me
   */
  const verifyAuth = useCallback(async () => {
    let existingToken = null;
    try {
      existingToken = localStorage.getItem('token');
    } catch {
      existingToken = null;
    }

    if (!existingToken) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const authoritativeUser = await authService.getMe();
      if (authoritativeUser) {
        setUser(authoritativeUser);
        setToken(existingToken);
        localStorage.setItem('user', JSON.stringify(authoritativeUser));
        setAuthError(null);
      } else {
        throw new Error('Invalid user profile received from server');
      }
    } catch (err) {
      console.warn('Session verification error:', err.message);
      // If 401 or invalid token, clean up session
      if (err.status === 401 || err.isUnauthorized) {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch {
          // Storage cleanup tolerance
        }
        setToken(null);
        setUser(null);
      }
      setAuthError(err.message || 'Session expired. Please sign in again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Run authoritative profile check once on application startup
  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Listen to 401 events emitted by centralized api client
  useEffect(() => {
    const handleUnauthorized = (event) => {
      setToken(null);
      setUser(null);
      setAuthError(event?.detail?.message || 'Session expired. Please sign in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  /**
   * Log in user with credentials.
   * On success: stores JWT in 'token', user in 'user', and updates state immediately.
   */
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await authService.login(credentials);
      const { user: authUser, token: authToken } = result;

      if (!authToken || !authUser) {
        throw new Error('Malformed authentication payload received from server');
      }

      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);
      return authUser;
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please check your credentials.';
      setAuthError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Log out current user session.
   * Calls POST /api/auth/logout, clears state and localStorage, and resets errors.
   */
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {
        // Storage cleanup tolerance
      }
      setToken(null);
      setUser(null);
      setLoading(false);
      setAuthError(null);
    }
  }, []);

  const isAuthenticated = Boolean(token && user);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    authError,
    setAuthError,
    login,
    logout,
    verifyAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

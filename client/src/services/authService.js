import api from './api';

/**
 * Authentication Service for Retail Inventory Management System.
 * Connects frontend auth actions to Node.js / Express backend endpoints:
 * POST /api/auth/login
 * GET  /api/auth/me
 * POST /api/auth/logout
 */
export const authService = {
  /**
   * Submit credentials to authenticate user session.
   * Backend returns { success: true, message: "...", data: { user: {...}, token: "..." } }
   * 
   * @param {{ email: string, password: string }} credentials 
   * @returns {Promise<{ user: object, token: string }>}
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Validate existing session token and fetch authoritative user profile from backend.
   * Backend returns { success: true, data: { id, name, email, department, role, status, ... } }
   * 
   * @returns {Promise<object>} Authoritative sanitized user object
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Invalidate server session if supported.
   * Always handles network/server errors gracefully to ensure client teardown completes.
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Allow local sign-out to proceed even if network error occurs
    }
  },
};

export default authService;

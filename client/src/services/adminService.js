import api from './api';

/**
 * Fetch consolidated administration console telemetry from GET /api/admin/dashboard.
 */
export async function getAdminDashboard() {
  const response = await api.get('/admin/dashboard');
  return response.data;
}

export default {
  getAdminDashboard,
};

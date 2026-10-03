import api from './api';

/**
 * Normalizes backend user object to frontend consumption model.
 *
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeUser(raw) {
  if (!raw) return null;

  const lastLogin = raw.lastLogin
    ? String(raw.lastLogin).replace('T', ' ').slice(0, 16)
    : 'Never';

  const createdAt = raw.createdAt
    ? String(raw.createdAt).split('T')[0]
    : '';

  return {
    id: raw.id,
    name: raw.name || '',
    email: raw.email || '',
    department: raw.department || 'Operations',
    role: raw.role || (raw.roleObj?.name ? raw.roleObj.name : 'STAFF'),
    roleId: raw.roleId || null,
    roleDescription: raw.roleDescription || '',
    status: raw.status || 'ACTIVE',
    lastLogin,
    createdAt,
    updatedAt: raw.updatedAt || '',
  };
}

/**
 * Fetch paginated, filtered user accounts from GET /api/users.
 * Requires ADMIN role.
 */
export async function getUsers(params = {}) {
  const response = await api.get('/users', params);
  return {
    data: (response.data || []).map(normalizeUser),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch all available system security roles from GET /api/users/roles.
 */
export async function getRoles() {
  const response = await api.get('/users/roles');
  return response.data || [];
}

/**
 * Fetch single user by ID from GET /api/users/:id.
 */
export async function getUserById(id) {
  const response = await api.get(`/users/${id}`);
  return normalizeUser(response.data);
}

/**
 * Create a new user account via POST /api/users.
 */
export async function createUser(payload) {
  const response = await api.post('/users', payload);
  return {
    message: response.message,
    data: normalizeUser(response.data),
  };
}

/**
 * Update an existing user via PUT /api/users/:id.
 */
export async function updateUser(id, payload) {
  const response = await api.put(`/users/${id}`, payload);
  return {
    message: response.message,
    data: normalizeUser(response.data),
  };
}

/**
 * Toggle or update user account status via PATCH /api/users/:id/status.
 */
export async function updateUserStatus(id, status) {
  const response = await api.patch(`/users/${id}/status`, { status });
  return {
    message: response.message,
    data: normalizeUser(response.data),
  };
}

export default {
  getUsers,
  getRoles,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  normalizeUser,
};

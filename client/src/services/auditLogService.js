import api from './api';

/**
 * Normalizes backend audit log object to frontend consumption model.
 *
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeAuditLog(raw) {
  if (!raw) return null;

  let timestamp = '';
  if (raw.createdAt) {
    timestamp = String(raw.createdAt).replace('T', ' ').slice(0, 19);
  } else if (raw.timestamp) {
    timestamp = String(raw.timestamp).replace('T', ' ').slice(0, 19);
  }

  return {
    id: raw.id,
    userId: raw.userId || null,
    user: raw.userName || raw.user || 'System',
    userRole: raw.userRole || 'SYSTEM',
    action: raw.action || 'ACTIVITY',
    module: raw.module || 'SYSTEM',
    entity: raw.entity || '',
    entityId: raw.entityId || '',
    description: raw.description || '',
    severity: raw.severity || 'INFO',
    ipAddress: raw.ipAddress || null,
    createdAt: raw.createdAt || '',
    timestamp,
  };
}

/**
 * Fetch paginated, filtered audit logs from GET /api/audit-logs.
 * Requires ADMIN role.
 */
export async function getAuditLogs(params = {}) {
  const response = await api.get('/audit-logs', params);
  return {
    data: (response.data || []).map(normalizeAuditLog),
    pagination: response.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch single audit log entry by ID from GET /api/audit-logs/:id.
 */
export async function getAuditLogById(id) {
  const response = await api.get(`/audit-logs/${id}`);
  return normalizeAuditLog(response.data);
}

export default {
  getAuditLogs,
  getAuditLogById,
  normalizeAuditLog,
};

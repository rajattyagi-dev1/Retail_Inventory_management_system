import api from './api';

/**
 * Normalizes backend warehouse object to frontend consumption model.
 * Guarantees backward compatibility with existing UI components.
 * 
 * @param {object} raw 
 * @returns {object|null}
 */
export function normalizeWarehouse(raw) {
  if (!raw) return null;

  const capacity = raw.capacity !== undefined && raw.capacity !== null ? Number(raw.capacity) : 0;
  const currentStock = raw.currentStock !== undefined && raw.currentStock !== null ? Number(raw.currentStock) : 0;
  const staffCount = raw.staffCount !== undefined && raw.staffCount !== null ? Number(raw.staffCount) : 0;

  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    address: raw.address || '',
    city: raw.city || '',
    state: raw.state || '',
    pincode: raw.pincode || '',
    capacity,
    currentStock,
    status: raw.status || 'ACTIVE',
    staffCount,
    managerId: raw.managerId || null,
    managerName: raw.managerName || '',
    managerEmail: raw.managerEmail || '',
    managerPhone: raw.managerPhone || '',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdDate: raw.createdAt ? String(raw.createdAt).split('T')[0] : '',
    manager: raw.manager || null,
    inventory: raw.inventory || [],
  };
}

/**
 * Normalizes outbound warehouse payload for backend API consumption.
 * @param {object} formData 
 * @returns {object}
 */
export function formatWarehousePayload(formData) {
  const payload = { ...formData };

  if (payload.code) {
    payload.code = String(payload.code).trim().toUpperCase();
  }
  if (payload.name) {
    payload.name = String(payload.name).trim();
  }
  if (payload.address !== undefined) {
    payload.address = typeof payload.address === 'string' ? payload.address.trim() : payload.address;
  }
  if (payload.city !== undefined) {
    payload.city = typeof payload.city === 'string' ? payload.city.trim() : payload.city;
  }
  if (payload.state !== undefined) {
    payload.state = typeof payload.state === 'string' ? payload.state.trim() : payload.state;
  }
  if (payload.pincode !== undefined) {
    payload.pincode = typeof payload.pincode === 'string' ? payload.pincode.trim() : payload.pincode;
  }
  if (payload.capacity !== undefined && payload.capacity !== '') {
    payload.capacity = parseInt(payload.capacity, 10);
  }
  if (payload.staffCount !== undefined && payload.staffCount !== '') {
    payload.staffCount = parseInt(payload.staffCount, 10);
  }
  if (payload.status) {
    payload.status = String(payload.status).trim().toUpperCase();
  }
  if (payload.managerName !== undefined) {
    payload.managerName = typeof payload.managerName === 'string' ? payload.managerName.trim() : payload.managerName;
  }
  if (payload.managerEmail !== undefined) {
    payload.managerEmail = typeof payload.managerEmail === 'string' ? payload.managerEmail.trim() : payload.managerEmail;
  }
  if (payload.managerPhone !== undefined) {
    payload.managerPhone = typeof payload.managerPhone === 'string' ? payload.managerPhone.trim() : payload.managerPhone;
  }
  if (!payload.managerId) {
    delete payload.managerId;
  }

  // Remove local UI-only or computed fields not stored on Warehouse table
  delete payload.currentStock;
  delete payload.createdDate;
  delete payload.manager;
  delete payload.inventory;

  return payload;
}

/**
 * Fetch paginated, filtered, and sorted warehouses from GET /api/warehouses.
 */
export async function getWarehouses(params = {}) {
  const response = await api.get('/warehouses', params);
  return {
    data: (response.data || []).map(normalizeWarehouse),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch a single warehouse by ID from GET /api/warehouses/:id.
 */
export async function getWarehouseById(id) {
  const response = await api.get(`/warehouses/${id}`);
  return normalizeWarehouse(response.data);
}

/**
 * Create a new warehouse via POST /api/warehouses.
 */
export async function createWarehouse(warehouseData) {
  const payload = formatWarehousePayload(warehouseData);
  const response = await api.post('/warehouses', payload);
  return normalizeWarehouse(response.data);
}

/**
 * Update an existing warehouse via PUT /api/warehouses/:id.
 */
export async function updateWarehouse(id, warehouseData) {
  const payload = formatWarehousePayload(warehouseData);
  const response = await api.put(`/warehouses/${id}`, payload);
  return normalizeWarehouse(response.data);
}

/**
 * Update warehouse status via PATCH /api/warehouses/:id/status.
 */
export async function updateWarehouseStatus(id, status) {
  const upper = String(status).trim().toUpperCase();
  const response = await api.patch(`/warehouses/${id}/status`, { status: upper });
  return normalizeWarehouse(response.data);
}

export default {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  updateWarehouseStatus,
  normalizeWarehouse,
  formatWarehousePayload,
};

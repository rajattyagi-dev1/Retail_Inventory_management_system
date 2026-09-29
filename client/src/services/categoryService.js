import api from './api';

/**
 * Normalizes backend category object to frontend consumption model.
 * 
 * @param {object} raw 
 * @returns {object|null}
 */
export function normalizeCategory(raw) {
  if (!raw) return null;

  const rawStatus = raw.status || 'ACTIVE';
  const displayStatus = rawStatus === 'INACTIVE' ? 'Inactive' : 'Active';

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || '',
    status: displayStatus,
    rawStatus,
    productCount: raw.productCount !== undefined ? Number(raw.productCount) : 0,
    createdDate: raw.createdAt ? raw.createdAt.split('T')[0] : '',
    updatedDate: raw.updatedAt ? raw.updatedAt.split('T')[0] : '',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/**
 * Normalizes outbound category payload for backend API consumption.
 * @param {object} formData 
 * @returns {object}
 */
export function formatCategoryPayload(formData) {
  const payload = { ...formData };

  if (payload.status) {
    const s = String(payload.status).trim().toUpperCase();
    if (s === 'ACTIVE' || s === 'INACTIVE') {
      payload.status = s;
    }
  }

  // Remove local UI-only fields
  delete payload.productCount;
  delete payload.createdDate;
  delete payload.updatedDate;
  delete payload.rawStatus;

  return payload;
}

/**
 * Fetch paginated and filtered categories from GET /api/categories.
 */
export async function getCategories(params = {}) {
  const response = await api.get('/categories', params);
  return {
    data: (response.data || []).map(normalizeCategory),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch a single category by ID from GET /api/categories/:id.
 */
export async function getCategoryById(id) {
  const response = await api.get(`/categories/${id}`);
  return normalizeCategory(response.data);
}

/**
 * Create a new category via POST /api/categories.
 */
export async function createCategory(categoryData) {
  const payload = formatCategoryPayload(categoryData);
  const response = await api.post('/categories', payload);
  return normalizeCategory(response.data);
}

/**
 * Update an existing category via PUT /api/categories/:id.
 */
export async function updateCategory(id, categoryData) {
  const payload = formatCategoryPayload(categoryData);
  const response = await api.put(`/categories/${id}`, payload);
  return normalizeCategory(response.data);
}

/**
 * Update category status via PATCH /api/categories/:id/status.
 */
export async function updateCategoryStatus(id, status) {
  const upper = String(status).trim().toUpperCase();
  const response = await api.patch(`/categories/${id}/status`, { status: upper });
  return normalizeCategory(response.data);
}

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  normalizeCategory,
  formatCategoryPayload,
};

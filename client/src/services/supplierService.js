import api from './api';

/**
 * Normalizes backend supplier object to frontend consumption model.
 *
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeSupplier(raw) {
  if (!raw) return null;

  return {
    id: raw.id,
    supplierCode: raw.supplierCode || '',
    name: raw.name || '',
    companyName: raw.companyName || raw.name || '',
    category: raw.category || 'General Merchandise',
    contactPerson: raw.contactPerson || '',
    email: raw.email || '',
    phone: raw.phone || '',
    address: raw.address || '',
    city: raw.city || '',
    state: raw.state || '',
    pincode: raw.pincode || '',
    gstNumber: raw.gstNumber || '',
    paymentTerms: raw.paymentTerms || 'Net 30',
    status: raw.status || 'ACTIVE',
    productsSupplied: Number(raw.productsSupplied || 0),
    purchaseOrderCount: Number(raw.purchaseOrderCount || 0),
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || '',
    supplierProducts: raw.supplierProducts || [],
  };
}

/**
 * Fetch paginated, filtered suppliers from GET /api/suppliers.
 */
export async function getSuppliers(params = {}) {
  const response = await api.get('/suppliers', params);
  return {
    data: (response.data || []).map(normalizeSupplier),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch a single supplier by ID from GET /api/suppliers/:id.
 */
export async function getSupplierById(id) {
  const response = await api.get(`/suppliers/${id}`);
  return normalizeSupplier(response.data);
}

/**
 * Create a new supplier via POST /api/suppliers.
 */
export async function createSupplier(payload) {
  const response = await api.post('/suppliers', payload);
  return {
    message: response.message,
    data: normalizeSupplier(response.data),
  };
}

/**
 * Update an existing supplier via PUT /api/suppliers/:id.
 */
export async function updateSupplier(id, payload) {
  const response = await api.put(`/suppliers/${id}`, payload);
  return {
    message: response.message,
    data: normalizeSupplier(response.data),
  };
}

/**
 * Toggle or update supplier status via PATCH /api/suppliers/:id/status.
 */
export async function updateSupplierStatus(id, status) {
  const response = await api.patch(`/suppliers/${id}/status`, { status });
  return {
    message: response.message,
    data: normalizeSupplier(response.data),
  };
}

/**
 * Fetch product catalog associations for a supplier from GET /api/suppliers/:supplierId/products.
 */
export async function getSupplierProducts(supplierId) {
  const response = await api.get(`/suppliers/${supplierId}/products`);
  return response.data || [];
}

/**
 * Associate a product with a supplier via POST /api/suppliers/:supplierId/products.
 */
export async function addSupplierProduct(supplierId, payload) {
  const response = await api.post(`/suppliers/${supplierId}/products`, payload);
  return response.data;
}

/**
 * Remove product association from DELETE /api/suppliers/:supplierId/products/:productId.
 */
export async function removeSupplierProduct(supplierId, productId) {
  const response = await api.delete(`/suppliers/${supplierId}/products/${productId}`);
  return response.message;
}

export default {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
  getSupplierProducts,
  addSupplierProduct,
  removeSupplierProduct,
  normalizeSupplier,
};

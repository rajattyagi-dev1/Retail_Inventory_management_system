import api from './api';

/**
 * Normalizes backend product object to frontend consumption model.
 * Guarantees backward compatibility with UI components.
 * 
 * @param {object} raw 
 * @returns {object|null}
 */
export function normalizeProduct(raw) {
  if (!raw) return null;

  const currentStock = raw.currentStock !== undefined ? Number(raw.currentStock) : 0;
  const reorderLevel = raw.reorderLevel !== undefined ? Number(raw.reorderLevel) : 10;

  let stockStatus = 'In Stock';
  if (currentStock === 0) {
    stockStatus = 'Out of Stock';
  } else if (currentStock <= reorderLevel) {
    stockStatus = 'Low Stock';
  }

  const rawStatus = raw.status || 'ACTIVE';
  let displayStatus = 'Active';
  if (rawStatus === 'INACTIVE') displayStatus = 'Inactive';
  else if (rawStatus === 'ARCHIVED') displayStatus = 'Archived';

  return {
    id: raw.id,
    sku: raw.sku,
    name: raw.name,
    description: raw.description || '',
    brand: raw.brand || '',
    categoryId: raw.categoryId,
    category: raw.category?.name || (typeof raw.category === 'string' ? raw.category : ''),
    categoryObj: raw.category || null,
    costPrice: raw.costPrice !== null && raw.costPrice !== undefined ? Number(raw.costPrice) : 0,
    sellingPrice: raw.sellingPrice !== null && raw.sellingPrice !== undefined ? Number(raw.sellingPrice) : 0,
    unit: raw.unit || 'Pieces',
    reorderLevel,
    currentStock,
    stockStatus,
    status: displayStatus,
    rawStatus,
    imageUrl: raw.imageUrl || '',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdDate: raw.createdAt ? raw.createdAt.split('T')[0] : '',
    updatedDate: raw.updatedAt ? raw.updatedAt.split('T')[0] : '',
    warehouses: raw.warehouses || [
      { name: 'Delhi Central Hub', stock: Math.floor(currentStock * 0.5), location: 'Shelf E-01' },
      { name: 'Mumbai Distribution Center', stock: Math.floor(currentStock * 0.3), location: 'Shelf W-01' },
      { name: 'Bangalore Fulfillment Hub', stock: Math.floor(currentStock * 0.2), location: 'Shelf S-01' },
    ],
  };
}

/**
 * Normalizes outbound product payload for backend API consumption.
 * @param {object} formData 
 * @returns {object}
 */
export function formatProductPayload(formData) {
  const payload = { ...formData };

  // Convert status to backend enum
  if (payload.status) {
    const s = String(payload.status).trim().toUpperCase();
    if (s === 'ACTIVE' || s === 'INACTIVE' || s === 'ARCHIVED') {
      payload.status = s;
    }
  }

  if (payload.costPrice !== undefined && payload.costPrice !== '') {
    payload.costPrice = Number(payload.costPrice);
  }
  if (payload.sellingPrice !== undefined && payload.sellingPrice !== '') {
    payload.sellingPrice = Number(payload.sellingPrice);
  }
  if (payload.reorderLevel !== undefined && payload.reorderLevel !== '') {
    payload.reorderLevel = parseInt(payload.reorderLevel, 10);
  }

  // Remove local UI-only fields
  delete payload.stockStatus;
  delete payload.currentStock;
  delete payload.warehouses;
  delete payload.createdDate;
  delete payload.updatedDate;
  delete payload.rawStatus;
  delete payload.categoryObj;

  return payload;
}

/**
 * Fetch paginated, filtered, and sorted products from GET /api/products.
 */
export async function getProducts(params = {}) {
  const response = await api.get('/products', params);
  return {
    data: (response.data || []).map(normalizeProduct),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch a single product by ID from GET /api/products/:id.
 */
export async function getProductById(id) {
  const response = await api.get(`/products/${id}`);
  return normalizeProduct(response.data);
}

/**
 * Create a new product via POST /api/products.
 */
export async function createProduct(productData) {
  const payload = formatProductPayload(productData);
  const response = await api.post('/products', payload);
  return normalizeProduct(response.data);
}

/**
 * Update an existing product via PUT /api/products/:id.
 */
export async function updateProduct(id, productData) {
  const payload = formatProductPayload(productData);
  const response = await api.put(`/products/${id}`, payload);
  return normalizeProduct(response.data);
}

/**
 * Update product status via PATCH /api/products/:id/status.
 */
export async function updateProductStatus(id, status) {
  const upper = String(status).trim().toUpperCase();
  const response = await api.patch(`/products/${id}/status`, { status: upper });
  return normalizeProduct(response.data);
}

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  normalizeProduct,
  formatProductPayload,
};

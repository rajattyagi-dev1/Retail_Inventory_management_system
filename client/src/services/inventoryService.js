import api from './api';

/**
 * Normalizes backend inventory object to frontend consumption model.
 * Guarantees backward compatibility with all existing UI components.
 *
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeInventory(raw) {
  if (!raw) return null;

  const currentStock = raw.currentStock !== undefined && raw.currentStock !== null ? Number(raw.currentStock) : 0;
  const reservedStock = raw.reservedStock !== undefined && raw.reservedStock !== null ? Number(raw.reservedStock) : 0;
  const reorderLevel = raw.reorderLevel !== undefined && raw.reorderLevel !== null ? Number(raw.reorderLevel) : 0;
  const availableStock = raw.availableStock !== undefined && raw.availableStock !== null
    ? Number(raw.availableStock)
    : Math.max(0, currentStock - reservedStock);

  // Category string for direct React child rendering in existing tables
  let categoryName = '';
  if (typeof raw.category === 'string') {
    categoryName = raw.category;
  } else if (raw.category && raw.category.name) {
    categoryName = raw.category.name;
  } else if (raw.product && raw.product.category) {
    categoryName = typeof raw.product.category === 'string'
      ? raw.product.category
      : (raw.product.category.name || '');
  }

  const lastUpdated = raw.updatedAt
    ? String(raw.updatedAt).split('T')[0]
    : (raw.createdAt ? String(raw.createdAt).split('T')[0] : '');

  return {
    id: raw.id,
    productId: raw.productId,
    productName: raw.productName || raw.product?.name || '',
    sku: raw.sku || raw.product?.sku || '',
    category: categoryName,
    categoryObj: raw.category || raw.product?.category || null,
    warehouseId: raw.warehouseId,
    warehouseName: raw.warehouseName || raw.warehouse?.name || '',
    warehouseCode: raw.warehouseCode || raw.warehouse?.code || '',
    currentStock,
    reservedStock,
    availableStock,
    reorderLevel,
    stockStatus: raw.stockStatus || 'IN_STOCK',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    lastUpdated,
    lastMovement: raw.lastMovement || null,
    product: raw.product || null,
    warehouse: raw.warehouse || null,
  };
}

/**
 * Normalizes outbound adjustment payload for POST /api/inventory/adjust.
 *
 * @param {object} adjustmentData
 * @returns {object}
 */
export function formatAdjustmentPayload(adjustmentData) {
  const payload = { ...adjustmentData };

  // Normalize type
  if (payload.type) {
    const rawType = String(payload.type).trim().toUpperCase();
    if (rawType === 'ADD STOCK' || rawType === 'ADD') {
      payload.type = 'ADD';
    } else if (rawType === 'REMOVE STOCK' || rawType === 'REMOVE') {
      payload.type = 'REMOVE';
    } else if (rawType === 'SET STOCK' || rawType === 'SET') {
      payload.type = 'SET';
    }
  }

  // Parse quantity to integer
  if (payload.quantity !== undefined && payload.quantity !== null && payload.quantity !== '') {
    payload.quantity = parseInt(payload.quantity, 10);
  }

  if (payload.reason) {
    payload.reason = String(payload.reason).trim();
  }
  if (payload.reference) {
    payload.reference = String(payload.reference).trim();
  }
  if (payload.notes) {
    payload.notes = String(payload.notes).trim();
  }
  if (payload.performedBy) {
    payload.performedBy = String(payload.performedBy).trim();
  }

  return payload;
}

/**
 * Fetch paginated, filtered, and sorted inventory list from GET /api/inventory.
 */
export async function getInventory(params = {}) {
  const response = await api.get('/inventory', params);
  return {
    data: (response.data || []).map(normalizeInventory),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch a single inventory record by ID from GET /api/inventory/:id.
 */
export async function getInventoryById(id) {
  const response = await api.get(`/inventory/${id}`);
  return normalizeInventory(response.data);
}

/**
 * Fetch inventory for a specific warehouse from GET /api/inventory/warehouse/:warehouseId.
 */
export async function getInventoryByWarehouse(warehouseId, params = {}) {
  const response = await api.get(`/inventory/warehouse/${warehouseId}`, params);
  return {
    data: (response.data || []).map(normalizeInventory),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch inventory allocations for a product from GET /api/inventory/product/:productId.
 */
export async function getInventoryByProduct(productId, params = {}) {
  const response = await api.get(`/inventory/product/${productId}`, params);
  return {
    data: (response.data || []).map(normalizeInventory),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Perform atomic stock adjustment via POST /api/inventory/adjust.
 */
export async function adjustStock(adjustmentData) {
  const payload = formatAdjustmentPayload(adjustmentData);
  const response = await api.post('/inventory/adjust', payload);
  return {
    inventory: normalizeInventory(response.data),
    movement: response.movement || null,
    message: response.message || 'Stock adjusted successfully',
  };
}

export default {
  getInventory,
  getInventoryById,
  getInventoryByWarehouse,
  getInventoryByProduct,
  adjustStock,
  normalizeInventory,
  formatAdjustmentPayload,
};

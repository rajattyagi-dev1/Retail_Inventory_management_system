import api from './api';

/**
 * Normalizes backend stock movement object to frontend consumption model.
 *
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeStockMovement(raw) {
  if (!raw) return null;

  const timestamp = raw.createdAt
    ? String(raw.createdAt).replace('T', ' ').slice(0, 16)
    : (raw.timestamp || '');

  return {
    id: raw.id,
    inventoryId: raw.inventoryId,
    productId: raw.productId,
    productName: raw.productName || raw.product?.name || '',
    sku: raw.sku || raw.product?.sku || '',
    warehouseId: raw.warehouseId,
    warehouseName: raw.warehouseName || raw.warehouse?.name || '',
    warehouseCode: raw.warehouseCode || raw.warehouse?.code || '',
    type: raw.type,
    quantity: raw.quantity !== undefined && raw.quantity !== null ? Number(raw.quantity) : 0,
    reference: raw.reference || '',
    performedById: raw.performedById || null,
    performedBy: raw.performedBy || 'Inventory Supervisor',
    notes: raw.notes || '',
    createdAt: raw.createdAt,
    timestamp,
    product: raw.product || null,
    warehouse: raw.warehouse || null,
    performedByUser: raw.performedByUser || null,
  };
}

/**
 * Fetch paginated, filtered, and sorted stock movements from GET /api/stock-movements.
 */
export async function getStockMovements(params = {}) {
  const response = await api.get('/stock-movements', params);
  return {
    data: (response.data || []).map(normalizeStockMovement),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch a single stock movement by ID from GET /api/stock-movements/:id.
 */
export async function getStockMovementById(id) {
  const response = await api.get(`/stock-movements/${id}`);
  return normalizeStockMovement(response.data);
}

/**
 * Fetch stock movements for a specific warehouse from GET /api/stock-movements/warehouse/:warehouseId.
 */
export async function getStockMovementsByWarehouse(warehouseId, params = {}) {
  const response = await api.get(`/stock-movements/warehouse/${warehouseId}`, params);
  return {
    data: (response.data || []).map(normalizeStockMovement),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch stock movements for a specific product from GET /api/stock-movements/product/:productId.
 */
export async function getStockMovementsByProduct(productId, params = {}) {
  const response = await api.get(`/stock-movements/product/${productId}`, params);
  return {
    data: (response.data || []).map(normalizeStockMovement),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

export default {
  getStockMovements,
  getStockMovementById,
  getStockMovementsByWarehouse,
  getStockMovementsByProduct,
  normalizeStockMovement,
};

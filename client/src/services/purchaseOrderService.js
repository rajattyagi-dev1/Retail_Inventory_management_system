import api from './api';

/**
 * Normalizes backend purchase order object to frontend consumption model.
 *
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizePurchaseOrder(raw) {
  if (!raw) return null;

  const items = (raw.items || []).map((item) => ({
    id: item.id,
    purchaseOrderId: item.purchaseOrderId,
    productId: item.productId,
    productName: item.productName || item.product?.name || '',
    sku: item.sku || item.product?.sku || '',
    quantity: Number(item.quantity) || 0,
    receivedQuantity: Number(item.receivedQuantity) || 0,
    remaining: Math.max(0, (Number(item.quantity) || 0) - (Number(item.receivedQuantity) || 0)),
    unitPrice: Number(item.unitPrice) || 0,
    tax: Number(item.tax) || 0,
    lineTotal: Number(item.lineTotal) || 0,
    product: item.product || null,
  }));

  const orderDate = raw.orderDate
    ? String(raw.orderDate).split('T')[0]
    : (raw.createdAt ? String(raw.createdAt).split('T')[0] : '');

  const expectedDate = raw.expectedDate
    ? String(raw.expectedDate).split('T')[0]
    : '';

  return {
    id: raw.id,
    poNumber: raw.poNumber || '',
    supplierId: raw.supplierId || '',
    supplierName: raw.supplierName || raw.supplier?.name || '',
    supplierCode: raw.supplierCode || raw.supplier?.supplierCode || '',
    warehouseId: raw.warehouseId || '',
    warehouseName: raw.warehouseName || raw.warehouse?.name || '',
    warehouseCode: raw.warehouseCode || raw.warehouse?.code || '',
    status: raw.status || 'DRAFT',
    orderDate,
    expectedDate,
    subtotal: Number(raw.subtotal) || 0,
    tax: Number(raw.tax) || 0,
    shipping: Number(raw.shipping) || 0,
    total: Number(raw.total) || 0,
    totalAmount: Number(raw.total) || 0,
    notes: raw.notes || '',
    createdBy: raw.createdBy || 'Procurement Officer',
    items,
    itemCount: items.length,
    totalQuantity: items.reduce((sum, it) => sum + it.quantity, 0),
    totalReceived: items.reduce((sum, it) => sum + it.receivedQuantity, 0),
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || '',
  };
}

/**
 * Fetch paginated, filtered purchase orders from GET /api/purchase-orders.
 */
export async function getPurchaseOrders(params = {}) {
  const response = await api.get('/purchase-orders', params);
  return {
    data: (response.data || []).map(normalizePurchaseOrder),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch single purchase order by ID from GET /api/purchase-orders/:id.
 */
export async function getPurchaseOrderById(id) {
  const response = await api.get(`/purchase-orders/${id}`);
  return normalizePurchaseOrder(response.data);
}

/**
 * Create a new purchase order via POST /api/purchase-orders.
 */
export async function createPurchaseOrder(payload) {
  const response = await api.post('/purchase-orders', payload);
  return {
    message: response.message,
    data: normalizePurchaseOrder(response.data),
  };
}

/**
 * Update an existing purchase order via PUT /api/purchase-orders/:id.
 */
export async function updatePurchaseOrder(id, payload) {
  const response = await api.put(`/purchase-orders/${id}`, payload);
  return {
    message: response.message,
    data: normalizePurchaseOrder(response.data),
  };
}

/**
 * Transition purchase order status via PATCH /api/purchase-orders/:id/status.
 */
export async function updatePurchaseOrderStatus(id, status) {
  const response = await api.patch(`/purchase-orders/${id}/status`, { status });
  return {
    message: response.message,
    data: normalizePurchaseOrder(response.data),
  };
}

/**
 * Approve purchase order via PATCH /api/purchase-orders/:id/approve.
 */
export async function approvePurchaseOrder(id) {
  const response = await api.patch(`/purchase-orders/${id}/approve`);
  return {
    message: response.message,
    data: normalizePurchaseOrder(response.data),
  };
}

/**
 * Receive items against an approved purchase order via POST /api/purchase-orders/:id/receive.
 * Backend atomically updates PO, increases inventory, and creates RECEIPT movements.
 */
export async function receiveGoods(id, payload = {}) {
  const response = await api.post(`/purchase-orders/${id}/receive`, payload);
  return {
    message: response.message,
    data: normalizePurchaseOrder(response.data),
    meta: response.meta,
  };
}

export default {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  approvePurchaseOrder,
  receiveGoods,
  normalizePurchaseOrder,
};

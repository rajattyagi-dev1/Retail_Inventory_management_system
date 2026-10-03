import api from './api';

/**
 * Normalizes backend customer order object to frontend consumption model.
 *
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeOrder(raw) {
  if (!raw) return null;

  const items = (raw.items || []).map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const total = Number(item.total) || quantity * unitPrice;

    return {
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName || item.product?.name || '',
      sku: item.sku || item.product?.sku || '',
      quantity,
      unitPrice,
      total,
      product: item.product || null,
    };
  });

  const orderDate = raw.orderDate
    ? String(raw.orderDate).split('T')[0]
    : (raw.createdAt ? String(raw.createdAt).split('T')[0] : '');

  // Extract address string or structured object
  const shippingAddressObj =
    typeof raw.shippingAddress === 'object' && raw.shippingAddress !== null
      ? raw.shippingAddress
      : {
          address: raw.shippingAddress || '',
          city: raw.shippingCity || '',
          state: raw.shippingState || '',
          pincode: raw.shippingPincode || '',
        };

  return {
    id: raw.id,
    orderNumber: raw.orderNumber || '',
    customerName: raw.customerName || '',
    customerEmail: raw.customerEmail || '',
    customerPhone: raw.customerPhone || '',
    shippingAddress: shippingAddressObj,
    warehouseId: raw.warehouseId || '',
    warehouseName: raw.warehouseName || raw.warehouse?.name || '',
    warehouseCode: raw.warehouseCode || raw.warehouse?.code || '',
    orderDate,
    status: raw.status || 'PENDING',
    paymentStatus: raw.paymentStatus || 'PENDING',
    subtotal: Number(raw.subtotal) || 0,
    tax: Number(raw.tax) || 0,
    shipping: Number(raw.shipping) || 0,
    totalAmount: Number(raw.totalAmount) || 0,
    cancellationReason: raw.cancellationReason || '',
    items,
    itemCount: raw.itemCount ?? items.length,
    totalQuantity: raw.totalQuantity ?? items.reduce((sum, it) => sum + it.quantity, 0),
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || '',
    warehouse: raw.warehouse || null,
  };
}

/**
 * Fetch paginated, filtered customer orders from GET /api/orders.
 */
export async function getOrders(params = {}) {
  const response = await api.get('/orders', params);
  return {
    data: (response.data || []).map(normalizeOrder),
    pagination: response.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch single order by ID from GET /api/orders/:id.
 */
export async function getOrderById(id) {
  const response = await api.get(`/orders/${id}`);
  return normalizeOrder(response.data);
}

/**
 * Create a new customer order via POST /api/orders.
 * Note: If status is 'CONFIRMED', backend atomically reserves stock in Prisma transaction.
 */
export async function createOrder(payload) {
  const response = await api.post('/orders', payload);
  return {
    message: response.message,
    data: normalizeOrder(response.data),
  };
}

/**
 * Reserve stock for an existing PENDING order via POST /api/orders/:id/reserve.
 */
export async function reserveStock(id) {
  const response = await api.post(`/orders/${id}/reserve`);
  return {
    message: response.message,
    data: normalizeOrder(response.data),
  };
}

/**
 * Advance or update order fulfillment status via PATCH /api/orders/:id/status.
 * When transitioned to 'SHIPPED', backend automatically handles stock deductions and SALE movements.
 */
export async function updateOrderStatus(id, status, reason = '', notes = '') {
  const response = await api.patch(`/orders/${id}/status`, { status, reason, notes });
  return {
    message: response.message,
    data: normalizeOrder(response.data),
  };
}

/**
 * Cancel an order via POST /api/orders/:id/cancel.
 * Backend atomically releases any reserved stock.
 */
export async function cancelOrder(id, reason = '') {
  const response = await api.post(`/orders/${id}/cancel`, { reason });
  return {
    message: response.message,
    data: normalizeOrder(response.data),
  };
}

export default {
  getOrders,
  getOrderById,
  createOrder,
  reserveStock,
  updateOrderStatus,
  cancelOrder,
  normalizeOrder,
};

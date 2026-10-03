import React, { useState, useEffect, useCallback } from 'react';
import { OrderContext } from './orderContextInstance';
import orderService from '../services/orderService';
import { useInventory } from '../hooks/useInventory';

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 1 });
  const [toast, setToast] = useState(null);

  // Hook into inventory to refresh stock numbers when orders reserve or ship
  const { fetchInventory, fetchStockMovements } = useInventory();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  /**
   * Fetch orders from backend REST API.
   */
  const fetchOrders = useCallback(async (params = { limit: 100 }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.getOrders(params);
      setOrders(result.data);
      setPagination(result.pagination);
      return result.data;
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Failed to load customer orders');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create customer order via backend API.
   * If status is CONFIRMED, backend atomically reserves stock in Prisma transaction.
   */
  const createOrder = async (newOrderData) => {
    try {
      const result = await orderService.createOrder(newOrderData);
      setOrders((prev) => [result.data, ...prev]);

      // If stock was reserved on creation, refresh inventory state
      if (['CONFIRMED', 'PROCESSING', 'PICKING', 'PACKED'].includes(result.data.status)) {
        if (typeof fetchInventory === 'function') fetchInventory();
        if (typeof fetchStockMovements === 'function') fetchStockMovements();
      }

      showToast(`Order ${result.data.orderNumber} created successfully.`);
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to create order', 'error');
      throw err;
    }
  };

  /**
   * Update order fulfillment status via backend API.
   * Backend handles transition validation, stock deductions upon SHIPPED, and audit logging.
   */
  const updateOrderStatus = async (id, newStatus, reason = '', notes = '') => {
    try {
      const result = await orderService.updateOrderStatus(id, newStatus, reason, notes);
      setOrders((prev) =>
        prev.map((order) => (String(order.id) === String(id) ? result.data : order))
      );

      // If transition impacts stock (e.g. SHIPPED or CANCELLED), refresh inventory
      if (['SHIPPED', 'CANCELLED'].includes(newStatus)) {
        if (typeof fetchInventory === 'function') fetchInventory();
        if (typeof fetchStockMovements === 'function') fetchStockMovements();
      }

      showToast(`Order status updated to ${newStatus}.`, 'info');
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
      throw err;
    }
  };

  /**
   * Reserve stock for an existing order via backend API.
   */
  const reserveStock = async (id) => {
    try {
      const result = await orderService.reserveStock(id);
      setOrders((prev) =>
        prev.map((order) => (String(order.id) === String(id) ? result.data : order))
      );
      if (typeof fetchInventory === 'function') fetchInventory();
      showToast('Stock reserved successfully.', 'success');
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to reserve stock', 'error');
      throw err;
    }
  };

  /**
   * Cancel an order via backend API. Releases any reserved stock.
   */
  const cancelOrder = async (id, reason = 'Customer requested cancellation') => {
    try {
      const result = await orderService.cancelOrder(id, reason);
      setOrders((prev) =>
        prev.map((order) => (String(order.id) === String(id) ? result.data : order))
      );
      if (typeof fetchInventory === 'function') fetchInventory();
      showToast('Order has been cancelled.', 'warning');
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error');
      throw err;
    }
  };

  /**
   * Synchronous cache lookup for order by ID.
   */
  const getOrderById = useCallback(
    (id) => {
      if (!id) return null;
      return orders.find((order) => String(order.id) === String(id)) || null;
    },
    [orders]
  );

  const getOrdersByCustomer = useCallback(
    (email) => {
      if (!email) return [];
      return orders.filter(
        (o) => o.customerEmail && o.customerEmail.toLowerCase() === email.toLowerCase()
      );
    },
    [orders]
  );

  const getWarehouseOrders = useCallback(
    (warehouseId) => {
      if (!warehouseId) return [];
      return orders.filter((o) => String(o.warehouseId) === String(warehouseId));
    },
    [orders]
  );

  // Load orders on mount if authenticated
  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [fetchOrders]);

  const value = {
    orders,
    loading,
    error,
    pagination,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    reserveStock,
    cancelOrder,
    getOrderById,
    getOrdersByCustomer,
    getWarehouseOrders,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`app-toast toast-${toast.type}`} role="status">
          <span>{toast.message}</span>
        </div>
      )}
    </OrderContext.Provider>
  );
}

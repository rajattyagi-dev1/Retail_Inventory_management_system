import React, { useState, useEffect, useCallback } from 'react';
import { PurchaseOrderContext } from './purchaseOrderContextInstance';
import purchaseOrderService from '../services/purchaseOrderService';
import { useInventory } from '../hooks/useInventory';

export function PurchaseOrderProvider({ children }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 1 });
  const [toast, setToast] = useState(null);

  // Hook into inventory to refresh physical inventory counts after backend receiving
  const { fetchInventory, fetchStockMovements } = useInventory();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  /**
   * Fetch purchase orders list from backend API.
   */
  const fetchPurchaseOrders = useCallback(async (params = { limit: 100 }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await purchaseOrderService.getPurchaseOrders(params);
      setPurchaseOrders(result.data);
      setPagination(result.pagination);
      return result.data;
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
      setError(err.message || 'Failed to load purchase orders');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new purchase order via backend API.
   */
  const createPurchaseOrder = async (newPOData) => {
    try {
      const result = await purchaseOrderService.createPurchaseOrder(newPOData);
      setPurchaseOrders((prev) => [result.data, ...prev]);
      showToast(`Purchase Order ${result.data.poNumber} generated successfully.`);
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to create purchase order', 'error');
      throw err;
    }
  };

  /**
   * Update an existing purchase order via backend API.
   */
  const updatePurchaseOrder = async (id, updatedFields) => {
    try {
      const result = await purchaseOrderService.updatePurchaseOrder(id, updatedFields);
      setPurchaseOrders((prev) =>
        prev.map((po) => (String(po.id) === String(id) ? result.data : po))
      );
      showToast('Purchase Order updated successfully.');
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to update purchase order', 'error');
      throw err;
    }
  };

  /**
   * Synchronous cache lookup for purchase order by ID.
   */
  const getPurchaseOrderById = useCallback(
    (id) => {
      if (!id) return null;
      return purchaseOrders.find((po) => String(po.id) === String(id)) || null;
    },
    [purchaseOrders]
  );

  /**
   * Approve purchase order via backend API.
   */
  const approvePurchaseOrder = async (id) => {
    try {
      const result = await purchaseOrderService.approvePurchaseOrder(id);
      setPurchaseOrders((prev) =>
        prev.map((po) => (String(po.id) === String(id) ? result.data : po))
      );
      showToast('Purchase Order approved. Ready for warehouse delivery.', 'info');
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to approve purchase order', 'error');
      throw err;
    }
  };

  /**
   * Cancel purchase order via backend API status transition.
   */
  const cancelPurchaseOrder = async (id, reason = 'Procurement request cancelled') => {
    try {
      const result = await purchaseOrderService.updatePurchaseOrderStatus(id, 'CANCELLED');
      setPurchaseOrders((prev) =>
        prev.map((po) => (String(po.id) === String(id) ? result.data : po))
      );
      showToast('Purchase Order has been cancelled.', 'warning');
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to cancel purchase order', 'error');
      throw err;
    }
  };

  /**
   * Receive goods for a purchase order.
   * Dispatches directly to backend atomic transaction POST /api/purchase-orders/:id/receive.
   * Backend atomically increments inventory, creates RECEIPT stock movement, and updates PO.
   */
  const receivePurchaseOrder = async (id, quantitiesMap = {}, notes = '', performedBy = '') => {
    try {
      const payload = {
        quantities: quantitiesMap,
        notes: notes || undefined,
        performedBy: performedBy || undefined,
      };

      const result = await purchaseOrderService.receiveGoods(id, payload);

      setPurchaseOrders((prev) =>
        prev.map((po) => (String(po.id) === String(id) ? result.data : po))
      );

      // Refresh authoritative inventory and movement ledger
      if (typeof fetchInventory === 'function') {
        fetchInventory();
      }
      if (typeof fetchStockMovements === 'function') {
        fetchStockMovements();
      }

      showToast(
        `Goods received successfully. Status updated to ${result.data.status}.`,
        'success'
      );
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to receive goods against purchase order', 'error');
      throw err;
    }
  };

  const getSupplierPurchaseOrders = useCallback(
    (supplierId) => {
      if (!supplierId) return [];
      return purchaseOrders.filter((po) => String(po.supplierId) === String(supplierId));
    },
    [purchaseOrders]
  );

  const getWarehousePurchaseOrders = useCallback(
    (warehouseId) => {
      if (!warehouseId) return [];
      return purchaseOrders.filter((po) => String(po.warehouseId) === String(warehouseId));
    },
    [purchaseOrders]
  );

  // Load POs on mount if authenticated
  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchPurchaseOrders();
    } else {
      setLoading(false);
    }
  }, [fetchPurchaseOrders]);

  const value = {
    purchaseOrders,
    loading,
    error,
    pagination,
    fetchPurchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrderById,
    approvePurchaseOrder,
    cancelPurchaseOrder,
    receivePurchaseOrder,
    getSupplierPurchaseOrders,
    getWarehousePurchaseOrders,
  };

  return (
    <PurchaseOrderContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`app-toast toast-${toast.type}`} role="status">
          <span>{toast.message}</span>
        </div>
      )}
    </PurchaseOrderContext.Provider>
  );
}

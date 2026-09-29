import React, { useState, useEffect, useCallback } from 'react';
import { WarehouseContext } from './warehouseContextInstance';
import warehouseService from '../services/warehouseService';

export function WarehouseProvider({ children }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const fetchWarehouses = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await warehouseService.getWarehouses(params);
      setWarehouses(result.data);
      if (result.pagination) {
        setPagination(result.pagination);
      }
      return result;
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
      const msg = err.message || 'Failed to load warehouses from server.';
      setError(msg);
      return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWarehouse = useCallback(async (id) => {
    try {
      const warehouse = await warehouseService.getWarehouseById(id);
      return warehouse;
    } catch (err) {
      console.error(`Failed to fetch warehouse ${id}:`, err);
      throw err;
    }
  }, []);

  const getWarehouseById = useCallback(
    (id) => {
      if (!id) return null;
      return (
        warehouses.find(
          (w) =>
            String(w.id) === String(id) ||
            w.code?.toLowerCase() === String(id).toLowerCase()
        ) || null
      );
    },
    [warehouses]
  );

  const createWarehouse = useCallback(
    async (formData) => {
      try {
        const newWarehouse = await warehouseService.createWarehouse(formData);
        setWarehouses((prev) => [newWarehouse, ...prev]);
        showToast(`Warehouse "${newWarehouse.name}" created successfully.`, 'success');
        return newWarehouse;
      } catch (err) {
        const msg = err.message || 'Failed to create warehouse.';
        showToast(msg, 'error');
        throw err;
      }
    },
    [showToast]
  );

  // Backward-compatible alias
  const addWarehouse = createWarehouse;

  const updateWarehouse = useCallback(
    async (id, updatedFields) => {
      try {
        const updated = await warehouseService.updateWarehouse(id, updatedFields);
        setWarehouses((prev) =>
          prev.map((wh) => (String(wh.id) === String(id) ? updated : wh))
        );
        showToast(`Warehouse "${updated.name}" updated successfully.`, 'success');
        return updated;
      } catch (err) {
        const msg = err.message || 'Failed to update warehouse.';
        showToast(msg, 'error');
        throw err;
      }
    },
    [showToast]
  );

  const updateWarehouseStatus = useCallback(
    async (id, status) => {
      try {
        const updated = await warehouseService.updateWarehouseStatus(id, status);
        setWarehouses((prev) =>
          prev.map((wh) => (String(wh.id) === String(id) ? updated : wh))
        );
        showToast(
          `Warehouse "${updated.name}" status changed to ${updated.status}.`,
          updated.status === 'ACTIVE' ? 'success' : 'info'
        );
        return updated;
      } catch (err) {
        const msg = err.message || 'Failed to update warehouse status.';
        showToast(msg, 'error');
        throw err;
      }
    },
    [showToast]
  );

  const toggleWarehouseStatus = useCallback(
    async (id) => {
      const existing = warehouses.find((w) => String(w.id) === String(id));
      if (!existing) return;
      const newStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      return updateWarehouseStatus(id, newStatus);
    },
    [warehouses, updateWarehouseStatus]
  );

  // Initial load from MySQL on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await fetchWarehouses({ page: 1, limit: 10 });
      } catch (err) {
        if (active) console.error('Initial warehouse catalog load failed:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchWarehouses]);

  return (
    <WarehouseContext.Provider
      value={{
        warehouses,
        loading,
        error,
        pagination,
        toast,
        showToast,
        fetchWarehouses,
        fetchWarehouse,
        getWarehouseById,
        createWarehouse,
        addWarehouse,
        updateWarehouse,
        updateWarehouseStatus,
        toggleWarehouseStatus,
      }}
    >
      {children}

      {/* Global Toast Feedback */}
      {toast && (
        <div
          className={`app-toast toast-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span>{toast.message}</span>
        </div>
      )}
    </WarehouseContext.Provider>
  );
}

export default WarehouseProvider;

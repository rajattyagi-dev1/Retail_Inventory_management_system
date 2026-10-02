import React, { useState, useEffect, useCallback } from 'react';
import { InventoryContext } from './inventoryContextInstance';
import inventoryService from '../services/inventoryService';
import stockMovementService from '../services/stockMovementService';

export function InventoryProvider({ children }) {
  const [inventory, setInventory] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [movementPagination, setMovementPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  /**
   * Fetch paginated & filtered inventory list from the real API.
   */
  const fetchInventory = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await inventoryService.getInventory(params);
      setInventory(result.data);
      setPagination(result.pagination);
      return result;
    } catch (err) {
      const errMsg = err.message || 'Failed to load inventory records';
      setError(errMsg);
      return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch a single inventory record by ID from the API.
   */
  const fetchInventoryById = useCallback(async (id) => {
    if (!id) return null;
    try {
      const item = await inventoryService.getInventoryById(id);
      return item;
    } catch (err) {
      console.error(`Error fetching inventory ${id}:`, err);
      return null;
    }
  }, []);

  /**
   * Fetch inventory items for a specific warehouse from the API.
   */
  const fetchWarehouseInventory = useCallback(async (warehouseId, params = {}) => {
    if (!warehouseId) return { data: [], pagination: {} };
    try {
      return await inventoryService.getInventoryByWarehouse(warehouseId, params);
    } catch (err) {
      console.error(`Error fetching warehouse inventory ${warehouseId}:`, err);
      return { data: [], pagination: {} };
    }
  }, []);

  /**
   * Fetch inventory allocations for a product across all warehouses from the API.
   */
  const fetchProductInventory = useCallback(async (productId, params = {}) => {
    if (!productId) return { data: [], pagination: {} };
    try {
      return await inventoryService.getInventoryByProduct(productId, params);
    } catch (err) {
      console.error(`Error fetching product inventory ${productId}:`, err);
      return { data: [], pagination: {} };
    }
  }, []);

  /**
   * Fetch paginated stock movements ledger entries from the API.
   */
  const fetchStockMovements = useCallback(async (params = {}) => {
    try {
      const result = await stockMovementService.getStockMovements(params);
      setStockMovements(result.data);
      setMovementPagination(result.pagination);
      return result;
    } catch (err) {
      console.error('Error fetching stock movements:', err);
      return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } };
    }
  }, []);

  /**
   * Fetch a single stock movement by ID from the API.
   */
  const fetchStockMovementById = useCallback(async (id) => {
    if (!id) return null;
    try {
      return await stockMovementService.getStockMovementById(id);
    } catch (err) {
      console.error(`Error fetching movement ${id}:`, err);
      return null;
    }
  }, []);

  /**
   * Fetch stock movements for a specific warehouse from the API.
   */
  const fetchWarehouseStockMovements = useCallback(async (warehouseId, params = {}) => {
    if (!warehouseId) return { data: [], pagination: {} };
    try {
      return await stockMovementService.getStockMovementsByWarehouse(warehouseId, params);
    } catch (err) {
      console.error(`Error fetching warehouse movements ${warehouseId}:`, err);
      return { data: [], pagination: {} };
    }
  }, []);

  /**
   * Fetch stock movements for a specific product from the API.
   */
  const fetchProductStockMovements = useCallback(async (productId, params = {}) => {
    if (!productId) return { data: [], pagination: {} };
    try {
      return await stockMovementService.getStockMovementsByProduct(productId, params);
    } catch (err) {
      console.error(`Error fetching product movements ${productId}:`, err);
      return { data: [], pagination: {} };
    }
  }, []);

  /**
   * Perform atomic stock adjustment via the backend API.
   */
  const adjustStock = useCallback(
    async (payload) => {
      setIsAdjusting(true);
      try {
        const result = await inventoryService.adjustStock(payload);

        // Refresh inventory and movements data from authoritative backend
        await Promise.all([
          fetchInventory({ page: pagination.page || 1, limit: pagination.limit || 10 }),
          fetchStockMovements({ page: 1, limit: 10 }),
        ]);

        showToast(result.message || 'Stock adjusted successfully', 'success');
        return result.inventory;
      } catch (err) {
        const errorMessage = err.message || 'Failed to adjust stock';
        showToast(errorMessage, 'error');
        throw err;
      } finally {
        setIsAdjusting(false);
      }
    },
    [fetchInventory, fetchStockMovements, pagination.page, pagination.limit]
  );

  /**
   * Update stock compatibility helper (calls adjustStock with SET).
   */
  const updateStock = useCallback(
    async (id, newStockCount) => {
      return await adjustStock({
        inventoryId: id,
        type: 'SET',
        quantity: newStockCount,
        reason: 'Direct Stock Count Update',
      });
    },
    [adjustStock]
  );

  // Synchronous lookup helpers for components that query in-memory state
  const getInventoryById = useCallback(
    (id) => {
      if (!id) return null;
      return inventory.find((item) => String(item.id) === String(id) || String(item.productId) === String(id)) || null;
    },
    [inventory]
  );

  const getStockStatus = useCallback((currentStock, reorderLevel) => {
    const cur = Number(currentStock) || 0;
    const reorder = Number(reorderLevel) || 0;
    if (cur === 0) return 'OUT_OF_STOCK';
    if (cur <= reorder) return 'LOW_STOCK';
    return 'IN_STOCK';
  }, []);

  const getWarehouseInventory = useCallback(
    (warehouseId) => {
      if (!warehouseId) return [];
      return inventory.filter(
        (item) =>
          String(item.warehouseId) === String(warehouseId) ||
          item.warehouseCode?.toLowerCase() === String(warehouseId).toLowerCase()
      );
    },
    [inventory]
  );

  const getProductInventory = useCallback(
    (productId) => {
      if (!productId) return [];
      return inventory.filter(
        (item) =>
          String(item.productId) === String(productId) ||
          item.sku?.toLowerCase() === String(productId).toLowerCase()
      );
    },
    [inventory]
  );

  const getLowStockItems = useCallback(() => {
    return inventory.filter(
      (item) => item.stockStatus === 'LOW_STOCK' || item.stockStatus === 'OUT_OF_STOCK'
    );
  }, [inventory]);

  const getStockMovements = useCallback(
    (inventoryId) => {
      if (!inventoryId) return stockMovements;
      return stockMovements.filter((mov) => String(mov.inventoryId) === String(inventoryId));
    },
    [stockMovements]
  );

  // Initial data loading on provider mount
  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        await Promise.all([
          fetchInventory({ page: 1, limit: 100 }),
          fetchStockMovements({ page: 1, limit: 100 }),
        ]);
      } catch (err) {
        if (active) {
          console.error('Initial inventory catalog load failed:', err);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchInventory, fetchStockMovements]);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        stockMovements,
        loading,
        isAdjusting,
        error,
        pagination,
        movementPagination,
        toast,
        showToast,
        fetchInventory,
        fetchInventoryById,
        fetchWarehouseInventory,
        fetchProductInventory,
        fetchStockMovements,
        fetchStockMovementById,
        fetchWarehouseStockMovements,
        fetchProductStockMovements,
        getInventoryById,
        updateStock,
        adjustStock,
        getWarehouseInventory,
        getProductInventory,
        getLowStockItems,
        getStockStatus,
        getStockMovements,
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
    </InventoryContext.Provider>
  );
}

export default InventoryProvider;

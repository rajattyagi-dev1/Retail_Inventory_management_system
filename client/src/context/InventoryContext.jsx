import React, { useState } from 'react';
import { InventoryContext } from './inventoryContextInstance';
import { INITIAL_INVENTORY, calculateStockStatus } from '../utils/inventoryMockData';
import { INITIAL_STOCK_MOVEMENTS } from '../utils/stockMovementMockData';

export function InventoryProvider({ children }) {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [stockMovements, setStockMovements] = useState(INITIAL_STOCK_MOVEMENTS);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const getInventoryById = (id) => {
    if (!id) return null;
    return inventory.find((item) => String(item.id) === String(id));
  };

  const getStockStatus = (currentStock, reorderLevel) => {
    return calculateStockStatus(currentStock, reorderLevel);
  };

  const getWarehouseInventory = (warehouseId) => {
    if (!warehouseId) return [];
    return inventory.filter(
      (item) =>
        String(item.warehouseId) === String(warehouseId) ||
        item.warehouseCode?.toLowerCase() === String(warehouseId).toLowerCase()
    );
  };

  const getProductInventory = (productId) => {
    if (!productId) return [];
    return inventory.filter(
      (item) =>
        String(item.productId) === String(productId) ||
        item.sku?.toLowerCase() === String(productId).toLowerCase()
    );
  };

  const getLowStockItems = () => {
    return inventory.filter(
      (item) => item.stockStatus === 'LOW_STOCK' || item.stockStatus === 'OUT_OF_STOCK'
    );
  };

  const getStockMovements = (inventoryId) => {
    if (!inventoryId) return stockMovements;
    return stockMovements.filter((mov) => String(mov.inventoryId) === String(inventoryId));
  };

  const updateStock = (id, newStockCount) => {
    const today = new Date().toISOString().split('T')[0];
    const newStock = Math.max(0, parseInt(newStockCount, 10) || 0);

    setInventory((prev) =>
      prev.map((item) => {
        if (String(item.id) !== String(id)) return item;

        const reserved = Math.min(item.reservedStock, newStock);
        const available = Math.max(0, newStock - reserved);
        const status = calculateStockStatus(newStock, item.reorderLevel);

        return {
          ...item,
          currentStock: newStock,
          reservedStock: reserved,
          availableStock: available,
          stockStatus: status,
          lastUpdated: today,
        };
      })
    );
  };

  const adjustStock = ({
    inventoryId,
    type, // 'ADD STOCK' | 'REMOVE STOCK' | 'SET STOCK'
    quantity,
    reason = 'Manual Reconciliation',
    reference = '',
    notes = '',
    performedBy = 'Inventory Supervisor',
  }) => {
    const targetItem = getInventoryById(inventoryId);
    if (!targetItem) {
      showToast('Inventory record not found.', 'error');
      return null;
    }

    const current = targetItem.currentStock;
    const qty = parseInt(quantity, 10) || 0;
    let newStock = current;
    let diff = 0;

    if (type === 'ADD STOCK') {
      newStock = current + qty;
      diff = qty;
    } else if (type === 'REMOVE STOCK') {
      if (qty > current) {
        showToast(`Cannot remove ${qty} units. Current stock is only ${current}.`, 'warning');
        return null;
      }
      newStock = Math.max(0, current - qty);
      diff = -qty;
    } else if (type === 'SET STOCK') {
      if (qty < 0) {
        showToast('Stock quantity cannot be negative.', 'warning');
        return null;
      }
      newStock = qty;
      diff = newStock - current;
    }

    const reserved = Math.min(targetItem.reservedStock, newStock);
    const available = Math.max(0, newStock - reserved);
    const status = calculateStockStatus(newStock, targetItem.reorderLevel);
    const today = new Date().toISOString().split('T')[0];
    const nowTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const refCode = reference.trim() || `ADJ-${Date.now().toString().slice(-6)}`;

    // Create movement entry
    const newMovement = {
      id: `mov-${Date.now()}`,
      inventoryId: targetItem.id,
      productName: targetItem.productName,
      sku: targetItem.sku,
      warehouseName: targetItem.warehouseName,
      warehouseCode: targetItem.warehouseCode,
      type: 'ADJUSTMENT',
      quantity: diff,
      reference: refCode,
      performedBy: performedBy.trim() || 'Inventory Supervisor',
      timestamp: nowTimestamp,
      notes: `${reason}${notes ? ` - ${notes}` : ''}`,
    };

    setStockMovements((prev) => [newMovement, ...prev]);

    const movementSummary = `${diff >= 0 ? '+' : ''}${diff} units (${type})`;

    setInventory((prev) =>
      prev.map((item) => {
        if (String(item.id) !== String(inventoryId)) return item;
        return {
          ...item,
          currentStock: newStock,
          reservedStock: reserved,
          availableStock: available,
          stockStatus: status,
          lastMovement: movementSummary,
          lastUpdated: today,
        };
      })
    );

    showToast(
      `Adjusted stock for ${targetItem.productName} at ${targetItem.warehouseName}. New stock: ${newStock} units.`
    );

    return {
      ...targetItem,
      currentStock: newStock,
      reservedStock: reserved,
      availableStock: available,
      stockStatus: status,
    };
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        stockMovements,
        toast,
        showToast,
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

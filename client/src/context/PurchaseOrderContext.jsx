import React, { useState } from 'react';
import { PurchaseOrderContext } from './purchaseOrderContextInstance';
import { INITIAL_PURCHASE_ORDERS } from '../utils/purchaseOrderMockData';
import { useInventory } from '../hooks/useInventory';

export function PurchaseOrderProvider({ children }) {
  const [purchaseOrders, setPurchaseOrders] = useState(INITIAL_PURCHASE_ORDERS);
  const [toast, setToast] = useState(null);

  // Hook into inventory to reflect physical receipts
  const { inventory, adjustStock } = useInventory();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const createPurchaseOrder = (newPOData) => {
    const nextNumber = `PO-2026-${String(purchaseOrders.length + 1).padStart(4, '0')}`;
    const nextId = `po-${Date.now().toString().slice(-4)}`;

    const record = {
      ...newPOData,
      id: nextId,
      poNumber: newPOData.poNumber || nextNumber,
      status: newPOData.status || 'PENDING',
      orderDate: newPOData.orderDate || new Date().toISOString().split('T')[0],
      createdBy: newPOData.createdBy || 'Procurement Officer',
      items: (newPOData.items || []).map((item) => ({
        ...item,
        receivedQuantity: 0,
      })),
    };

    setPurchaseOrders((prev) => [record, ...prev]);
    showToast(`Purchase Order ${record.poNumber} generated successfully.`);
    return record;
  };

  const updatePurchaseOrder = (id, updatedFields) => {
    let updatedRecord = null;
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (String(po.id) === String(id)) {
          updatedRecord = { ...po, ...updatedFields };
          return updatedRecord;
        }
        return po;
      })
    );
    showToast('Purchase Order updated successfully.');
    return updatedRecord;
  };

  const getPurchaseOrderById = (id) => {
    if (!id) return null;
    return purchaseOrders.find((po) => String(po.id) === String(id));
  };

  const approvePurchaseOrder = (id) => {
    let updatedRecord = null;
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (String(po.id) === String(id)) {
          updatedRecord = { ...po, status: 'APPROVED' };
          return updatedRecord;
        }
        return po;
      })
    );
    showToast('Purchase Order approved. Ready for warehouse delivery.', 'info');
    return updatedRecord;
  };

  const cancelPurchaseOrder = (id, reason = 'Procurement request cancelled') => {
    let updatedRecord = null;
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (String(po.id) === String(id)) {
          updatedRecord = {
            ...po,
            status: 'CANCELLED',
            notes: po.notes ? `${po.notes} [Cancelled: ${reason}]` : `[Cancelled: ${reason}]`,
          };
          return updatedRecord;
        }
        return po;
      })
    );
    showToast('Purchase Order has been cancelled.', 'warning');
    return updatedRecord;
  };

  /**
   * Receive goods for a purchase order.
   * Updates receivedQuantity on items, calculates overall status,
   * and increments inventory on matching warehouse items with RECEIPT movements.
   */
  const receivePurchaseOrder = (id, receiptsMap, notes = '', performedBy = 'Warehouse Staff') => {
    let updatedPO = null;

    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (String(po.id) !== String(id)) return po;

        let allCompleted = true;
        let anyReceived = false;

        const updatedItems = po.items.map((item) => {
          const addedQty = Number(receiptsMap[item.productId]) || 0;
          const newReceived = (item.receivedQuantity || 0) + addedQty;
          const totalOrdered = item.quantity;

          if (addedQty > 0) {
            anyReceived = true;
            // Bridge with InventoryContext: find matching inventory item in this warehouse
            const matchedInv = inventory.find(
              (inv) =>
                inv.productId === item.productId &&
                (String(inv.warehouseId) === String(po.warehouseId) ||
                  inv.warehouseName === po.warehouseName)
            );

            if (matchedInv) {
              adjustStock({
                inventoryId: matchedInv.id,
                type: 'ADD STOCK',
                quantity: addedQty,
                reason: `Inbound PO Receipt (${po.poNumber})`,
                reference: po.poNumber,
                performedBy: performedBy || 'Inbound Dock Staff',
                notes: notes || `Goods received against PO line ${item.sku}`,
              });
            }
          }

          if (newReceived < totalOrdered) {
            allCompleted = false;
          }

          return {
            ...item,
            receivedQuantity: newReceived,
          };
        });

        let newStatus = po.status;
        if (allCompleted) {
          newStatus = 'RECEIVED';
        } else if (anyReceived) {
          newStatus = 'PARTIALLY_RECEIVED';
        }

        updatedPO = {
          ...po,
          status: newStatus,
          items: updatedItems,
        };
        return updatedPO;
      })
    );

    showToast(`Goods received successfully for PO. Inventory stock updated.`);
    return updatedPO;
  };

  const value = {
    purchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrderById,
    approvePurchaseOrder,
    cancelPurchaseOrder,
    receivePurchaseOrder,
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

import React, { useState } from 'react';
import { OrderContext } from './orderContextInstance';
import { INITIAL_ORDERS } from '../utils/orderMockData';
import { useInventory } from '../hooks/useInventory';

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [toast, setToast] = useState(null);

  const { inventory, updateStock, adjustStock } = useInventory();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const createOrder = (newOrderData) => {
    const nextNumber = `ORD-2026-${String(orders.length + 1).padStart(4, '0')}`;
    const nextId = `ord-${Date.now().toString().slice(-4)}`;

    const record = {
      ...newOrderData,
      id: nextId,
      orderNumber: newOrderData.orderNumber || nextNumber,
      status: newOrderData.status || 'CONFIRMED',
      paymentStatus: newOrderData.paymentStatus || 'PAID',
      orderDate: newOrderData.orderDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Stock reservation logic: increase reservedStock on matching warehouse inventory
    if (record.status !== 'CANCELLED') {
      (record.items || []).forEach((item) => {
        const matched = inventory.find(
          (inv) =>
            inv.productId === item.productId &&
            (String(inv.warehouseId) === String(record.warehouseId) ||
              inv.warehouseName === record.warehouseName)
        );

        if (matched) {
          const newReserved = Math.min(matched.currentStock, (matched.reservedStock || 0) + item.quantity);
          const newAvail = Math.max(0, matched.currentStock - newReserved);
          updateStock(matched.id, {
            reservedStock: newReserved,
            availableStock: newAvail,
          });
        }
      });
    }

    setOrders((prev) => [record, ...prev]);
    showToast(`Order ${record.orderNumber} created. Stock reserved successfully.`);
    return record;
  };

  const updateOrderStatus = (id, newStatus, reason = '') => {
    let updatedOrder = null;

    setOrders((prev) =>
      prev.map((order) => {
        if (String(order.id) !== String(id)) return order;

        const previousStatus = order.status;
        updatedOrder = {
          ...order,
          status: newStatus,
          ...(reason ? { cancellationReason: reason } : {}),
        };

        // Handle stock impact on status changes:
        // 1. If transitioning to SHIPPED: deduct physical stock & clear reservation, log SALE movement
        if (newStatus === 'SHIPPED' && previousStatus !== 'SHIPPED') {
          (order.items || []).forEach((item) => {
            const matched = inventory.find(
              (inv) =>
                inv.productId === item.productId &&
                (String(inv.warehouseId) === String(order.warehouseId) ||
                  inv.warehouseName === order.warehouseName)
            );

            if (matched) {
              const deductQty = item.quantity;
              const newCurrent = Math.max(0, matched.currentStock - deductQty);
              const newReserved = Math.max(0, (matched.reservedStock || 0) - deductQty);
              const newAvail = Math.max(0, newCurrent - newReserved);

              updateStock(matched.id, {
                currentStock: newCurrent,
                reservedStock: newReserved,
                availableStock: newAvail,
              });

              adjustStock({
                inventoryId: matched.id,
                type: 'REMOVE STOCK',
                quantity: deductQty,
                reason: `Customer Dispatch (${order.orderNumber})`,
                reference: order.orderNumber,
                performedBy: 'Dispatch Coordinator',
                notes: `Shipped order to ${order.customerName}`,
              });
            }
          });
        }

        // 2. If cancelling an un-shipped order: release reserved stock
        if (newStatus === 'CANCELLED' && previousStatus !== 'CANCELLED' && previousStatus !== 'SHIPPED') {
          (order.items || []).forEach((item) => {
            const matched = inventory.find(
              (inv) =>
                inv.productId === item.productId &&
                (String(inv.warehouseId) === String(order.warehouseId) ||
                  inv.warehouseName === order.warehouseName)
            );

            if (matched) {
              const releaseQty = item.quantity;
              const newReserved = Math.max(0, (matched.reservedStock || 0) - releaseQty);
              const newAvail = Math.max(0, matched.currentStock - newReserved);

              updateStock(matched.id, {
                reservedStock: newReserved,
                availableStock: newAvail,
              });
            }
          });
        }

        return updatedOrder;
      })
    );

    showToast(`Order status updated to ${newStatus}.`, 'info');
    return updatedOrder;
  };

  const cancelOrder = (id, reason = 'Customer requested cancellation') => {
    return updateOrderStatus(id, 'CANCELLED', reason);
  };

  const getOrderById = (id) => {
    if (!id) return null;
    return orders.find((ord) => String(ord.id) === String(id));
  };

  const getPendingOrders = () => {
    return orders.filter((ord) => ord.status === 'PENDING' || ord.status === 'CONFIRMED');
  };

  const getOrdersByWarehouse = (warehouseId) => {
    if (!warehouseId) return [];
    return orders.filter(
      (ord) =>
        String(ord.warehouseId) === String(warehouseId) ||
        ord.warehouseName?.toLowerCase() === String(warehouseId).toLowerCase()
    );
  };

  const value = {
    orders,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrderById,
    getPendingOrders,
    getOrdersByWarehouse,
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

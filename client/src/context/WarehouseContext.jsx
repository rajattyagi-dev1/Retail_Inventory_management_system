import React, { useState } from 'react';
import { WarehouseContext } from './warehouseContextInstance';
import { INITIAL_WAREHOUSES } from '../utils/warehouseMockData';

export function WarehouseProvider({ children }) {
  const [warehouses, setWarehouses] = useState(INITIAL_WAREHOUSES);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const getWarehouseById = (id) => {
    if (!id) return null;
    return warehouses.find(
      (w) => String(w.id) === String(id) || w.code.toLowerCase() === String(id).toLowerCase()
    );
  };

  const addWarehouse = (formData) => {
    const today = new Date().toISOString().split('T')[0];
    const capacityNum = parseInt(formData.capacity, 10) || 10000;
    const staffNum = parseInt(formData.staffCount, 10) || 0;
    const currentStockNum = parseInt(formData.currentStock, 10) || 0;

    const newWarehouse = {
      id: `wh-${Date.now()}`,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      managerName: formData.managerName.trim(),
      managerEmail: formData.managerEmail.trim(),
      managerPhone: formData.managerPhone.trim(),
      capacity: capacityNum,
      currentStock: currentStockNum,
      status: formData.status || 'ACTIVE',
      staffCount: staffNum,
      createdAt: today,
    };

    setWarehouses((prev) => [newWarehouse, ...prev]);
    showToast(`Warehouse "${newWarehouse.name}" created successfully.`);
    return newWarehouse;
  };

  const updateWarehouse = (id, updatedFields) => {
    setWarehouses((prev) =>
      prev.map((wh) => {
        if (String(wh.id) !== String(id)) return wh;

        return {
          ...wh,
          ...updatedFields,
          capacity: parseInt(updatedFields.capacity, 10) || wh.capacity,
          staffCount: parseInt(updatedFields.staffCount, 10) ?? wh.staffCount,
          currentStock: parseInt(updatedFields.currentStock, 10) ?? wh.currentStock,
        };
      })
    );

    showToast('Warehouse details updated successfully.');
  };

  const toggleWarehouseStatus = (id) => {
    setWarehouses((prev) =>
      prev.map((w) => {
        if (String(w.id) !== String(id)) return w;
        const newStatus = w.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        showToast(
          `Warehouse "${w.name}" marked as ${newStatus}.`,
          newStatus === 'ACTIVE' ? 'success' : 'info'
        );
        return { ...w, status: newStatus };
      })
    );
  };

  return (
    <WarehouseContext.Provider
      value={{
        warehouses,
        toast,
        showToast,
        getWarehouseById,
        addWarehouse,
        updateWarehouse,
        toggleWarehouseStatus,
      }}
    >
      {children}

      {/* Global Toast Feedback for Warehouse Actions */}
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

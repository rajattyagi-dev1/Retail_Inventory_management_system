import React, { useState } from 'react';
import { SupplierContext } from './supplierContextInstance';
import { INITIAL_SUPPLIERS } from '../utils/supplierMockData';

export function SupplierProvider({ children }) {
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const addSupplier = (newSupplierData) => {
    const nextId = `sup-${Date.now().toString().slice(-4)}`;
    const nextCode = `SUP-${(newSupplierData.city || 'IND').slice(0, 3).toUpperCase()}-${String(
      suppliers.length + 1
    ).padStart(3, '0')}`;

    const record = {
      ...newSupplierData,
      id: nextId,
      supplierCode: newSupplierData.supplierCode || nextCode,
      status: newSupplierData.status || 'ACTIVE',
      productsSupplied: Number(newSupplierData.productsSupplied) || 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setSuppliers((prev) => [record, ...prev]);
    showToast(`Supplier "${record.name}" added successfully.`);
    return record;
  };

  const updateSupplier = (id, updatedFields) => {
    let updatedRecord = null;
    setSuppliers((prev) =>
      prev.map((sup) => {
        if (String(sup.id) === String(id)) {
          updatedRecord = { ...sup, ...updatedFields };
          return updatedRecord;
        }
        return sup;
      })
    );
    showToast('Supplier details updated successfully.');
    return updatedRecord;
  };

  const toggleSupplierStatus = (id) => {
    let newStatus = 'ACTIVE';
    setSuppliers((prev) =>
      prev.map((sup) => {
        if (String(sup.id) === String(id)) {
          newStatus = sup.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          return { ...sup, status: newStatus };
        }
        return sup;
      })
    );
    showToast(`Supplier status updated to ${newStatus}.`, 'info');
  };

  const getSupplierById = (id) => {
    if (!id) return null;
    return suppliers.find((sup) => String(sup.id) === String(id));
  };

  const getActiveSuppliers = () => {
    return suppliers.filter((sup) => sup.status === 'ACTIVE');
  };

  const value = {
    suppliers,
    addSupplier,
    updateSupplier,
    toggleSupplierStatus,
    getSupplierById,
    getActiveSuppliers,
  };

  return (
    <SupplierContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`app-toast toast-${toast.type}`} role="status">
          <span>{toast.message}</span>
        </div>
      )}
    </SupplierContext.Provider>
  );
}

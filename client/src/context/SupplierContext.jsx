import React, { useState, useEffect, useCallback } from 'react';
import { SupplierContext } from './supplierContextInstance';
import supplierService from '../services/supplierService';

export function SupplierProvider({ children }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 1 });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  /**
   * Fetch suppliers list from backend API.
   */
  const fetchSuppliers = useCallback(async (params = { limit: 100 }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supplierService.getSuppliers(params);
      setSuppliers(result.data);
      setPagination(result.pagination);
      return result.data;
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      setError(err.message || 'Failed to load suppliers');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new supplier in MySQL via backend API.
   */
  const addSupplier = async (newSupplierData) => {
    try {
      const result = await supplierService.createSupplier(newSupplierData);
      setSuppliers((prev) => [result.data, ...prev]);
      showToast(`Supplier "${result.data.name}" added successfully.`);
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to create supplier', 'error');
      throw err;
    }
  };

  /**
   * Update an existing supplier in MySQL via backend API.
   */
  const updateSupplier = async (id, updatedFields) => {
    try {
      const result = await supplierService.updateSupplier(id, updatedFields);
      setSuppliers((prev) =>
        prev.map((sup) => (String(sup.id) === String(id) ? result.data : sup))
      );
      showToast('Supplier details updated successfully.');
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to update supplier', 'error');
      throw err;
    }
  };

  /**
   * Toggle supplier active/inactive status via backend API.
   */
  const toggleSupplierStatus = async (id) => {
    const target = suppliers.find((s) => String(s.id) === String(id));
    const nextStatus = target && target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await supplierService.updateSupplierStatus(id, nextStatus);
      setSuppliers((prev) =>
        prev.map((sup) => (String(sup.id) === String(id) ? result.data : sup))
      );
      showToast(`Supplier status updated to ${nextStatus}.`, 'info');
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to update supplier status', 'error');
      throw err;
    }
  };

  /**
   * Find supplier by ID (synchronous cache or fallback).
   */
  const getSupplierById = useCallback(
    (id) => {
      if (!id) return null;
      return suppliers.find((sup) => String(sup.id) === String(id)) || null;
    },
    [suppliers]
  );

  /**
   * Filter active suppliers for select dropdowns.
   */
  const getActiveSuppliers = useCallback(() => {
    return suppliers.filter((sup) => sup.status === 'ACTIVE');
  }, [suppliers]);

  // Load suppliers on provider mount if authenticated
  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchSuppliers();
    } else {
      setLoading(false);
    }
  }, [fetchSuppliers]);

  const value = {
    suppliers,
    loading,
    error,
    pagination,
    fetchSuppliers,
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

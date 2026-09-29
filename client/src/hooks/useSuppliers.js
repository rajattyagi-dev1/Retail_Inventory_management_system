import { useContext } from 'react';
import { SupplierContext } from '../context/supplierContextInstance';

export function useSuppliers() {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSuppliers must be used within a SupplierProvider');
  }
  return context;
}

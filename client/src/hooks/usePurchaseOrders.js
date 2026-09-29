import { useContext } from 'react';
import { PurchaseOrderContext } from '../context/purchaseOrderContextInstance';

export function usePurchaseOrders() {
  const context = useContext(PurchaseOrderContext);
  if (!context) {
    throw new Error('usePurchaseOrders must be used within a PurchaseOrderProvider');
  }
  return context;
}

import { useContext } from 'react';
import { InventoryContext } from '../context/inventoryContextInstance';

/**
 * Custom hook to access Inventory context and mutations.
 */
export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}

export default useInventory;

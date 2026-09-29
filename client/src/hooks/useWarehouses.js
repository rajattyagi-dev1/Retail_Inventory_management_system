import { useContext } from 'react';
import { WarehouseContext } from '../context/warehouseContextInstance';

/**
 * Custom hook to access warehouse catalog state and actions.
 */
export function useWarehouses() {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouses must be used within a WarehouseProvider');
  }
  return context;
}

export default useWarehouses;

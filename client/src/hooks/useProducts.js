import { useContext } from 'react';
import { ProductContext } from '../context/productContextInstance';

/**
 * Custom hook to access product catalog state and actions.
 */
export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}

export default useProducts;

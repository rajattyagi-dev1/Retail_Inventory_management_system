import { createContext } from 'react';

/**
 * Dedicated context instance for Customer Orders & Fulfillment.
 * Separated into standalone file for Vite Fast Refresh compliance.
 */
export const OrderContext = createContext(null);

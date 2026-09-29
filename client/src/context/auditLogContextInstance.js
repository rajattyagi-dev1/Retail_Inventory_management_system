import { createContext } from 'react';

/**
 * Dedicated context instance for System Audit Logs.
 * Separated into standalone file for Vite Fast Refresh compliance.
 */
export const AuditLogContext = createContext(null);

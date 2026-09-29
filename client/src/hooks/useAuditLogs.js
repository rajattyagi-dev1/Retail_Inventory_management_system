import { useContext } from 'react';
import { AuditLogContext } from '../context/auditLogContextInstance';

export function useAuditLogs() {
  const context = useContext(AuditLogContext);
  if (!context) {
    throw new Error('useAuditLogs must be used within an AuditLogProvider');
  }
  return context;
}

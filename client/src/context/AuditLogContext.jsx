import React, { useState } from 'react';
import { AuditLogContext } from './auditLogContextInstance';
import { INITIAL_AUDIT_LOGS } from '../utils/auditLogMockData';

export function AuditLogProvider({ children }) {
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  const addAuditLog = (entry) => {
    const nextId = `aud-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    const record = {
      ...entry,
      id: nextId,
      timestamp: entry.timestamp || timestamp,
      user: entry.user || 'Alex Mercer',
      severity: entry.severity || 'INFO',
    };

    setAuditLogs((prev) => [record, ...prev]);
    return record;
  };

  const getAuditLogs = () => {
    return auditLogs;
  };

  const value = {
    auditLogs,
    addAuditLog,
    getAuditLogs,
  };

  return (
    <AuditLogContext.Provider value={value}>
      {children}
    </AuditLogContext.Provider>
  );
}

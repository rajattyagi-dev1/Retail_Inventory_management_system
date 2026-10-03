import React, { useState, useEffect, useCallback } from 'react';
import { AuditLogContext } from './auditLogContextInstance';
import auditLogService from '../services/auditLogService';
import { useAuth } from '../hooks/useAuth';

export function AuditLogProvider({ children }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 1 });

  const { user: authUser } = useAuth();

  /**
   * Fetch live audit log records from backend API. Requires ADMIN role.
   */
  const fetchAuditLogs = useCallback(async (params = { limit: 100 }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditLogService.getAuditLogs(params);
      setAuditLogs(result.data);
      setPagination(result.pagination);
      return result.data;
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError(err.message || 'Failed to load audit logs');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAuditLogs = useCallback(() => {
    return auditLogs;
  }, [auditLogs]);

  const addAuditLog = (entry) => {
    // Audit logs are created automatically by backend services; transient helper for UI compatibility
    const record = {
      ...entry,
      id: `local-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: entry.user || authUser?.name || 'System Operator',
      severity: entry.severity || 'INFO',
    };
    setAuditLogs((prev) => [record, ...prev]);
    return record;
  };

  // Load audit logs on mount if user is ADMIN
  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && authUser?.role === 'ADMIN') {
      fetchAuditLogs();
    } else {
      setLoading(false);
    }
  }, [authUser?.role, fetchAuditLogs]);

  const value = {
    auditLogs,
    loading,
    error,
    pagination,
    fetchAuditLogs,
    addAuditLog,
    getAuditLogs,
  };

  return (
    <AuditLogContext.Provider value={value}>
      {children}
    </AuditLogContext.Provider>
  );
}

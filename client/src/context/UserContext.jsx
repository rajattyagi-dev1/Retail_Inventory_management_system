import React, { useState, useEffect, useCallback } from 'react';
import { UserContext } from './userContextInstance';
import userService from '../services/userService';
import { useAuth } from '../hooks/useAuth';

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 1 });
  const [toast, setToast] = useState(null);

  const { user: authUser } = useAuth();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  /**
   * Fetch users from backend API. Requires ADMIN role.
   */
  const fetchUsers = useCallback(async (params = { limit: 100 }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.getUsers(params);
      setUsers(result.data);
      setPagination(result.pagination);
      return result.data;
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to load user accounts');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all system security roles from backend API.
   */
  const fetchRoles = useCallback(async () => {
    try {
      const rolesList = await userService.getRoles();
      setRoles(rolesList);
      return rolesList;
    } catch (err) {
      console.error('Failed to fetch security roles:', err);
      return [];
    }
  }, []);

  /**
   * Create new user via backend API.
   */
  const addUser = async (newUserData) => {
    try {
      const result = await userService.createUser(newUserData);
      setUsers((prev) => [result.data, ...prev]);
      showToast(`User account "${result.data.name}" created successfully.`);
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to create user account', 'error');
      throw err;
    }
  };

  /**
   * Update existing user via backend API.
   */
  const updateUser = async (id, updatedFields) => {
    try {
      const result = await userService.updateUser(id, updatedFields);
      setUsers((prev) =>
        prev.map((u) => (String(u.id) === String(id) ? result.data : u))
      );
      showToast('User profile updated successfully.');
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to update user', 'error');
      throw err;
    }
  };

  /**
   * Toggle user active/inactive status via backend API.
   */
  const toggleUserStatus = async (id) => {
    const target = users.find((u) => String(u.id) === String(id));
    const nextStatus = target && target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await userService.updateUserStatus(id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (String(u.id) === String(id) ? result.data : u))
      );
      showToast(`User access status changed to ${nextStatus}.`, 'info');
      return result.data;
    } catch (err) {
      showToast(err.message || 'Failed to update user status', 'error');
      throw err;
    }
  };

  const getUserById = useCallback(
    (id) => {
      if (!id) return null;
      return users.find((u) => String(u.id) === String(id)) || null;
    },
    [users]
  );

  // Load users and roles on mount if authenticated user is ADMIN
  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && authUser?.role === 'ADMIN') {
      fetchUsers();
      fetchRoles();
    } else {
      setLoading(false);
    }
  }, [authUser?.role, fetchUsers, fetchRoles]);

  const value = {
    users,
    roles,
    loading,
    error,
    pagination,
    fetchUsers,
    fetchRoles,
    addUser,
    updateUser,
    toggleUserStatus,
    getUserById,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`app-toast toast-${toast.type}`} role="status">
          <span>{toast.message}</span>
        </div>
      )}
    </UserContext.Provider>
  );
}

import React, { useState } from 'react';
import { UserContext } from './userContextInstance';
import { INITIAL_USERS } from '../utils/userMockData';

export function UserProvider({ children }) {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const addUser = (newUserData) => {
    const nextId = `usr-${Date.now().toString().slice(-4)}`;
    const record = {
      ...newUserData,
      id: nextId,
      status: newUserData.status || 'ACTIVE',
      lastLogin: 'Never',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [record, ...prev]);
    showToast(`User account "${record.name}" created successfully.`);
    return record;
  };

  const updateUser = (id, updatedFields) => {
    let updatedRecord = null;
    setUsers((prev) =>
      prev.map((user) => {
        if (String(user.id) === String(id)) {
          updatedRecord = { ...user, ...updatedFields };
          return updatedRecord;
        }
        return user;
      })
    );
    showToast('User profile updated successfully.');
    return updatedRecord;
  };

  const toggleUserStatus = (id) => {
    let newStatus = 'ACTIVE';
    setUsers((prev) =>
      prev.map((user) => {
        if (String(user.id) === String(id)) {
          newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          return { ...user, status: newStatus };
        }
        return user;
      })
    );
    showToast(`User access status changed to ${newStatus}.`, 'info');
  };

  const getUserById = (id) => {
    if (!id) return null;
    return users.find((user) => String(user.id) === String(id));
  };

  const value = {
    users,
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

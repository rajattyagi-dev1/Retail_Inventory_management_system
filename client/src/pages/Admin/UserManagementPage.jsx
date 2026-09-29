import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  X,
  Filter,
  ArrowUpDown,
  Edit,
  Power,
  Mail,
} from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';

const ITEMS_PER_PAGE = 10;

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { users, toggleUserStatus } = useUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.name?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesDept = u.department?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept) return false;
      }

      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    switch (sortBy) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'recent':
      default:
        return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
  }, [filteredUsers, sortBy]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedUsers, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setSortBy('name-asc');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(searchQuery) || roleFilter !== 'ALL' || statusFilter !== 'ALL' || sortBy !== 'name-asc';

  const columns = [
    {
      key: 'name',
      header: 'User Name & Email',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{row.name}</span>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Mail size={11} /> {row.email}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (row) => (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: row.role === 'ADMIN' ? '#fdf2f8' : row.role.includes('MANAGER') ? '#eff6ff' : '#f1f5f9',
            color: row.role === 'ADMIN' ? '#be185d' : row.role.includes('MANAGER') ? '#1d4ed8' : '#475569',
            border: `1px solid ${row.role === 'ADMIN' ? '#fbcfe8' : row.role.includes('MANAGER') ? '#bfdbfe' : '#e2e8f0'}`,
          }}
        >
          {row.role.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department / Unit',
      render: (row) => <span style={{ color: '#475569', fontSize: '12.5px' }}>{row.department}</span>,
    },
    {
      key: 'lastLogin',
      header: 'Last Session',
      render: (row) => <span style={{ fontSize: '12px', color: '#64748b' }}>{row.lastLogin}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '110px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          <button
            type="button"
            className="table-action-icon-btn"
            title="Edit User"
            onClick={() => navigate(`/admin/users/${row.id}/edit`)}
          >
            <Edit size={14} />
          </button>
          <button
            type="button"
            className={`table-action-icon-btn ${row.status === 'ACTIVE' ? 'toggle-active' : 'toggle-inactive'}`}
            title={row.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
            onClick={() => toggleUserStatus(row.id)}
          >
            <Power size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="product-module-page">
      {/* Header Bar */}
      <div className="module-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="module-title">User Management</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              {users.length} Users
            </span>
          </div>
          <p className="module-description">
            Administer system user credentials, organizational assignments, and role-based permissions.
          </p>
        </div>

        <div className="module-actions-group">
          <Link to="/admin" className="btn-sm btn-secondary">
            <span>Admin Console</span>
          </Link>
          <Link to="/admin/users/new" className="btn-sm btn-primary">
            <Plus size={15} />
            <span>Add User</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar card">
        <div className="filter-row">
          <div className="filter-search-box">
            <Search size={16} className="filter-search-icon" />
            <input
              type="text"
              className="filter-search-input"
              placeholder="Search by name, corporate email, or department..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="filter-clear-btn-inline"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filter-dropdowns-group">
            <div className="filter-select-wrapper">
              <label htmlFor="usr-role-select" className="filter-label">
                Role:
              </label>
              <select
                id="usr-role-select"
                className="filter-select"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Administrator</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
                <option value="PROCUREMENT_MANAGER">Procurement Manager</option>
                <option value="SALES_MANAGER">Sales Manager</option>
                <option value="STAFF">Operations Staff</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="usr-status-select" className="filter-label">
                Status:
              </label>
              <select
                id="usr-status-select"
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="usr-sort-select" className="filter-label">
                <ArrowUpDown size={12} style={{ display: 'inline', marginRight: 4 }} />
                Sort:
              </label>
              <select
                id="usr-sort-select"
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name-asc">Name (A - Z)</option>
                <option value="name-desc">Name (Z - A)</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn-sm btn-secondary filter-reset-btn"
                onClick={handleClearFilters}
              >
                <X size={14} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        <div className="filter-status-bar">
          <span>
            Showing <strong>{sortedUsers.length}</strong> of <strong>{users.length}</strong> accounts
          </span>
          {hasActiveFilters && (
            <span className="filter-active-pill">
              <Filter size={11} /> Filters Active
            </span>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={paginatedUsers}
          keyExtractor={(u) => u.id}
          emptyTitle="No users found"
          emptyMessage="No user accounts match your search filters."
        />

        <Pagination
          currentPage={currentPage}
          totalItems={sortedUsers.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  X,
  Filter,
  ArrowUpDown,
  MapPin,
  Eye,
  Edit,
  Power,
  Mail,
} from 'lucide-react';
import { useSuppliers } from '../../hooks/useSuppliers';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';

const ITEMS_PER_PAGE = 10;

export default function SupplierListPage() {
  const navigate = useNavigate();
  const { suppliers, toggleSupplierStatus } = useSuppliers();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique categories and states for dropdowns
  const categories = useMemo(() => {
    return Array.from(new Set(suppliers.map((s) => s.category).filter(Boolean)));
  }, [suppliers]);

  const states = useMemo(() => {
    return Array.from(new Set(suppliers.map((s) => s.state).filter(Boolean)));
  }, [suppliers]);

  // Client-side filtering
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = sup.name?.toLowerCase().includes(q);
        const matchesCode = sup.supplierCode?.toLowerCase().includes(q);
        const matchesCompany = sup.companyName?.toLowerCase().includes(q);
        const matchesContact = sup.contactPerson?.toLowerCase().includes(q);
        const matchesCity = sup.city?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesCompany && !matchesContact && !matchesCity) {
          return false;
        }
      }

      if (statusFilter !== 'ALL' && sup.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== 'ALL' && sup.category !== categoryFilter) {
        return false;
      }

      if (stateFilter !== 'ALL' && sup.state !== stateFilter) {
        return false;
      }

      return true;
    });
  }, [suppliers, searchQuery, statusFilter, categoryFilter, stateFilter]);

  // Client-side sorting
  const sortedSuppliers = useMemo(() => {
    const list = [...filteredSuppliers];
    switch (sortBy) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'products-high':
        return list.sort((a, b) => b.productsSupplied - a.productsSupplied);
      case 'recent':
      default:
        return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
  }, [filteredSuppliers, sortBy]);

  // Pagination slice
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedSuppliers.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedSuppliers, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setStateFilter('ALL');
    setSortBy('name-asc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    stateFilter !== 'ALL' ||
    sortBy !== 'name-asc';

  const columns = [
    {
      key: 'name',
      header: 'Supplier & Company',
      render: (row) => (
        <div>
          <Link
            to={`/suppliers/${row.id}`}
            className="product-table-name-link"
            title="View supplier profile"
          >
            {row.name}
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: 2 }}>
            {row.companyName}
          </span>
        </div>
      ),
    },
    {
      key: 'supplierCode',
      header: 'Supplier Code',
      width: '140px',
      render: (row) => <span className="sku-code">{row.supplierCode}</span>,
    },
    {
      key: 'contactPerson',
      header: 'Key Contact',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '12.5px' }}>
            {row.contactPerson}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 2, fontSize: '11px', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Mail size={11} /> {row.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      width: '130px',
      render: (row) => <span style={{ color: '#475569', fontWeight: 500 }}>{row.category}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#334155' }}>
          <MapPin size={13} color="#64748b" />
          <span>{row.city}, {row.state}</span>
        </div>
      ),
    },
    {
      key: 'productsSupplied',
      header: 'SKUs Supplied',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 600, color: '#0f172a' }}>
          {row.productsSupplied} SKUs
        </span>
      ),
    },
    {
      key: 'paymentTerms',
      header: 'Terms',
      width: '100px',
      render: (row) => (
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
          {row.paymentTerms}
        </span>
      ),
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
      width: '120px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          <button
            type="button"
            className="table-action-icon-btn"
            title="View Details"
            onClick={() => navigate(`/suppliers/${row.id}`)}
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            className="table-action-icon-btn"
            title="Edit Supplier"
            onClick={() => navigate(`/suppliers/${row.id}/edit`)}
          >
            <Edit size={14} />
          </button>
          <button
            type="button"
            className={`table-action-icon-btn ${row.status === 'ACTIVE' ? 'toggle-active' : 'toggle-inactive'}`}
            title={row.status === 'ACTIVE' ? 'Deactivate Supplier' : 'Activate Supplier'}
            onClick={() => toggleSupplierStatus(row.id)}
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
            <h2 className="module-title">Suppliers</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              {suppliers.length} Vendors
            </span>
          </div>
          <p className="module-description">
            Manage supplier relationships, procurement contracts, contacts and active vendor sources.
          </p>
        </div>

        <div className="module-actions-group">
          <Link to="/suppliers/new" className="btn-sm btn-primary">
            <Plus size={15} />
            <span>Add Supplier</span>
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
              placeholder="Search by supplier, code, company, contact or city..."
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
              <label htmlFor="sup-status-select" className="filter-label">
                Status:
              </label>
              <select
                id="sup-status-select"
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="sup-cat-select" className="filter-label">
                Category:
              </label>
              <select
                id="sup-cat-select"
                className="filter-select"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="sup-state-select" className="filter-label">
                State:
              </label>
              <select
                id="sup-state-select"
                className="filter-select"
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All States</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="sup-sort-select" className="filter-label">
                <ArrowUpDown size={12} style={{ display: 'inline', marginRight: 4 }} />
                Sort:
              </label>
              <select
                id="sup-sort-select"
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name-asc">Supplier Name (A - Z)</option>
                <option value="name-desc">Supplier Name (Z - A)</option>
                <option value="products-high">SKUs Supplied (High - Low)</option>
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
            Showing <strong>{sortedSuppliers.length}</strong> of <strong>{suppliers.length}</strong> suppliers
          </span>
          {hasActiveFilters && (
            <span className="filter-active-pill">
              <Filter size={11} /> Filters Active
            </span>
          )}
        </div>
      </div>

      {/* Supplier Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={paginatedSuppliers}
          keyExtractor={(s) => s.id}
          emptyTitle="No suppliers found"
          emptyMessage="No vendor records match your active search terms and filter criteria."
        />

        <Pagination
          currentPage={currentPage}
          totalItems={sortedSuppliers.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}

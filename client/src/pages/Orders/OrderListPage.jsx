import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  X,
  Filter,
  ArrowUpDown,
  ShoppingCart,
  Warehouse,
  Eye,
  Kanban,
  Clock,
  CheckCircle2,
  Truck,
  Package,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { useWarehouses } from '../../hooks/useWarehouses';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';

const ITEMS_PER_PAGE = 10;

export default function OrderListPage() {
  const navigate = useNavigate();
  const { orders } = useOrders();
  const { warehouses } = useWarehouses();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Summary counts
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
  const processingCount = orders.filter((o) => o.status === 'PROCESSING' || o.status === 'PICKING' || o.status === 'PACKED').length;
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  // Client-side filtering
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = ord.orderNumber?.toLowerCase().includes(q);
        const matchesCustomer = ord.customerName?.toLowerCase().includes(q);
        const matchesEmail = ord.customerEmail?.toLowerCase().includes(q);
        if (!matchesNumber && !matchesCustomer && !matchesEmail) {
          return false;
        }
      }

      if (statusFilter !== 'ALL' && ord.status !== statusFilter) {
        return false;
      }

      if (paymentFilter !== 'ALL' && ord.paymentStatus !== paymentFilter) {
        return false;
      }

      if (warehouseFilter !== 'ALL' && String(ord.warehouseId) !== String(warehouseFilter) && ord.warehouseName !== warehouseFilter) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, warehouseFilter]);

  // Client-side sorting
  const sortedOrders = useMemo(() => {
    const list = [...filteredOrders];
    switch (sortBy) {
      case 'amount-high':
        return list.sort((a, b) => b.totalAmount - a.totalAmount);
      case 'amount-low':
        return list.sort((a, b) => a.totalAmount - b.totalAmount);
      case 'oldest':
        return list.sort((a, b) => (a.orderDate || '').localeCompare(b.orderDate || ''));
      case 'newest':
      default:
        return list.sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''));
    }
  }, [filteredOrders, sortBy]);

  // Pagination slice
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedOrders, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    setWarehouseFilter('ALL');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== 'ALL' ||
    paymentFilter !== 'ALL' ||
    warehouseFilter !== 'ALL' ||
    sortBy !== 'newest';

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order Reference',
      render: (row) => (
        <div>
          <Link
            to={`/orders/${row.id}`}
            className="product-table-name-link"
            title="View order details and fulfillment progression"
          >
            {row.orderNumber}
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
            {row.orderDate}
          </span>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '12.5px' }}>
            {row.customerName}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
            {row.customerEmail}
          </span>
        </div>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Fulfillment Hub',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#334155' }}>
          <Warehouse size={13} color="#64748b" />
          <span>{row.warehouseName}</span>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      align: 'right',
      width: '85px',
      render: (row) => (
        <span className="table-num" style={{ color: '#475569' }}>
          {(row.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0)} pcs
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total Value',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          ₹{row.totalAmount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      width: '110px',
      render: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      key: 'status',
      header: 'Order Status',
      width: '140px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '90px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          <button
            type="button"
            className="table-action-icon-btn"
            title="View Order"
            onClick={() => navigate(`/orders/${row.id}`)}
          >
            <Eye size={15} />
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
            <h2 className="module-title">Orders</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              {orders.length} Orders
            </span>
          </div>
          <p className="module-description">
            Manage customer sales orders, reservations, pick-pack stages, and regional fulfillment.
          </p>
        </div>

        <div className="module-actions-group">
          <Link to="/orders/fulfillment" className="btn-sm btn-secondary">
            <Kanban size={15} />
            <span>Fulfillment Board</span>
          </Link>
          <Link to="/orders/new" className="btn-sm btn-primary">
            <Plus size={15} />
            <span>Create Order</span>
          </Link>
        </div>
      </div>

      {/* 5 KPI Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Total Orders</span>
            <div className="stat-card-icon-wrap" style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="stat-card-value">{totalCount}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Cumulative customer sales</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Pending / Confirmed</span>
            <div className="stat-card-icon-wrap" style={{ color: '#d97706', backgroundColor: '#fffbeb' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#b45309' }}>{pendingCount}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Awaiting picking release</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">In Processing / Packing</span>
            <div className="stat-card-icon-wrap" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
              <Package size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#2563eb' }}>{processingCount}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Active floor fulfillment</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">In-Transit / Shipped</span>
            <div className="stat-card-icon-wrap" style={{ color: '#7c3aed', backgroundColor: '#f5f3ff' }}>
              <Truck size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#7c3aed' }}>{shippedCount}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Dispatched with logistics</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Delivered Successfully</span>
            <div className="stat-card-icon-wrap" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#047857' }}>{deliveredCount}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Customer handoff complete</span>
          </div>
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
              placeholder="Search by order #, customer name or email..."
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
              <label htmlFor="ord-status-select" className="filter-label">
                Order Status:
              </label>
              <select
                id="ord-status-select"
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="PICKING">Picking</option>
                <option value="PACKED">Packed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="ord-pay-select" className="filter-label">
                Payment:
              </label>
              <select
                id="ord-pay-select"
                className="filter-select"
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="ord-wh-select" className="filter-label">
                Hub:
              </label>
              <select
                id="ord-wh-select"
                className="filter-select"
                value={warehouseFilter}
                onChange={(e) => {
                  setWarehouseFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Hubs</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.name}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="ord-sort-select" className="filter-label">
                <ArrowUpDown size={12} style={{ display: 'inline', marginRight: 4 }} />
                Sort:
              </label>
              <select
                id="ord-sort-select"
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Latest Orders</option>
                <option value="oldest">Earliest Orders</option>
                <option value="amount-high">Amount (High to Low)</option>
                <option value="amount-low">Amount (Low to High)</option>
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
            Showing <strong>{sortedOrders.length}</strong> of <strong>{orders.length}</strong> customer orders
          </span>
          {hasActiveFilters && (
            <span className="filter-active-pill">
              <Filter size={11} /> Filters Active
            </span>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={paginatedOrders}
          keyExtractor={(ord) => ord.id}
          emptyTitle="No customer orders found"
          emptyMessage="No sales orders match your filter criteria."
        />

        <Pagination
          currentPage={currentPage}
          totalItems={sortedOrders.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}

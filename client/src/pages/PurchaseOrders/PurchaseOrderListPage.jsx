import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  X,
  Filter,
  ArrowUpDown,
  Warehouse,
  Eye,
  CheckCircle,
  Ban,
  PackageCheck,
} from 'lucide-react';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useWarehouses } from '../../hooks/useWarehouses';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import ReceiveGoodsModal from '../../components/purchaseOrders/ReceiveGoodsModal';

const ITEMS_PER_PAGE = 10;

export default function PurchaseOrderListPage() {
  const navigate = useNavigate();
  const { purchaseOrders, approvePurchaseOrder, cancelPurchaseOrder, receivePurchaseOrder } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { warehouses } = useWarehouses();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [receivingModalOpen, setReceivingModalOpen] = useState(false);
  const [targetPOForReceipt, setTargetPOForReceipt] = useState(null);

  const handleOpenReceive = (po) => {
    setTargetPOForReceipt(po);
    setReceivingModalOpen(true);
  };

  const handleConfirmReceipt = (quantitiesMap, notes, performedBy) => {
    if (targetPOForReceipt) {
      receivePurchaseOrder(targetPOForReceipt.id, quantitiesMap, notes, performedBy);
    }
  };

  // Client-side filtering
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = po.poNumber?.toLowerCase().includes(q);
        const matchesSupplier = po.supplierName?.toLowerCase().includes(q);
        const matchesWarehouse = po.warehouseName?.toLowerCase().includes(q);
        if (!matchesNumber && !matchesSupplier && !matchesWarehouse) {
          return false;
        }
      }

      if (statusFilter !== 'ALL' && po.status !== statusFilter) {
        return false;
      }

      if (supplierFilter !== 'ALL' && String(po.supplierId) !== String(supplierFilter) && po.supplierName !== supplierFilter) {
        return false;
      }

      if (warehouseFilter !== 'ALL' && String(po.warehouseId) !== String(warehouseFilter) && po.warehouseName !== warehouseFilter) {
        return false;
      }

      return true;
    });
  }, [purchaseOrders, searchQuery, statusFilter, supplierFilter, warehouseFilter]);

  // Client-side sorting
  const sortedPOs = useMemo(() => {
    const list = [...filteredPOs];
    switch (sortBy) {
      case 'amount-high':
        return list.sort((a, b) => b.total - a.total);
      case 'amount-low':
        return list.sort((a, b) => a.total - b.total);
      case 'oldest':
        return list.sort((a, b) => (a.orderDate || '').localeCompare(b.orderDate || ''));
      case 'newest':
      default:
        return list.sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''));
    }
  }, [filteredPOs, sortBy]);

  // Pagination slice
  const paginatedPOs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPOs.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedPOs, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSupplierFilter('ALL');
    setWarehouseFilter('ALL');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== 'ALL' ||
    supplierFilter !== 'ALL' ||
    warehouseFilter !== 'ALL' ||
    sortBy !== 'newest';

  const columns = [
    {
      key: 'poNumber',
      header: 'PO Reference',
      render: (row) => (
        <div>
          <Link
            to={`/purchase-orders/${row.id}`}
            className="product-table-name-link"
            title="View purchase order breakdown"
          >
            {row.poNumber}
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
            By: {row.createdBy}
          </span>
        </div>
      ),
    },
    {
      key: 'supplierName',
      header: 'Supplier',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '12.5px' }}>
          {row.supplierName}
        </span>
      ),
    },
    {
      key: 'warehouseName',
      header: 'Destination Hub',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#334155' }}>
          <Warehouse size={13} color="#64748b" />
          <span>{row.warehouseName}</span>
        </div>
      ),
    },
    {
      key: 'orderDate',
      header: 'Order Date',
      render: (row) => <span style={{ fontSize: '12px', color: '#475569' }}>{row.orderDate}</span>,
    },
    {
      key: 'expectedDate',
      header: 'Expected By',
      render: (row) => <span style={{ fontSize: '12px', color: '#64748b' }}>{row.expectedDate}</span>,
    },
    {
      key: 'items',
      header: 'Item Lines',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span className="table-num" style={{ color: '#475569' }}>
          {(row.items || []).length} items
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Gross Total',
      align: 'right',
      width: '130px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          ₹{row.total.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '140px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          <button
            type="button"
            className="table-action-icon-btn"
            title="View PO Details"
            onClick={() => navigate(`/purchase-orders/${row.id}`)}
          >
            <Eye size={15} />
          </button>

          {row.status === 'PENDING' && (
            <button
              type="button"
              className="table-action-icon-btn"
              title="Approve Purchase Order"
              style={{ color: '#059669' }}
              onClick={() => approvePurchaseOrder(row.id)}
            >
              <CheckCircle size={15} />
            </button>
          )}

          {(row.status === 'APPROVED' || row.status === 'PARTIALLY_RECEIVED') && (
            <button
              type="button"
              className="table-action-icon-btn"
              title="Receive Inbound Goods"
              style={{ color: '#2563eb' }}
              onClick={() => handleOpenReceive(row)}
            >
              <PackageCheck size={15} />
            </button>
          )}

          {(row.status === 'DRAFT' || row.status === 'PENDING') && (
            <button
              type="button"
              className="table-action-icon-btn toggle-active"
              title="Cancel PO"
              onClick={() => cancelPurchaseOrder(row.id)}
            >
              <Ban size={14} />
            </button>
          )}
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
            <h2 className="module-title">Purchase Orders</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              {purchaseOrders.length} Orders
            </span>
          </div>
          <p className="module-description">
            Create, track and manage vendor replenishment orders and warehouse receipts.
          </p>
        </div>

        <div className="module-actions-group">
          <Link to="/purchase-orders/new" className="btn-sm btn-primary">
            <Plus size={15} />
            <span>Create Purchase Order</span>
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
              placeholder="Search by PO number, supplier, or warehouse destination..."
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
              <label htmlFor="po-status-select" className="filter-label">
                Status:
              </label>
              <select
                id="po-status-select"
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="po-supplier-select" className="filter-label">
                Supplier:
              </label>
              <select
                id="po-supplier-select"
                className="filter-select"
                value={supplierFilter}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <label htmlFor="po-wh-select" className="filter-label">
                Warehouse:
              </label>
              <select
                id="po-wh-select"
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
              <label htmlFor="po-sort-select" className="filter-label">
                <ArrowUpDown size={12} style={{ display: 'inline', marginRight: 4 }} />
                Sort:
              </label>
              <select
                id="po-sort-select"
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
            Showing <strong>{sortedPOs.length}</strong> of <strong>{purchaseOrders.length}</strong> purchase orders
          </span>
          {hasActiveFilters && (
            <span className="filter-active-pill">
              <Filter size={11} /> Filters Active
            </span>
          )}
        </div>
      </div>

      {/* PO Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={paginatedPOs}
          keyExtractor={(po) => po.id}
          emptyTitle="No purchase orders found"
          emptyMessage="No procurement orders match your filter criteria."
        />

        <Pagination
          currentPage={currentPage}
          totalItems={sortedPOs.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Receive Goods Modal */}
      <ReceiveGoodsModal
        isOpen={receivingModalOpen}
        purchaseOrder={targetPOForReceipt}
        onClose={() => setReceivingModalOpen(false)}
        onConfirmReceipt={handleConfirmReceipt}
      />
    </div>
  );
}

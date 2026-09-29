import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  History,
  Eye,
  Edit,
  Warehouse,
} from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useProducts } from '../../hooks/useProducts';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import InventorySummaryCards from '../../components/inventory/InventorySummaryCards';
import InventoryFilters from '../../components/inventory/InventoryFilters';
import StockAdjustmentModal from '../../components/inventory/StockAdjustmentModal';

const ITEMS_PER_PAGE = 10;

/**
 * Inventory List Page (/inventory).
 * Central hub for tracking stock across products and warehouse locations.
 */
export default function InventoryListPage() {
  const navigate = useNavigate();
  const { inventory } = useInventory();
  const { warehouses } = useWarehouses();
  const { categories } = useProducts();

  // Modal state
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedItemForAdjustment, setSelectedItemForAdjustment] = useState(null);

  // Filters and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('product-asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Open adjustment modal for a specific row
  const handleOpenAdjustment = (item = null) => {
    setSelectedItemForAdjustment(item);
    setAdjustmentModalOpen(true);
  };

  // Client-side filtering logic
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // 1. Full-text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesProduct = item.productName?.toLowerCase().includes(q);
        const matchesSku = item.sku?.toLowerCase().includes(q);
        const matchesWarehouse = item.warehouseName?.toLowerCase().includes(q);
        const matchesCode = item.warehouseCode?.toLowerCase().includes(q);
        if (!matchesProduct && !matchesSku && !matchesWarehouse && !matchesCode) {
          return false;
        }
      }

      // 2. Stock status
      if (statusFilter !== 'ALL' && item.stockStatus !== statusFilter) {
        return false;
      }

      // 3. Warehouse filter
      if (warehouseFilter !== 'ALL' && item.warehouseName !== warehouseFilter) {
        return false;
      }

      // 4. Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // 5. Availability filter
      if (availabilityFilter === 'HAS_STOCK' && item.currentStock <= 0) {
        return false;
      }
      if (availabilityFilter === 'NO_STOCK' && item.currentStock > 0) {
        return false;
      }

      return true;
    });
  }, [inventory, searchQuery, statusFilter, warehouseFilter, categoryFilter, availabilityFilter]);

  // Client-side sorting logic
  const sortedInventory = useMemo(() => {
    const list = [...filteredInventory];
    switch (sortBy) {
      case 'product-asc':
        return list.sort((a, b) => a.productName.localeCompare(b.productName));
      case 'product-desc':
        return list.sort((a, b) => b.productName.localeCompare(a.productName));
      case 'stock-high':
        return list.sort((a, b) => b.currentStock - a.currentStock);
      case 'stock-low':
        return list.sort((a, b) => a.currentStock - b.currentStock);
      case 'avail-high':
        return list.sort((a, b) => b.availableStock - a.availableStock);
      case 'avail-low':
        return list.sort((a, b) => a.availableStock - b.availableStock);
      case 'warehouse-asc':
        return list.sort((a, b) => a.warehouseName.localeCompare(b.warehouseName));
      case 'recent':
      default:
        return list.sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''));
    }
  }, [filteredInventory, sortBy]);

  // Pagination slice
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedInventory.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedInventory, currentPage]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setWarehouseFilter('ALL');
    setCategoryFilter('ALL');
    setAvailabilityFilter('ALL');
    setSortBy('product-asc');
    setCurrentPage(1);
  };

  // Table columns
  const columns = [
    {
      key: 'productName',
      header: 'Product',
      render: (row) => (
        <div>
          <Link
            to={`/inventory/${row.id}`}
            className="product-table-name-link"
            title="View inventory allocation details"
          >
            {row.productName}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 2 }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{row.category}</span>
            <span style={{ color: '#cbd5e1' }}>&bull;</span>
            <Link
              to={`/inventory/product/${row.productId}`}
              style={{ fontSize: '11px', color: '#2563eb', fontWeight: 500 }}
              title="View all warehouses stocking this product"
            >
              All Hubs
            </Link>
          </div>
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      width: '130px',
      render: (row) => <span className="sku-code">{row.sku}</span>,
    },
    {
      key: 'warehouseName',
      header: 'Warehouse',
      render: (row) => (
        <div>
          <Link
            to={`/inventory/warehouse/${row.warehouseId}`}
            style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}
            title="View complete inventory for this warehouse"
          >
            <Warehouse size={13} color="#64748b" />
            <span>{row.warehouseName}</span>
          </Link>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
            {row.warehouseCode}
          </span>
        </div>
      ),
    },
    {
      key: 'currentStock',
      header: 'Current',
      align: 'right',
      width: '95px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          {row.currentStock}
        </span>
      ),
    },
    {
      key: 'reservedStock',
      header: 'Reserved',
      align: 'right',
      width: '95px',
      render: (row) => (
        <span
          className="table-num"
          style={{
            fontWeight: 600,
            color: row.reservedStock > 0 ? '#6d28d9' : '#94a3b8',
            backgroundColor: row.reservedStock > 0 ? '#f5f3ff' : 'transparent',
            padding: row.reservedStock > 0 ? '2px 6px' : '0',
            borderRadius: '4px',
          }}
        >
          {row.reservedStock}
        </span>
      ),
    },
    {
      key: 'availableStock',
      header: 'Available',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span
          className="table-num"
          style={{
            fontWeight: 700,
            color: row.availableStock === 0 ? '#dc2626' : '#047857',
            backgroundColor: row.availableStock === 0 ? '#fef2f2' : '#ecfdf5',
            padding: '2px 8px',
            borderRadius: '4px',
            border: `1px solid ${row.availableStock === 0 ? '#fecaca' : '#a7f3d0'}`,
          }}
        >
          {row.availableStock}
        </span>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder At',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span className="table-num" style={{ color: '#64748b' }}>
          {row.reorderLevel}
        </span>
      ),
    },
    {
      key: 'stockStatus',
      header: 'Stock Status',
      width: '130px',
      render: (row) => <StatusBadge status={row.stockStatus} />,
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      align: 'right',
      width: '110px',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#64748b' }}>{row.lastUpdated}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '130px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            className="table-action-icon-btn"
            title="View Inventory Details"
            onClick={() => navigate(`/inventory/${row.id}`)}
          >
            <Eye size={15} />
          </button>

          <button
            type="button"
            className="table-action-icon-btn"
            title="Adjust Stock"
            onClick={() => handleOpenAdjustment(row)}
          >
            <Edit size={14} />
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
            <h2 className="module-title">Inventory</h2>
            <span className="nav-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              {inventory.length} Stock Records
            </span>
          </div>
          <p className="module-description">
            Monitor stock levels across products and warehouse locations.
          </p>
        </div>

        <div className="module-actions-group">
          <Link to="/inventory/movements" className="btn-sm btn-secondary">
            <History size={15} />
            <span>View Movements</span>
          </Link>

          <button
            type="button"
            className="btn-sm btn-primary"
            onClick={() => handleOpenAdjustment(null)}
          >
            <ArrowRightLeft size={15} />
            <span>Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <InventorySummaryCards />

      {/* Filters Toolbar */}
      <InventoryFilters
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(s) => {
          setStatusFilter(s);
          setCurrentPage(1);
        }}
        warehouseFilter={warehouseFilter}
        onWarehouseChange={(w) => {
          setWarehouseFilter(w);
          setCurrentPage(1);
        }}
        categoryFilter={categoryFilter}
        onCategoryChange={(c) => {
          setCategoryFilter(c);
          setCurrentPage(1);
        }}
        availabilityFilter={availabilityFilter}
        onAvailabilityChange={(a) => {
          setAvailabilityFilter(a);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortChange={(s) => setSortBy(s)}
        onClearFilters={handleClearFilters}
        warehouses={warehouses}
        categories={categories}
        totalFilteredCount={sortedInventory.length}
        totalCount={inventory.length}
      />

      {/* Inventory Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={paginatedInventory}
          keyExtractor={(item) => item.id}
          emptyTitle="No inventory items found"
          emptyMessage="No stock records match your active search terms and filters."
        />

        {/* Client-side Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={sortedInventory.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={adjustmentModalOpen}
        item={selectedItemForAdjustment}
        inventoryList={inventory}
        onClose={() => setAdjustmentModalOpen(false)}
      />
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Warehouse,
  Boxes,
  Bookmark,
  CheckCircle2,
  Eye,
  Edit,
  Building2,
} from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import productService from '../../services/productService';
import inventoryService from '../../services/inventoryService';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import StockAdjustmentModal from '../../components/inventory/StockAdjustmentModal';

/**
 * Product Inventory Page (/inventory/product/:productId).
 * Demonstrates the 1-to-many relationship: One Product -> Multiple Warehouses.
 * Connected to live backend API GET /api/inventory/product/:productId.
 */
export default function ProductInventoryPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { inventory } = useInventory();

  const [product, setProduct] = useState(null);
  const [productStockAllocations, setProductStockAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const loadProductData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const [prodData, itemsData] = await Promise.all([
        productService.getProductById(productId),
        inventoryService.getInventoryByProduct(productId, { limit: 100 }),
      ]);

      if (!prodData) {
        setError(`No catalog item matching ID "${productId}" exists in active records.`);
        setProduct(null);
      } else {
        setProduct(prodData);
        setProductStockAllocations(itemsData.data || []);
      }
    } catch (err) {
      setError(err.message || `No catalog item matching ID "${productId}" exists.`);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  if (loading) {
    return (
      <div className="product-module-page">
        <LoadingState message="Loading multi-hub product inventory..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Product Not Found"
          message={error || `No catalog item matching ID "${productId}" exists in active records.`}
          action={
            <Link to="/products" className="btn-sm btn-primary">
              <ArrowLeft size={15} />
              <span>Back to Products</span>
            </Link>
          }
        />
      </div>
    );
  }

  // Summary calculations for this product across all hubs
  const totalStock = productStockAllocations.reduce((acc, i) => acc + (i.currentStock || 0), 0);
  const totalReserved = productStockAllocations.reduce((acc, i) => acc + (i.reservedStock || 0), 0);
  const totalAvailable = productStockAllocations.reduce((acc, i) => acc + (i.availableStock || 0), 0);
  const warehousesStockedCount = productStockAllocations.filter((i) => i.currentStock > 0).length;

  const handleOpenAdjustment = (item) => {
    setSelectedItem(item);
    setAdjustmentModalOpen(true);
  };

  const columns = [
    {
      key: 'warehouseName',
      header: 'Warehouse Location',
      render: (row) => (
        <div>
          <Link
            to={`/inventory/warehouse/${row.warehouseId}`}
            style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}
            title="View complete inventory for this facility"
          >
            <Warehouse size={14} color="#64748b" />
            <span>{row.warehouseName}</span>
          </Link>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
            Code: {row.warehouseCode}
          </span>
        </div>
      ),
    },
    {
      key: 'currentStock',
      header: 'On-Hand Stock',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          {row.currentStock} units
        </span>
      ),
    },
    {
      key: 'reservedStock',
      header: 'Reserved',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span
          className="table-num"
          style={{
            fontWeight: 600,
            color: row.reservedStock > 0 ? '#6d28d9' : '#94a3b8',
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
      width: '110px',
      render: (row) => (
        <span
          className="table-num"
          style={{
            fontWeight: 700,
            color: row.availableStock === 0 ? '#dc2626' : '#047857',
            backgroundColor: row.availableStock === 0 ? '#fef2f2' : '#ecfdf5',
            padding: '2px 8px',
            borderRadius: '4px',
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
      header: 'Status',
      width: '130px',
      render: (row) => <StatusBadge status={row.stockStatus} />,
    },
    {
      key: 'lastUpdated',
      header: 'Last Audit',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#64748b' }}>{row.lastUpdated}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '120px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="button"
            className="table-action-icon-btn"
            title="View Details"
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
      {/* Top Header */}
      <div className="form-header-bar">
        <div>
          <Link to="/products" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 4, flexWrap: 'wrap' }}>
            <h2 className="form-page-title">{product.name} — Multi-Hub Distribution</h2>
            <StatusBadge status={product.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 6, color: '#64748b', fontSize: '12.5px' }}>
            <span className="sku-code">{product.sku}</span>
            <span>&bull;</span>
            <span>{typeof product.category === 'string' ? product.category : product.category?.name}</span>
            <span>&bull;</span>
            <span>Brand: <strong>{product.brand || 'Generic'}</strong></span>
          </div>
        </div>

        <div className="form-top-actions">
          <Link to={`/products/${product.id}`} className="btn-sm btn-secondary">
            <Package size={15} />
            <span>Product Master</span>
          </Link>
          <Link to="/inventory" className="btn-sm btn-primary">
            <span>Global Inventory</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Total Network Stock</span>
            <div className="stat-card-icon-wrap" style={{ color: '#047857', backgroundColor: '#ecfdf5' }}>
              <Boxes size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#047857' }}>
            {totalStock} units
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Summed across all active storage hubs</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Reserved Units</span>
            <div className="stat-card-icon-wrap" style={{ color: '#6d28d9', backgroundColor: '#f5f3ff' }}>
              <Bookmark size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#6d28d9' }}>
            {totalReserved} units
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Awaiting picking & customer dispatch</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Available for Sale</span>
            <div
              className="stat-card-icon-wrap"
              style={{
                color: totalAvailable > 0 ? '#047857' : '#dc2626',
                backgroundColor: totalAvailable > 0 ? '#ecfdf5' : '#fef2f2',
              }}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div
            className="stat-card-value"
            style={{ color: totalAvailable > 0 ? '#047857' : '#dc2626' }}
          >
            {totalAvailable} units
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Ready for new customer orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Fulfillment Coverage</span>
            <div className="stat-card-icon-wrap" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
              <Building2 size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {warehousesStockedCount} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>Hubs</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Active stocking regional nodes</span>
          </div>
        </div>
      </div>

      {/* Product Stock Allocations Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={productStockAllocations}
          keyExtractor={(item) => item.id}
          emptyTitle="Product not stocked in any warehouse"
          emptyMessage="No regional inventory records exist for this SKU."
        />
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={adjustmentModalOpen}
        item={selectedItem}
        inventoryList={inventory}
        onClose={() => {
          setAdjustmentModalOpen(false);
          loadProductData();
        }}
      />
    </div>
  );
}

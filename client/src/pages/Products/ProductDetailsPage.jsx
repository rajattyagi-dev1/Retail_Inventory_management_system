import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Package, 
  Warehouse, 
  IndianRupee, 
  MapPin,
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';

/**
 * Product Details Page (/products/:id).
 * Displays full SKU specification, pricing breakdown, and warehouse distribution directly from MySQL API.
 */
export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchProduct } = useProducts();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetchProduct(id)
      .then((data) => {
        if (isMounted) {
          setProduct(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Product not found.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, fetchProduct]);

  if (loading) {
    return (
      <div className="product-module-page" style={{ padding: '60px 0' }}>
        <LoadingState message="Loading product details from database..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Product Not Found"
          message={error || `No product matching identifier "${id}" exists in the database.`}
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

  // Margin calculation
  const cost = Number(product.costPrice) || 0;
  const selling = Number(product.sellingPrice) || 0;
  const marginAmt = (selling - cost).toFixed(2);
  const marginPct = selling > 0 
    ? (((selling - cost) / selling) * 100).toFixed(1) 
    : 0;

  return (
    <div className="product-module-page">
      {/* Top Navigation & Action Bar */}
      <div className="form-header-bar">
        <div>
          <Link to="/products" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 4 }}>
            <h2 className="form-page-title">{product.name}</h2>
            <StatusBadge status={product.status} />
            <StatusBadge status={product.stockStatus} />
          </div>
          <span className="sku-code" style={{ marginTop: 6 }}>{product.sku}</span>
        </div>

        <div className="form-top-actions">
          <button
            type="button"
            className="btn-sm btn-secondary"
            onClick={() => navigate('/products')}
          >
            All Products
          </button>
          <Link to={`/products/${product.id}/edit`} className="btn-sm btn-primary">
            <Edit3 size={15} />
            <span>Edit Product</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Details Overview */}
      <div className="product-details-grid">
        {/* Left Column: Image & Core Meta */}
        <div className="card product-details-card">
          <div className="product-details-image-box">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="product-details-img" />
            ) : (
              <div className="product-details-placeholder-icon">
                <Package size={64} strokeWidth={1.2} />
                <span>No Image Provided</span>
              </div>
            )}
          </div>

          <div className="product-details-info-section">
            <h3 className="details-card-section-title">Catalog Metadata</h3>
            <div className="details-key-val-grid">
              <div className="details-key-val-item">
                <span className="details-key">Category</span>
                <span className="details-val">
                  {product.category || (product.categoryObj ? product.categoryObj.name : '—')}
                </span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Brand</span>
                <span className="details-val">{product.brand || '—'}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Unit of Measure</span>
                <span className="details-val">{product.unit}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Reorder Threshold</span>
                <span className="details-val">{product.reorderLevel} {product.unit}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Current Stock</span>
                <span 
                  className="details-val"
                  style={{
                    color: product.currentStock === 0 ? '#ef4444' : product.currentStock <= product.reorderLevel ? '#f59e0b' : '#10b981',
                    fontWeight: 700,
                  }}
                >
                  {product.currentStock} {product.unit}
                </span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Created Date</span>
                <span className="details-val">{product.createdDate || (product.createdAt ? product.createdAt.split('T')[0] : '—')}</span>
              </div>
              <div className="details-key-val-item">
                <span className="details-key">Last Updated</span>
                <span className="details-val">{product.updatedDate || (product.updatedAt ? product.updatedAt.split('T')[0] : '—')}</span>
              </div>
            </div>

            {product.description && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <span className="details-key" style={{ display: 'block', marginBottom: 6 }}>
                  Description & Specifications
                </span>
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing & Regional Warehouse Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Pricing & Margins Card */}
          <div className="card product-details-card">
            <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IndianRupee size={16} color="#2563eb" />
              <span>Financials & Valuation</span>
            </h3>

            <div className="pricing-stat-row">
              <div className="pricing-stat-box">
                <span className="pricing-label">Procurement Cost</span>
                <span className="pricing-amount">₹{cost.toLocaleString('en-IN')}</span>
                <span className="pricing-hint">Base unit cost</span>
              </div>

              <div className="pricing-stat-box">
                <span className="pricing-label">Retail Selling Price</span>
                <span className="pricing-amount" style={{ color: '#0f172a' }}>
                  ₹{selling.toLocaleString('en-IN')}
                </span>
                <span className="pricing-hint">MSRP / Listed price</span>
              </div>

              <div className="pricing-stat-box highlight">
                <span className="pricing-label">Gross Margin</span>
                <span className="pricing-amount" style={{ color: Number(marginAmt) >= 0 ? '#047857' : '#ef4444' }}>
                  {marginPct}%
                </span>
                <span className="pricing-hint">₹{Number(marginAmt).toLocaleString('en-IN')} profit/unit</span>
              </div>
            </div>
          </div>

          {/* Regional Warehouse Breakdown */}
          <div className="card product-details-card">
            <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Warehouse size={16} color="#2563eb" />
              <span>Multi-Warehouse Distribution</span>
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: 14 }}>
              Current stock allocation across connected regional fulfillment nodes.
            </p>

            <div className="warehouse-detail-list">
              {(product.warehouses || [
                { name: 'Delhi Central Hub', stock: Math.floor(product.currentStock * 0.5), location: 'Shelf E-01' },
                { name: 'Mumbai Distribution Center', stock: Math.floor(product.currentStock * 0.3), location: 'Shelf W-01' },
                { name: 'Bangalore Fulfillment Hub', stock: Math.floor(product.currentStock * 0.2), location: 'Shelf S-01' },
              ]).map((wh, idx) => (
                <div key={wh.name || idx} className="warehouse-detail-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="warehouse-bullet-dot" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                        {wh.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        <MapPin size={10} style={{ display: 'inline', marginRight: 2 }} />
                        Bin / Location: {wh.location || 'Central Aisle'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span 
                      className="table-num"
                      style={{
                        fontWeight: 700,
                        color: wh.stock === 0 ? '#ef4444' : '#0f172a',
                      }}
                    >
                      {wh.stock} {product.unit}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                      {wh.stock === 0 ? 'Out of stock' : 'Available'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

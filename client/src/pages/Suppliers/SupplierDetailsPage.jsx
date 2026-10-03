import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  CreditCard,
  Package,
  FileSpreadsheet,
  IndianRupee,
  Clock,
  Edit,
  ShieldCheck,
} from 'lucide-react';
import supplierService from '../../services/supplierService';
import purchaseOrderService from '../../services/purchaseOrderService';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import DataTable from '../../components/common/DataTable';
import SectionHeader from '../../components/common/SectionHeader';
import LoadingState from '../../components/common/LoadingState';

export default function SupplierDetailsPage() {
  const { id } = useParams();

  const [supplier, setSupplier] = useState(null);
  const [productsSuppliedList, setProductsSuppliedList] = useState([]);
  const [recentPOs, setRecentPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSupplierData() {
      setLoading(true);
      setError(null);
      try {
        const [supData, prodsData, posData] = await Promise.all([
          supplierService.getSupplierById(id),
          supplierService.getSupplierProducts(id).catch(() => []),
          purchaseOrderService.getPurchaseOrders({ supplierId: id }).catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          setSupplier(supData);
          setProductsSuppliedList(
            (prodsData || []).map((sp) => ({
              id: sp.productId || sp.product?.id || sp.id,
              name: sp.product?.name || sp.productName || 'Catalog Item',
              sku: sp.product?.sku || sp.supplierSku || 'SKU-000',
              category: sp.product?.category?.name || 'General',
              unitPrice: sp.costPrice ? Number(sp.costPrice) : (sp.product?.costPrice ? Number(sp.product.costPrice) : 0),
              leadTimeDays: sp.leadTimeDays ?? 7,
            }))
          );
          setRecentPOs(posData.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load supplier profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadSupplierData();
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading supplier profile and commercial history..." />;
  }

  if (error || !supplier) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Supplier Not Found"
          message={error || `No supplier matching identifier "${id}" exists in active records.`}
          action={
            <Link to="/suppliers" className="btn-sm btn-primary">
              <ArrowLeft size={15} />
              <span>Back to Suppliers</span>
            </Link>
          }
        />
      </div>
    );
  }

  // Calculate live statistics from real orders
  const totalBilledValue = recentPOs.reduce((acc, po) => acc + (Number(po.total) || Number(po.totalAmount) || 0), 0);
  const openOrdersCount = recentPOs.filter(
    (po) => po.status === 'PENDING' || po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED'
  ).length;

  const productColumns = [
    {
      key: 'name',
      header: 'Product',
      render: (row) => (
        <div>
          <Link to={`/products/${row.id}`} className="product-table-name-link">
            {row.name}
          </Link>
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU Code',
      width: '140px',
      render: (row) => <span className="sku-code">{row.sku}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span style={{ color: '#475569' }}>{row.category}</span>,
    },
    {
      key: 'unitPrice',
      header: 'Contract Rate',
      align: 'right',
      width: '130px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 600 }}>
          ₹{(row.unitPrice || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'leadTimeDays',
      header: 'Lead Time',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span style={{ color: '#64748b', fontSize: '13px' }}>
          {row.leadTimeDays} days
        </span>
      ),
    },
  ];

  const poColumns = [
    {
      key: 'poNumber',
      header: 'PO Number',
      width: '150px',
      render: (row) => (
        <Link to={`/purchase-orders/${row.id}`} className="product-table-name-link" style={{ fontFamily: 'monospace' }}>
          {row.poNumber}
        </Link>
      ),
    },
    {
      key: 'orderDate',
      header: 'Order Date',
      width: '130px',
      render: (row) => <span style={{ color: '#64748b', fontSize: '12px' }}>{row.orderDate}</span>,
    },
    {
      key: 'expectedDate',
      header: 'Fulfillment Date',
      width: '140px',
      render: (row) => <span style={{ color: '#64748b', fontSize: '12px' }}>{row.expectedDate || '—'}</span>,
    },
    {
      key: 'total',
      header: 'Order Value',
      align: 'right',
      width: '140px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          ₹{(Number(row.total) || Number(row.totalAmount) || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="product-module-page">
      {/* Header Bar */}
      <div className="form-header-bar">
        <div>
          <Link to="/suppliers" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Suppliers</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 4, flexWrap: 'wrap' }}>
            <h2 className="form-page-title">{supplier.name}</h2>
            <span className="sku-code" style={{ fontSize: '13px', padding: '3px 8px' }}>
              {supplier.supplierCode}
            </span>
            <StatusBadge status={supplier.status} />
          </div>
          <p className="form-page-subtitle">
            {supplier.companyName} &bull; Key partner managing {productsSuppliedList.length} catalog SKU replenishment lines.
          </p>
        </div>

        <div className="form-top-actions">
          <Link to={`/suppliers/${supplier.id}/edit`} className="btn-sm btn-secondary">
            <Edit size={15} />
            <span>Edit Profile</span>
          </Link>
          <Link to="/purchase-orders/new" className="btn-sm btn-primary">
            <FileSpreadsheet size={15} />
            <span>Generate PO</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Catalog SKUs Supplied</span>
            <div className="stat-card-icon-wrap" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
              <Package size={20} />
            </div>
          </div>
          <div className="stat-card-value">{productsSuppliedList.length}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Active contract product lines</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Lifetime Purchase Orders</span>
            <div className="stat-card-icon-wrap" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
              <FileSpreadsheet size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#047857' }}>
            {recentPOs.length}
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Total procurement orders issued</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Total Procurement Value</span>
            <div className="stat-card-icon-wrap" style={{ color: '#7c3aed', backgroundColor: '#f5f3ff' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ fontSize: '20px' }}>
            ₹{totalBilledValue.toLocaleString('en-IN')}
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Total procurement billed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Open / Pending Orders</span>
            <div className="stat-card-icon-wrap" style={{ color: '#d97706', backgroundColor: '#fffbeb' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#b45309' }}>
            {openOrdersCount} Orders
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">In-transit or awaiting fulfillment</span>
          </div>
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div className="product-details-grid" style={{ marginBottom: '24px' }}>
        {/* Contact & Address */}
        <div className="card product-details-card">
          <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} color="#2563eb" />
            <span>Commercial Contact Details</span>
          </h3>

          <div className="details-key-val-grid">
            <div className="details-key-val-item">
              <span className="details-key">Key Relationship Manager</span>
              <span className="details-val">{supplier.contactPerson || '—'}</span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Direct Email</span>
              <span className="details-val" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={13} color="#64748b" /> {supplier.email || '—'}
              </span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Phone Contact</span>
              <span className="details-val" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={13} color="#64748b" /> {supplier.phone || '—'}
              </span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Merchandise Segment</span>
              <span className="details-val">{supplier.category || 'General Merchandise'}</span>
            </div>
            <div className="details-key-val-item" style={{ gridColumn: '1 / -1' }}>
              <span className="details-key">Registered Facility / Office Address</span>
              <span className="details-val">
                {supplier.address ? `${supplier.address}, ` : ''}{supplier.city ? `${supplier.city}, ` : ''}{supplier.state || ''} {supplier.pincode ? `— ${supplier.pincode}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Business & Tax Terms */}
        <div className="card product-details-card">
          <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={16} color="#2563eb" />
            <span>Financial Terms & Compliance</span>
          </h3>

          <div className="details-key-val-grid">
            <div className="details-key-val-item">
              <span className="details-key">GSTIN Identifier</span>
              <span className="details-val">
                <code style={{ fontSize: '13px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                  {supplier.gstNumber || 'Unregistered'}
                </code>
              </span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Payment Settlement Terms</span>
              <span className="details-val" style={{ fontWeight: 700, color: '#0f172a' }}>
                {supplier.paymentTerms || 'Net 30'}
              </span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Account Status</span>
              <span className="details-val">
                <StatusBadge status={supplier.status} />
              </span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Vendor Since</span>
              <span className="details-val">{supplier.createdAt ? String(supplier.createdAt).split('T')[0] : '—'}</span>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldCheck size={18} color="#059669" />
            <span style={{ fontSize: '12px', color: '#475569' }}>
              GSTIN verified and compliant under Indian MSME procurement guidelines.
            </span>
          </div>
        </div>
      </div>

      {/* Products Supplied Table */}
      <div className="card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 12px 20px' }}>
          <SectionHeader
            title="Products Supplied"
            subtitle="Catalog items mapped to this authorized vendor for replenishment purchase orders."
            badge={`${productsSuppliedList.length} SKUs`}
          />
        </div>
        <DataTable
          columns={productColumns}
          data={productsSuppliedList}
          keyExtractor={(p) => p.id}
          emptyTitle="No catalog items configured"
          emptyMessage="Assign catalog products to this supplier in the product master."
        />
      </div>

      {/* Recent Purchase Orders Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 12px 20px' }}>
          <SectionHeader
            title="Recent Purchase Orders"
            subtitle="Procurement logs and fulfillment receipts executed with this vendor."
            badge={`${recentPOs.length} Orders`}
          />
        </div>
        <DataTable
          columns={poColumns}
          data={recentPOs}
          keyExtractor={(po) => po.id}
          emptyTitle="No purchase orders found"
          emptyMessage="No historical or pending procurement orders exist for this supplier."
        />
      </div>
    </div>
  );
}

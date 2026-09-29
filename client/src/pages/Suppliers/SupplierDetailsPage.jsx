import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
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
import { useSuppliers } from '../../hooks/useSuppliers';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import DataTable from '../../components/common/DataTable';
import SectionHeader from '../../components/common/SectionHeader';

export default function SupplierDetailsPage() {
  const { id } = useParams();
  const { getSupplierById } = useSuppliers();

  const supplier = getSupplierById(id);

  if (!supplier) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Supplier Not Found"
          message={`No supplier matching identifier "${id}" exists in active records.`}
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

  // Realistic mock data for products supplied by this vendor
  const productsSuppliedList = [
    {
      id: 'prod-101',
      name: 'Apple iPhone 15 (128 GB) - Black',
      sku: 'SKU-APL-IP15',
      category: 'Electronics',
      unitPrice: 62000,
      lastOrdered: '2026-09-15',
    },
    {
      id: 'prod-102',
      name: 'Samsung Galaxy S25 5G (256 GB) - Titanium Gray',
      sku: 'SKU-SAM-S25',
      category: 'Electronics',
      unitPrice: 68500,
      lastOrdered: '2026-09-18',
    },
    {
      id: 'prod-106',
      name: 'OnePlus 12R 5G (Cool Blue, 16GB RAM, 256GB)',
      sku: 'SKU-OP-12R',
      category: 'Electronics',
      unitPrice: 34000,
      lastOrdered: '2026-09-22',
    },
  ];

  // Realistic mock recent purchase orders for this supplier
  const recentPOs = [
    {
      id: 'po-1',
      poNumber: 'PO-2026-0012',
      orderDate: '2026-09-15',
      expectedDate: '2026-09-28',
      amount: 1240000,
      status: 'RECEIVED',
    },
    {
      id: 'po-3',
      poNumber: 'PO-2026-0034',
      orderDate: '2026-09-24',
      expectedDate: '2026-10-05',
      amount: 680000,
      status: 'APPROVED',
    },
  ];

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
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 600 }}>
          ₹{row.unitPrice.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'lastOrdered',
      header: 'Last Ordered',
      align: 'right',
      render: (row) => <span style={{ fontSize: '12px', color: '#64748b' }}>{row.lastOrdered}</span>,
    },
  ];

  const poColumns = [
    {
      key: 'poNumber',
      header: 'PO Number',
      render: (row) => (
        <Link to={`/purchase-orders/${row.id}`} className="product-table-name-link">
          {row.poNumber}
        </Link>
      ),
    },
    {
      key: 'orderDate',
      header: 'Order Date',
      render: (row) => <span style={{ fontSize: '12.5px', color: '#475569' }}>{row.orderDate}</span>,
    },
    {
      key: 'expectedDate',
      header: 'Expected Delivery',
      render: (row) => <span style={{ fontSize: '12.5px', color: '#64748b' }}>{row.expectedDate}</span>,
    },
    {
      key: 'amount',
      header: 'Order Amount',
      align: 'right',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          ₹{row.amount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'PO Status',
      width: '140px',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="product-module-page">
      {/* Top Header */}
      <div className="form-header-bar">
        <div>
          <Link to="/suppliers" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Suppliers</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 4, flexWrap: 'wrap' }}>
            <h2 className="form-page-title">{supplier.name}</h2>
            <StatusBadge status={supplier.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 6, color: '#64748b', fontSize: '12.5px', flexWrap: 'wrap' }}>
            <span className="sku-code">{supplier.supplierCode}</span>
            <span>&bull;</span>
            <span>{supplier.companyName}</span>
            <span>&bull;</span>
            <MapPin size={13} />
            <span>{supplier.city}, {supplier.state}</span>
          </div>
        </div>

        <div className="form-top-actions">
          <Link to={`/suppliers/${supplier.id}/edit`} className="btn-sm btn-secondary">
            <Edit size={15} />
            <span>Edit Profile</span>
          </Link>
          <Link to="/purchase-orders/new" className="btn-sm btn-primary">
            <FileSpreadsheet size={15} />
            <span>Create PO</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Catalog SKUs Supplied</span>
            <div className="stat-card-icon-wrap" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
              <Package size={20} />
            </div>
          </div>
          <div className="stat-card-value">{supplier.productsSupplied || productsSuppliedList.length}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Active contract product lines</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Purchase Orders</span>
            <div className="stat-card-icon-wrap" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
              <FileSpreadsheet size={20} />
            </div>
          </div>
          <div className="stat-card-value">14</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Lifetime PO transactions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Total Procured Value</span>
            <div className="stat-card-icon-wrap" style={{ color: '#7c3aed', backgroundColor: '#f5f3ff' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ fontSize: '20px' }}>
            ₹1.92 Cr
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Gross billed merchandise value</span>
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
            1 Order
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
              <span className="details-val">{supplier.contactPerson}</span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Direct Email</span>
              <span className="details-val" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={13} color="#64748b" /> {supplier.email}
              </span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Phone Contact</span>
              <span className="details-val" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={13} color="#64748b" /> {supplier.phone}
              </span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Merchandise Segment</span>
              <span className="details-val">{supplier.category}</span>
            </div>
            <div className="details-key-val-item" style={{ gridColumn: '1 / -1' }}>
              <span className="details-key">Registered Facility / Office Address</span>
              <span className="details-val">
                {supplier.address ? `${supplier.address}, ` : ''}{supplier.city}, {supplier.state} — {supplier.pincode}
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
                {supplier.paymentTerms}
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
              <span className="details-val">{supplier.createdAt}</span>
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

import React from 'react';
import { FileSpreadsheet, Building2, CheckCircle2, Clock } from 'lucide-react';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useSuppliers } from '../../hooks/useSuppliers';
import DataTable from '../common/DataTable';

export default function ProcurementReport() {
  const { purchaseOrders } = usePurchaseOrders();
  const { suppliers } = useSuppliers();

  // 1. Status breakdown metrics
  const statusCounts = {
    DRAFT: purchaseOrders.filter((p) => p.status === 'DRAFT').length,
    PENDING: purchaseOrders.filter((p) => p.status === 'PENDING').length,
    APPROVED: purchaseOrders.filter((p) => p.status === 'APPROVED').length,
    PARTIALLY_RECEIVED: purchaseOrders.filter((p) => p.status === 'PARTIALLY_RECEIVED').length,
    RECEIVED: purchaseOrders.filter((p) => p.status === 'RECEIVED').length,
    CANCELLED: purchaseOrders.filter((p) => p.status === 'CANCELLED').length,
  };

  const totalValue = purchaseOrders
    .filter((p) => p.status !== 'CANCELLED')
    .reduce((acc, p) => acc + (p.total || 0), 0);

  // 2. Supplier spend summary
  const supplierSpend = suppliers.map((sup) => {
    const supPOs = purchaseOrders.filter(
      (p) => String(p.supplierId) === String(sup.id) || p.supplierName === sup.name
    );
    const totalSpend = supPOs
      .filter((p) => p.status !== 'CANCELLED')
      .reduce((acc, p) => acc + (p.total || 0), 0);
    const pendingSpend = supPOs
      .filter((p) => p.status === 'PENDING' || p.status === 'APPROVED')
      .reduce((acc, p) => acc + (p.total || 0), 0);

    return {
      id: sup.id,
      name: sup.name,
      code: sup.supplierCode,
      category: sup.category,
      city: sup.city,
      poCount: supPOs.length,
      totalSpend,
      pendingSpend,
    };
  });

  const supplierColumns = [
    {
      key: 'name',
      header: 'Supplier Partner',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
          <span className="sku-code" style={{ fontSize: '10.5px', display: 'block' }}>{row.code} &bull; {row.city}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Merchandise Category',
      render: (row) => <span style={{ color: '#475569' }}>{row.category}</span>,
    },
    {
      key: 'poCount',
      header: 'PO Requisitions',
      align: 'right',
      render: (row) => <span className="table-num">{row.poCount} orders</span>,
    },
    {
      key: 'pendingSpend',
      header: 'Pending / In-Transit (₹)',
      align: 'right',
      render: (row) => (
        <span className="table-num" style={{ color: row.pendingSpend > 0 ? '#d97706' : '#94a3b8', fontWeight: 600 }}>
          ₹{row.pendingSpend.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'totalSpend',
      header: 'Gross Total Value (₹)',
      align: 'right',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          ₹{row.totalSpend.toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Procurement Status Metric Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Pending Approval</span>
            <div className="stat-card-icon-wrap" style={{ color: '#d97706', backgroundColor: '#fffbeb' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#b45309' }}>{statusCounts.PENDING}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Awaiting manager sign-off</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Approved & Active</span>
            <div className="stat-card-icon-wrap" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#2563eb' }}>{statusCounts.APPROVED}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Issued to vendor for dispatch</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Partially Received</span>
            <div className="stat-card-icon-wrap" style={{ color: '#7c3aed', backgroundColor: '#f5f3ff' }}>
              <FileSpreadsheet size={16} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#7c3aed' }}>{statusCounts.PARTIALLY_RECEIVED}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Partial warehouse intakes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Received & Stocked</span>
            <div className="stat-card-icon-wrap" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#047857' }}>{statusCounts.RECEIVED}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Fulfillment complete</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Total Spend Value</span>
            <div className="stat-card-icon-wrap" style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>
              <Building2 size={16} />
            </div>
          </div>
          <div className="stat-card-value" style={{ fontSize: '18px' }}>
            ₹{(totalValue / 100000).toFixed(1)} Lakh
          </div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Non-cancelled orders</span>
          </div>
        </div>
      </div>

      {/* 2. Supplier Purchase Summary Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Vendor Purchase Volume & Procurement Exposure
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
            Breakdown of committed capital, open orders, and delivered spend by supplier.
          </p>
        </div>
        <DataTable
          columns={supplierColumns}
          data={supplierSpend}
          keyExtractor={(s) => s.id}
          emptyTitle="No supplier procurement data"
        />
      </div>
    </div>
  );
}

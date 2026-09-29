import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  Ban,
  PackageCheck,
  IndianRupee,
} from 'lucide-react';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import DataTable from '../../components/common/DataTable';
import ReceiveGoodsModal from '../../components/purchaseOrders/ReceiveGoodsModal';

export default function PurchaseOrderDetailsPage() {
  const { id } = useParams();
  const { getPurchaseOrderById, approvePurchaseOrder, cancelPurchaseOrder, receivePurchaseOrder } = usePurchaseOrders();

  const [receivingModalOpen, setReceivingModalOpen] = useState(false);

  const po = getPurchaseOrderById(id);

  if (!po) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Purchase Order Not Found"
          message={`No purchase order matching identifier "${id}" exists in active records.`}
          action={
            <Link to="/purchase-orders" className="btn-sm btn-primary">
              <ArrowLeft size={15} />
              <span>Back to Purchase Orders</span>
            </Link>
          }
        />
      </div>
    );
  }

  const handleConfirmReceipt = (quantitiesMap, notes, performedBy) => {
    receivePurchaseOrder(po.id, quantitiesMap, notes, performedBy);
  };

  const itemColumns = [
    {
      key: 'productName',
      header: 'Product Line Item',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.productName}</span>
          <span className="sku-code" style={{ display: 'inline-block', marginLeft: 6, fontSize: '11px' }}>
            {row.sku}
          </span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Ordered',
      align: 'right',
      width: '100px',
      render: (row) => <span className="table-num" style={{ fontWeight: 600 }}>{row.quantity}</span>,
    },
    {
      key: 'receivedQuantity',
      header: 'Received',
      align: 'right',
      width: '100px',
      render: (row) => (
        <span
          className="table-num"
          style={{
            fontWeight: 700,
            color: (row.receivedQuantity || 0) > 0 ? '#059669' : '#64748b',
          }}
        >
          {row.receivedQuantity || 0}
        </span>
      ),
    },
    {
      key: 'remaining',
      header: 'Remaining',
      align: 'right',
      width: '100px',
      render: (row) => {
        const remaining = Math.max(0, row.quantity - (row.receivedQuantity || 0));
        return (
          <span
            className="table-num"
            style={{
              fontWeight: 700,
              color: remaining === 0 ? '#64748b' : '#d97706',
            }}
          >
            {remaining}
          </span>
        );
      },
    },
    {
      key: 'unitPrice',
      header: 'Unit Rate (₹)',
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="table-num">
          ₹{(row.unitPrice || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'tax',
      header: 'GST (18%)',
      align: 'right',
      width: '110px',
      render: (row) => (
        <span className="table-num" style={{ color: '#64748b' }}>
          ₹{(row.tax || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Line Total',
      align: 'right',
      width: '130px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          ₹{(row.total || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div className="product-module-page">
      {/* Header Bar */}
      <div className="form-header-bar">
        <div>
          <Link to="/purchase-orders" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Purchase Orders</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 4, flexWrap: 'wrap' }}>
            <h2 className="form-page-title">{po.poNumber}</h2>
            <StatusBadge status={po.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 6, color: '#64748b', fontSize: '12.5px', flexWrap: 'wrap' }}>
            <span>Ordered on: <strong>{po.orderDate}</strong></span>
            <span>&bull;</span>
            <span>Expected by: <strong>{po.expectedDate}</strong></span>
            <span>&bull;</span>
            <span>Created by: {po.createdBy}</span>
          </div>
        </div>

        <div className="form-top-actions">
          {po.status === 'PENDING' && (
            <button
              type="button"
              className="btn-sm btn-primary"
              style={{ backgroundColor: '#059669', borderColor: '#047857' }}
              onClick={() => approvePurchaseOrder(po.id)}
            >
              <CheckCircle size={15} />
              <span>Approve PO</span>
            </button>
          )}

          {(po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') && (
            <button
              type="button"
              className="btn-sm btn-primary"
              onClick={() => setReceivingModalOpen(true)}
            >
              <PackageCheck size={15} />
              <span>Receive Goods</span>
            </button>
          )}

          {(po.status === 'DRAFT' || po.status === 'PENDING') && (
            <button
              type="button"
              className="btn-sm btn-secondary"
              style={{ color: '#dc2626' }}
              onClick={() => cancelPurchaseOrder(po.id)}
            >
              <Ban size={15} />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div className="product-details-grid" style={{ marginBottom: '24px' }}>
        {/* Supplier & Warehouse */}
        <div className="card product-details-card">
          <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} color="#2563eb" />
            <span>Logistics & Vendor Allocation</span>
          </h3>

          <div className="details-key-val-grid">
            <div className="details-key-val-item">
              <span className="details-key">Supplier Partner</span>
              <span className="details-val">
                <Link to={`/suppliers/${po.supplierId}`} style={{ color: '#2563eb' }}>
                  {po.supplierName}
                </Link>
              </span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Destination Storage Node</span>
              <span className="details-val">
                <Link to={`/inventory/warehouse/${po.warehouseId}`} style={{ color: '#2563eb' }}>
                  {po.warehouseName}
                </Link>
              </span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Order Requisition Date</span>
              <span className="details-val">{po.orderDate}</span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Target Fulfillment Date</span>
              <span className="details-val" style={{ color: '#d97706', fontWeight: 600 }}>
                {po.expectedDate}
              </span>
            </div>
            <div className="details-key-val-item" style={{ gridColumn: '1 / -1' }}>
              <span className="details-key">Procurement Memo / Notes</span>
              <span className="details-val" style={{ color: '#64748b', fontSize: '13px' }}>
                {po.notes || 'Standard inventory replenishment order'}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="card product-details-card">
          <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IndianRupee size={16} color="#2563eb" />
            <span>Commercial Cost Breakdown</span>
          </h3>

          <div className="details-key-val-grid">
            <div className="details-key-val-item">
              <span className="details-key">Net Merchandise Subtotal</span>
              <span className="details-val">₹{(po.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Applicable GST / Taxes (18%)</span>
              <span className="details-val">₹{(po.tax || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Gross Total Payable</span>
              <span className="details-val" style={{ fontSize: '18px', color: '#0f172a', fontWeight: 700 }}>
                ₹{(po.total || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Fulfillment Progression</span>
              <span className="details-val">
                <StatusBadge status={po.status} />
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              color: '#475569',
            }}
          >
            <strong>Inbound Workflow:</strong> Once goods arrive at {po.warehouseName}, click <strong>Receive Goods</strong> to log intake quantities. This will automatically adjust physical on-hand stock and record stock receipt movements.
          </div>
        </div>
      </div>

      {/* Ordered Line Items Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 12px 20px' }}>
          <h3 className="module-title" style={{ fontSize: '16px' }}>Ordered Line Items</h3>
          <p className="module-description">Product catalog allocations, received intake progress, and remaining units.</p>
        </div>

        <DataTable
          columns={itemColumns}
          data={po.items || []}
          keyExtractor={(item) => item.productId}
          emptyTitle="No line items found"
          emptyMessage="This purchase order has no assigned product items."
        />
      </div>

      {/* Receive Goods Modal */}
      <ReceiveGoodsModal
        isOpen={receivingModalOpen}
        purchaseOrder={po}
        onClose={() => setReceivingModalOpen(false)}
        onConfirmReceipt={handleConfirmReceipt}
      />
    </div>
  );
}

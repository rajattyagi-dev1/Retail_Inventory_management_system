import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  CheckCircle2,
  Package,
  Truck,
  Ban,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import DataTable from '../../components/common/DataTable';

const TIMELINE_STAGES = [
  { key: 'CONFIRMED', label: 'Order Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'PICKING', label: 'Picking' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { getOrderById, updateOrderStatus, cancelOrder, loading: contextLoading } = useOrders();

  const cachedOrder = getOrderById(id);
  const [directOrder, setDirectOrder] = useState(null);
  const [fetchingDirect, setFetchingDirect] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    if (!cachedOrder && id) {
      setFetchingDirect(true);
      import('../../services/orderService')
        .then((m) => m.default.getOrderById(id))
        .then((res) => {
          if (mounted && res && res.data) {
            setDirectOrder(res.data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (mounted) setFetchingDirect(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [cachedOrder, id]);

  const order = cachedOrder || directOrder;

  if (contextLoading || fetchingDirect) {
    return (
      <div className="product-module-page">
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          Loading order details...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="product-module-page">
        <EmptyState
          title="Order Not Found"
          message={`No customer order matching identifier "${id}" exists in active records.`}
          action={
            <Link to="/orders" className="btn-sm btn-primary">
              <ArrowLeft size={15} />
              <span>Back to Orders</span>
            </Link>
          }
        />
      </div>
    );
  }

  const currentStageIndex = TIMELINE_STAGES.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'CANCELLED';

  const subtotal = (order.items || []).reduce((acc, i) => acc + (i.total || (i.quantity * i.unitPrice)), 0);
  const tax = Math.round(subtotal * 0.18);
  const shippingFee = subtotal > 50000 ? 0 : 250;
  const grandTotal = subtotal + tax + shippingFee;

  const itemColumns = [
    {
      key: 'productName',
      header: 'Item Description',
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
      header: 'Quantity',
      align: 'right',
      width: '100px',
      render: (row) => <span className="table-num" style={{ fontWeight: 600 }}>{row.quantity}</span>,
    },
    {
      key: 'unitPrice',
      header: 'Price (₹)',
      align: 'right',
      width: '120px',
      render: (row) => <span className="table-num">₹{(row.unitPrice || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'total',
      header: 'Total (₹)',
      align: 'right',
      width: '130px',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          ₹{(row.total || (row.quantity * row.unitPrice)).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div className="product-module-page">
      {/* Top Header Bar */}
      <div className="form-header-bar">
        <div>
          <Link to="/orders" className="form-back-link">
            <ArrowLeft size={16} />
            <span>Back to Orders</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 4, flexWrap: 'wrap' }}>
            <h2 className="form-page-title">{order.orderNumber}</h2>
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 6, color: '#64748b', fontSize: '12.5px', flexWrap: 'wrap' }}>
            <span>Customer: <strong>{order.customerName}</strong></span>
            <span>&bull;</span>
            <span>Date: {order.orderDate}</span>
            <span>&bull;</span>
            <span>Fulfillment Hub: <strong>{order.warehouseName}</strong></span>
          </div>
        </div>

        {/* Status transition actions */}
        <div className="form-top-actions">
          {order.status === 'PENDING' && (
            <button
              type="button"
              className="btn-sm btn-primary"
              onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
            >
              <CheckCircle2 size={15} />
              <span>Confirm Order</span>
            </button>
          )}

          {order.status === 'CONFIRMED' && (
            <button
              type="button"
              className="btn-sm btn-primary"
              onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
            >
              <ArrowRight size={15} />
              <span>Start Processing</span>
            </button>
          )}

          {order.status === 'PROCESSING' && (
            <button
              type="button"
              className="btn-sm btn-primary"
              onClick={() => updateOrderStatus(order.id, 'PICKING')}
            >
              <Package size={15} />
              <span>Release to Picking</span>
            </button>
          )}

          {order.status === 'PICKING' && (
            <button
              type="button"
              className="btn-sm btn-primary"
              onClick={() => updateOrderStatus(order.id, 'PACKED')}
            >
              <CheckCircle2 size={15} />
              <span>Mark as Packed</span>
            </button>
          )}

          {order.status === 'PACKED' && (
            <button
              type="button"
              className="btn-sm btn-primary"
              onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
            >
              <Truck size={15} />
              <span>Dispatch & Ship</span>
            </button>
          )}

          {order.status === 'SHIPPED' && (
            <button
              type="button"
              className="btn-sm btn-primary"
              style={{ backgroundColor: '#059669', borderColor: '#047857' }}
              onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
            >
              <CheckCircle2 size={15} />
              <span>Mark Delivered</span>
            </button>
          )}

          {!['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status) && (
            <button
              type="button"
              className="btn-sm btn-secondary"
              style={{ color: '#dc2626' }}
              onClick={() => cancelOrder(order.id)}
            >
              <Ban size={15} />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Fulfillment Pipeline Timeline Card */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 className="details-card-section-title" style={{ marginBottom: '16px' }}>
          Fulfillment Stage Progression
        </h3>

        {isCancelled ? (
          <div
            style={{
              padding: '14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Ban size={18} />
            <span>This order was cancelled. Allocated inventory reservations were released back to free stock.</span>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflowX: 'auto',
              padding: '8px 0',
            }}
          >
            {TIMELINE_STAGES.map((stage, idx) => {
              const isPast = currentStageIndex > idx;
              const isCurrent = currentStageIndex === idx;

              return (
                <div
                  key={stage.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '100px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isPast ? '#059669' : isCurrent ? '#2563eb' : '#e2e8f0',
                      color: isPast || isCurrent ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '12px',
                      marginBottom: '6px',
                      boxShadow: isCurrent ? '0 0 0 3px rgba(37, 99, 235, 0.2)' : 'none',
                    }}
                  >
                    {isPast ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? '#0f172a' : '#64748b',
                      textAlign: 'center',
                    }}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2-Column Info Grid */}
      <div className="product-details-grid" style={{ marginBottom: '24px' }}>
        {/* Customer & Shipping */}
        <div className="card product-details-card">
          <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} color="#2563eb" />
            <span>Customer & Delivery Details</span>
          </h3>

          <div className="details-key-val-grid">
            <div className="details-key-val-item">
              <span className="details-key">Customer Name</span>
              <span className="details-val">{order.customerName}</span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Contact Email</span>
              <span className="details-val">{order.customerEmail}</span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Phone Number</span>
              <span className="details-val">{order.customerPhone}</span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Dispatched From Hub</span>
              <span className="details-val">
                <Link to={`/inventory/warehouse/${order.warehouseId}`} style={{ color: '#2563eb' }}>
                  {order.warehouseName}
                </Link>
              </span>
            </div>
            <div className="details-key-val-item" style={{ gridColumn: '1 / -1' }}>
              <span className="details-key">Shipping Address</span>
              <span className="details-val">
                {order.shippingAddress?.address ? `${order.shippingAddress.address}, ` : ''}
                {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Billing Breakdown */}
        <div className="card product-details-card">
          <h3 className="details-card-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={16} color="#2563eb" />
            <span>Billing & Financial Summary</span>
          </h3>

          <div className="details-key-val-grid">
            <div className="details-key-val-item">
              <span className="details-key">Items Subtotal</span>
              <span className="details-val">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">GST / Taxes (18%)</span>
              <span className="details-val">₹{tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Logistics / Shipping</span>
              <span className="details-val">{shippingFee === 0 ? 'Free Shipping' : `₹${shippingFee}`}</span>
            </div>
            <div className="details-key-val-item">
              <span className="details-key">Payment Status</span>
              <span className="details-val">
                <StatusBadge status={order.paymentStatus} />
              </span>
            </div>
            <div className="details-key-val-item" style={{ gridColumn: '1 / -1' }}>
              <span className="details-key">Gross Invoiced Total</span>
              <span className="details-val" style={{ fontSize: '18px', color: '#0f172a', fontWeight: 700 }}>
                ₹{(order.totalAmount || grandTotal).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 12px 20px' }}>
          <h3 className="module-title" style={{ fontSize: '16px' }}>Ordered Items</h3>
          <p className="module-description">SKU catalog items allocated from {order.warehouseName}</p>
        </div>

        <DataTable
          columns={itemColumns}
          data={order.items || []}
          keyExtractor={(item) => item.productId}
          emptyTitle="No items in order"
          emptyMessage="This sales order contains no item lines."
        />
      </div>
    </div>
  );
}

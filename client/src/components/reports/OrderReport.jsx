import React, { useState, useEffect } from 'react';
import { ShoppingCart, Clock, Package, Truck, CheckCircle2, Ban } from 'lucide-react';
import DataTable from '../common/DataTable';
import reportService from '../../services/reportService';

export default function OrderReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    reportService
      .getOrderReport()
      .then((res) => {
        if (mounted && res && res.data) {
          setReportData(res.data);
        }
      })
      .catch((err) => console.error('Failed to load order report:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = reportData?.kpis || {};
  const statusCounts = kpis.statusCounts || {};

  const totalOrders = kpis.totalOrders || 0;
  const pendingOrders = (statusCounts.PENDING || 0) + (statusCounts.CONFIRMED || 0);
  const processingOrders = (statusCounts.PROCESSING || 0) + (statusCounts.PICKING || 0) + (statusCounts.PACKED || 0);
  const shippedOrders = statusCounts.SHIPPED || 0;
  const deliveredOrders = statusCounts.DELIVERED || 0;
  const cancelledOrders = statusCounts.CANCELLED || 0;

  // Warehouse fulfillment volume from backend warehouseBreakdown
  const warehouseVolume = (reportData?.warehouseBreakdown || []).map((wh) => ({
    id: wh.warehouseId,
    name: wh.warehouseName,
    code: 'HUB',
    totalOrders: wh.orderCount,
    completedOrders: 0,
    unitsDispatched: 0,
    revenue: wh.revenue,
  }));

  const whColumns = [
    {
      key: 'name',
      header: 'Fulfillment Hub',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
          <span className="sku-code" style={{ fontSize: '10.5px', display: 'block' }}>{row.code}</span>
        </div>
      ),
    },
    {
      key: 'totalOrders',
      header: 'Orders Allocated',
      align: 'right',
      render: (row) => <span className="table-num">{row.totalOrders} orders</span>,
    },
    {
      key: 'completedOrders',
      header: 'Completed / Shipped',
      align: 'right',
      render: (row) => (
        <span className="table-num" style={{ color: '#059669', fontWeight: 600 }}>
          {row.completedOrders} orders
        </span>
      ),
    },
    {
      key: 'unitsDispatched',
      header: 'Units Dispatched',
      align: 'right',
      render: (row) => <span className="table-num">{row.unitsDispatched} units</span>,
    },
    {
      key: 'revenue',
      header: 'Total Order Value (₹)',
      align: 'right',
      render: (row) => (
        <span className="table-num" style={{ fontWeight: 700, color: '#0f172a' }}>
          ₹{row.revenue.toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Metrics Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Total Volume</span>
            <div className="stat-card-icon-wrap" style={{ color: '#0f172a', backgroundColor: '#f1f5f9' }}>
              <ShoppingCart size={15} />
            </div>
          </div>
          <div className="stat-card-value">{totalOrders}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Sales orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Pending</span>
            <div className="stat-card-icon-wrap" style={{ color: '#d97706', backgroundColor: '#fffbeb' }}>
              <Clock size={15} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#b45309' }}>{pendingOrders}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Awaiting stage</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">In Fulfillment</span>
            <div className="stat-card-icon-wrap" style={{ color: '#2563eb', backgroundColor: '#eff6ff' }}>
              <Package size={15} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#2563eb' }}>{processingOrders}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Pick / Pack stages</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">In-Transit</span>
            <div className="stat-card-icon-wrap" style={{ color: '#7c3aed', backgroundColor: '#f5f3ff' }}>
              <Truck size={15} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#7c3aed' }}>{shippedOrders}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">With courier partner</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Delivered</span>
            <div className="stat-card-icon-wrap" style={{ color: '#059669', backgroundColor: '#ecfdf5' }}>
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#047857' }}>{deliveredOrders}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Handoff complete</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Cancelled</span>
            <div className="stat-card-icon-wrap" style={{ color: '#ef4444', backgroundColor: '#fef2f2' }}>
              <Ban size={15} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: '#dc2626' }}>{cancelledOrders}</div>
          <div className="stat-card-bottom">
            <span className="stat-card-subtext">Stock released</span>
          </div>
        </div>
      </div>

      {/* Warehouse Volume Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Warehouse Fulfillment Volume & Revenue Distribution
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
            Regional distribution node performance, completed orders, and shipped units.
          </p>
        </div>
        <DataTable
          columns={whColumns}
          data={warehouseVolume}
          loading={loading}
          keyExtractor={(w) => w.id}
          emptyTitle="No warehouse fulfillment records"
        />
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  RotateCw, 
  Package, 
  Boxes, 
  AlertTriangle, 
  Clock, 
  Warehouse, 
  IndianRupee 
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import InventoryOverview from '../../components/dashboard/InventoryOverview';
import OrderStatusOverview from '../../components/dashboard/OrderStatusOverview';
import LowStockTable from '../../components/dashboard/LowStockTable';
import RecentOrdersTable from '../../components/dashboard/RecentOrdersTable';
import RecentStockMovements from '../../components/dashboard/RecentStockMovements';
import RecentNotifications from '../../components/dashboard/RecentNotifications';
import reportService from '../../services/reportService';

/**
 * Main Enterprise Dashboard Component.
 * Integrates summary metrics, regional inventory distribution, fulfillment status,
 * stock alert tables, recent orders, inventory ledger, and notification streams.
 */
export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await reportService.getDashboardReport();
      if (res && res.data) {
        setDashboardData(res.data);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard report:', err);
      setError(err.message || 'Failed to load telemetry metrics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const handleExport = () => {
    window.print();
  };

  const invKpis = dashboardData?.inventory || {};
  const ordKpis = dashboardData?.orders || {};
  const whKpis = dashboardData?.warehouses || {};

  const summaryCards = [
    {
      id: 'total-products',
      title: 'Total Products',
      value: loading ? '...' : (invKpis.totalProductsTracked ?? 0).toLocaleString(),
      subtext: `${invKpis.totalInventoryRecords ?? 0} inventory records`,
      icon: Package,
    },
    {
      id: 'total-inventory',
      title: 'Total Inventory Units',
      value: loading ? '...' : (invKpis.totalCurrentStock ?? 0).toLocaleString(),
      subtext: `Available: ${(invKpis.totalAvailableStock ?? 0).toLocaleString()} units`,
      icon: Boxes,
    },
    {
      id: 'low-stock',
      title: 'Low Stock Alerts',
      value: loading ? '...' : (invKpis.lowStockCount ?? 0).toLocaleString(),
      change: invKpis.outOfStockCount > 0 ? `${invKpis.outOfStockCount} out of stock` : 'Stable',
      changeType: invKpis.lowStockCount > 0 ? 'negative' : 'positive',
      subtext: 'Reorder levels breached',
      icon: AlertTriangle,
    },
    {
      id: 'active-warehouses',
      title: 'Active Warehouses',
      value: loading ? '...' : `${whKpis.active ?? 0} / ${whKpis.total ?? 0}`,
      subtext: 'Operational storage hubs',
      icon: Warehouse,
    },
    {
      id: 'pending-orders',
      title: 'Pending Orders',
      value: loading ? '...' : (
        (ordKpis.statusCounts?.PENDING || 0) + (ordKpis.statusCounts?.CONFIRMED || 0)
      ).toLocaleString(),
      subtext: `${ordKpis.activePipelineOrders ?? 0} active in pipeline`,
      icon: Clock,
    },
    {
      id: 'total-valuation',
      title: 'Total Inventory Value',
      value: loading ? '...' : `₹${(invKpis.totalCostValue ?? 0).toLocaleString('en-IN')}`,
      subtext: `Retail: ₹${(invKpis.totalRetailValue ?? 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Top Action Bar */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '12px', 
          marginBottom: '20px' 
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '4px' }}>
              Project ID: P_022
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Real-time Multi-Warehouse Telemetry
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Timeframe Selector */}
          <div style={{ display: 'flex', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setSelectedTimeframe('24h')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '4px',
                background: selectedTimeframe === '24h' ? '#0f172a' : 'transparent',
                color: selectedTimeframe === '24h' ? '#ffffff' : '#64748b',
              }}
            >
              24h
            </button>
            <button
              type="button"
              onClick={() => setSelectedTimeframe('7d')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '4px',
                background: selectedTimeframe === '7d' ? '#0f172a' : 'transparent',
                color: selectedTimeframe === '7d' ? '#ffffff' : '#64748b',
              }}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setSelectedTimeframe('30d')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '4px',
                background: selectedTimeframe === '30d' ? '#0f172a' : 'transparent',
                color: selectedTimeframe === '30d' ? '#ffffff' : '#64748b',
              }}
            >
              30 Days
            </button>
          </div>

          <button
            type="button"
            className="btn-sm btn-secondary"
            onClick={handleRefresh}
            title="Refresh dashboard metrics"
          >
            <RotateCw size={14} className={isRefreshing ? 'loading-spinner' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-sm btn-secondary"
            onClick={handleExport}
            title="Export CSV/PDF summary"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '20px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* 1. Summary Cards Grid */}
      <section 
        className="stats-grid" 
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }} 
        aria-label="Summary Key Performance Indicators"
      >
        {summaryCards.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            subtext={stat.subtext}
            icon={stat.icon}
          />
        ))}
      </section>

      {/* 2 & 3. Warehouse Inventory & Order Pipeline Distribution */}
      <section className="dashboard-grid-2col" aria-label="Warehouse & Fulfillment Pipeline">
        <InventoryOverview />
        <OrderStatusOverview />
      </section>

      {/* 4. Low Stock Products Critical Table */}
      <section style={{ marginBottom: '24px' }} aria-label="Low Stock Products">
        <LowStockTable />
      </section>

      {/* 5 & 6. Recent Orders & Stock Movements */}
      <section className="dashboard-grid-2col" style={{ marginBottom: '24px' }} aria-label="Orders and Movements">
        <RecentOrdersTable />
        <RecentStockMovements />
      </section>

      {/* 7. Recent System Notifications */}
      <section aria-label="System Notifications Feed">
        <RecentNotifications />
      </section>
    </div>
  );
}

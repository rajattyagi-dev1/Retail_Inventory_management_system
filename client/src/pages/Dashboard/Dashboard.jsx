import React, { useState } from 'react';
import { 
  Download, 
  RotateCw, 
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import InventoryOverview from '../../components/dashboard/InventoryOverview';
import OrderStatusOverview from '../../components/dashboard/OrderStatusOverview';
import LowStockTable from '../../components/dashboard/LowStockTable';
import RecentOrdersTable from '../../components/dashboard/RecentOrdersTable';
import RecentStockMovements from '../../components/dashboard/RecentStockMovements';
import RecentNotifications from '../../components/dashboard/RecentNotifications';
import { MOCK_SUMMARY_STATS } from '../../utils/mockData';

/**
 * Main Enterprise Dashboard Component (Phase 2A).
 * Integrates summary metrics, regional inventory distribution, fulfillment status,
 * stock alert tables, recent orders, inventory ledger, and notification streams.
 */
export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleExport = () => {
    alert('Export report feature will be connected to backend reporting service in upcoming sprint.');
  };

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

      {/* 1. Summary Cards Grid */}
      <section className="stats-grid" aria-label="Summary Key Performance Indicators">
        {MOCK_SUMMARY_STATS.map((stat) => (
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

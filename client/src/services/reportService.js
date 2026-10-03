import api from './api';

/**
 * Fetch executive dashboard KPIs and consolidated metrics from GET /api/reports/dashboard.
 */
export async function getDashboardReport() {
  const response = await api.get('/reports/dashboard');
  return response.data;
}

/**
 * Fetch detailed inventory health and valuation report from GET /api/reports/inventory.
 */
export async function getInventoryReport(params = {}) {
  const response = await api.get('/reports/inventory', params);
  return response.data;
}

/**
 * Fetch procurement pipeline and supplier performance report from GET /api/reports/procurement.
 */
export async function getProcurementReport(params = {}) {
  const response = await api.get('/reports/procurement', params);
  return response.data;
}

/**
 * Fetch sales orders and fulfillment pipeline report from GET /api/reports/orders.
 */
export async function getOrderReport(params = {}) {
  const response = await api.get('/reports/orders', params);
  return response.data;
}

export default {
  getDashboardReport,
  getInventoryReport,
  getProcurementReport,
  getOrderReport,
};

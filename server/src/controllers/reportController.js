const reportService = require('../services/reportService');

/**
 * Report Controller
 * Handles HTTP requests and responses for Executive Intelligence & Reports.
 */

const getInventoryReport = async (req, res, next) => {
  try {
    const { warehouseId, categoryId } = req.query;
    const report = await reportService.getInventoryReport({ warehouseId, categoryId });
    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};

const getProcurementReport = async (req, res, next) => {
  try {
    const { supplierId, warehouseId, status } = req.query;
    const report = await reportService.getProcurementReport({ supplierId, warehouseId, status });
    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};

const getOrderReport = async (req, res, next) => {
  try {
    const { warehouseId, status, paymentStatus } = req.query;
    const report = await reportService.getOrderReport({ warehouseId, status, paymentStatus });
    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};

const getDashboardReport = async (req, res, next) => {
  try {
    const report = await reportService.getDashboardReport();
    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getInventoryReport,
  getProcurementReport,
  getOrderReport,
  getDashboardReport,
};

const warehouseService = require('../services/warehouseService');

/**
 * Warehouse Controller
 * Handles HTTP requests and responses for Warehouse endpoints.
 * Strictly no Prisma queries or database access here.
 */

const getWarehouses = async (req, res, next) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const result = await warehouseService.getAllWarehouses({
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder,
    });
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const getWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const warehouse = await warehouseService.getWarehouseById(id);
    return res.status(200).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    return next(error);
  }
};

const createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await warehouseService.createWarehouse(req.body);
    return res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: warehouse,
    });
  } catch (error) {
    return next(error);
  }
};

const updateWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const warehouse = await warehouseService.updateWarehouse(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse,
    });
  } catch (error) {
    return next(error);
  }
};

const updateWarehouseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const warehouse = await warehouseService.updateWarehouseStatus(id, status);
    return res.status(200).json({
      success: true,
      message: 'Warehouse status updated successfully',
      data: warehouse,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  updateWarehouseStatus,
};

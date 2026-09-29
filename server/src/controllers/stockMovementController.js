const stockMovementService = require('../services/stockMovementService');

/**
 * Stock Movement Controller
 * Handles HTTP requests and responses for Stock Movement ledger endpoints.
 * Strictly no Prisma queries or database access here.
 */

const getStockMovements = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      productId,
      warehouseId,
      movementType,
      type,
      search,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await stockMovementService.getAllStockMovements({
      page,
      limit,
      productId,
      warehouseId,
      movementType,
      type,
      search,
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

const getStockMovementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movement = await stockMovementService.getStockMovementById(id);

    return res.status(200).json({
      success: true,
      data: movement,
    });
  } catch (error) {
    return next(error);
  }
};

const getWarehouseStockMovements = async (req, res, next) => {
  try {
    const { warehouseId } = req.params;
    const {
      page,
      limit,
      productId,
      movementType,
      type,
      search,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await stockMovementService.getStockMovementsByWarehouse(warehouseId, {
      page,
      limit,
      productId,
      movementType,
      type,
      search,
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

const getProductStockMovements = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const {
      page,
      limit,
      warehouseId,
      movementType,
      type,
      search,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await stockMovementService.getStockMovementsByProduct(productId, {
      page,
      limit,
      warehouseId,
      movementType,
      type,
      search,
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

module.exports = {
  getStockMovements,
  getStockMovementById,
  getWarehouseStockMovements,
  getProductStockMovements,
};

const inventoryService = require('../services/inventoryService');

/**
 * Inventory Controller
 * Handles HTTP requests and responses for Inventory endpoints.
 * Strictly no Prisma queries or database access here.
 */

const getInventoryList = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      warehouseId,
      productId,
      stockStatus,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await inventoryService.getAllInventory({
      page,
      limit,
      search,
      warehouseId,
      productId,
      stockStatus,
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

const getInventoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await inventoryService.getInventoryById(id);

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    return next(error);
  }
};

const getWarehouseInventory = async (req, res, next) => {
  try {
    const { warehouseId } = req.params;
    const {
      page,
      limit,
      search,
      stockStatus,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await inventoryService.getInventoryByWarehouse(warehouseId, {
      page,
      limit,
      search,
      stockStatus,
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

const getProductInventory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const {
      page,
      limit,
      search,
      stockStatus,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await inventoryService.getInventoryByProduct(productId, {
      page,
      limit,
      search,
      stockStatus,
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

const adjustStock = async (req, res, next) => {
  try {
    const result = await inventoryService.adjustStock(req.body);

    return res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: result.inventory,
      movement: result.movement,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getInventoryList,
  getInventoryById,
  getWarehouseInventory,
  getProductInventory,
  adjustStock,
};

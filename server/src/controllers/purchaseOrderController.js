const purchaseOrderService = require('../services/purchaseOrderService');

/**
 * Purchase Order Controller
 * Handles HTTP requests and responses for Purchase Order endpoints.
 * Strictly delegates business logic to purchaseOrderService.
 */

const getPurchaseOrders = async (req, res, next) => {
  try {
    const { page, limit, search, status, supplierId, warehouseId, sortBy, sortOrder } = req.query;
    const result = await purchaseOrderService.getAllPurchaseOrders({
      page,
      limit,
      search,
      status,
      supplierId,
      warehouseId,
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

const getPurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await purchaseOrderService.getPurchaseOrderById(id);
    return res.status(200).json({
      success: true,
      data: po,
    });
  } catch (error) {
    return next(error);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  try {
    const po = await purchaseOrderService.createPurchaseOrder(req.body);
    return res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: po,
    });
  } catch (error) {
    return next(error);
  }
};

const updatePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await purchaseOrderService.updatePurchaseOrder(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Purchase order updated successfully',
      data: po,
    });
  } catch (error) {
    return next(error);
  }
};

const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const po = await purchaseOrderService.updatePurchaseOrderStatus(id, status);
    return res.status(200).json({
      success: true,
      message: 'Purchase order status updated successfully',
      data: po,
    });
  } catch (error) {
    return next(error);
  }
};

const approvePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await purchaseOrderService.approvePurchaseOrder(id);
    return res.status(200).json({
      success: true,
      message: 'Purchase order approved successfully',
      data: po,
    });
  } catch (error) {
    return next(error);
  }
};

const receiveGoods = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await purchaseOrderService.receiveGoods(id, req.body);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.purchaseOrder,
      meta: {
        movementsCreated: result.movementsCount,
        receivedUnits: result.receivedUnits,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  approvePurchaseOrder,
  receiveGoods,
};

const orderService = require('../services/orderService');

/**
 * Order Controller
 * Handles HTTP requests and responses for Order & Fulfillment endpoints.
 * Strictly delegates domain business logic to orderService.
 */

const getOrders = async (req, res, next) => {
  try {
    const { page, limit, search, status, paymentStatus, warehouseId, sortBy, sortOrder } = req.query;
    const result = await orderService.getAllOrders({
      page,
      limit,
      search,
      status,
      paymentStatus,
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

const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    return next(error);
  }
};

const reserveStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.reserveStockForOrder(id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Stock reserved and order confirmed successfully',
      data: order,
    });
  } catch (error) {
    return next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason, notes, performedBy, performedById } = req.body;
    const order = await orderService.updateOrderStatus(
      id,
      status,
      reason,
      {
        notes,
        performedBy: performedBy || req.user?.name || 'Dispatch Coordinator',
        performedById: req.user?.id || performedById,
      },
      req.user
    );
    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status} successfully`,
      data: order,
    });
  } catch (error) {
    return next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await orderService.cancelOrder(id, reason, req.user);
    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and reserved stock released',
      data: order,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  reserveStock,
  updateOrderStatus,
  cancelOrder,
};

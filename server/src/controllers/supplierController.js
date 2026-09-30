const supplierService = require('../services/supplierService');

/**
 * Supplier Controller
 * Pure HTTP request/response handler.
 * No direct Prisma/database access here.
 */

const getSuppliers = async (req, res, next) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const result = await supplierService.getAllSuppliers({
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

const getSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await supplierService.getSupplierById(id);
    return res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    return next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    return res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier,
    });
  } catch (error) {
    return next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await supplierService.updateSupplier(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier,
    });
  } catch (error) {
    return next(error);
  }
};

const updateSupplierStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const supplier = await supplierService.updateSupplierStatus(id, status);
    return res.status(200).json({
      success: true,
      message: 'Supplier status updated successfully',
      data: supplier,
    });
  } catch (error) {
    return next(error);
  }
};

const getSupplierProducts = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const products = await supplierService.getSupplierProducts(supplierId);
    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    return next(error);
  }
};

const addSupplierProduct = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const result = await supplierService.addSupplierProduct(supplierId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Product associated with supplier successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const removeSupplierProduct = async (req, res, next) => {
  try {
    const { supplierId, productId } = req.params;
    const result = await supplierService.removeSupplierProduct(supplierId, productId);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
  getSupplierProducts,
  addSupplierProduct,
  removeSupplierProduct,
};

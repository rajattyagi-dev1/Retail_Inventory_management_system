const productService = require('../services/productService');

/**
 * Product Controller
 * Handles HTTP requests and responses for Product endpoints.
 * Strictly no Prisma queries or database access here.
 */

const getProducts = async (req, res, next) => {
  try {
    const { page, limit, search, categoryId, status, sortBy, sortOrder } = req.query;
    const result = await productService.getAllProducts({
      page,
      limit,
      search,
      categoryId,
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

const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const product = await productService.updateProductStatus(id, status);
    return res.status(200).json({
      success: true,
      message: 'Product status updated successfully',
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateProductStatus,
};

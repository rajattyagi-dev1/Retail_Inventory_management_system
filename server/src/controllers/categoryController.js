const categoryService = require('../services/categoryService');

/**
 * Category Controller
 * Handles HTTP requests and responses for Category endpoints.
 * Strictly no Prisma queries or business validation here.
 */

const getCategories = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query;
    const result = await categoryService.getAllCategories({ page, limit, search, status });
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

const updateCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const category = await categoryService.updateCategoryStatus(id, status);
    return res.status(200).json({
      success: true,
      message: 'Category status updated successfully',
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  updateCategoryStatus,
};

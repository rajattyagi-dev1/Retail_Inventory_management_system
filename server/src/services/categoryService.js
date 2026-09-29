const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

const VALID_CATEGORY_STATUSES = ['ACTIVE', 'INACTIVE'];

/**
 * Category Service
 * Handles business logic and database operations for Categories.
 * No HTTP request/response logic here.
 */

const getAllCategories = async ({ page = 1, limit = 10, search, status }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  const where = {};

  if (search && typeof search === 'string' && search.trim()) {
    where.name = {
      contains: search.trim(),
    };
  }

  if (status && typeof status === 'string') {
    const upper = status.trim().toUpperCase();
    if (VALID_CATEGORY_STATUSES.includes(upper)) {
      where.status = upper;
    }
  }

  const [total, categories] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      skip,
      take: parsedLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    }),
  ]);

  const data = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    status: cat.status,
    productCount: cat._count.products,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  }));

  const totalPages = Math.ceil(total / parsedLimit) || 1;

  return {
    data,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
    },
  };
};

const getCategoryById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Valid Category ID is required');
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw ApiError.notFound(`Category with ID '${id}' not found`);
  }

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    status: category.status,
    productCount: category._count.products,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

const createCategory = async (payload) => {
  const { name, description, status } = payload || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('Category name is required and must be a non-empty string');
  }

  const trimmedName = name.trim();

  // Enforce unique name constraint
  const existing = await prisma.category.findUnique({
    where: { name: trimmedName },
  });

  if (existing) {
    throw ApiError.conflict(`Category with name '${trimmedName}' already exists`);
  }

  let categoryStatus = 'ACTIVE';
  if (status) {
    const upper = String(status).trim().toUpperCase();
    if (!VALID_CATEGORY_STATUSES.includes(upper)) {
      throw ApiError.badRequest(
        `Invalid category status '${status}'. Allowed values: ${VALID_CATEGORY_STATUSES.join(', ')}`
      );
    }
    categoryStatus = upper;
  }

  const category = await prisma.category.create({
    data: {
      name: trimmedName,
      description: typeof description === 'string' ? description.trim() : null,
      status: categoryStatus,
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    status: category.status,
    productCount: category._count.products,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

const updateCategory = async (id, payload) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Valid Category ID is required');
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw ApiError.notFound(`Category with ID '${id}' not found`);
  }

  const updateData = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || !payload.name.trim()) {
      throw ApiError.badRequest('Category name cannot be empty');
    }
    const trimmedName = payload.name.trim();
    if (trimmedName !== existingCategory.name) {
      const nameConflict = await prisma.category.findUnique({
        where: { name: trimmedName },
      });
      if (nameConflict) {
        throw ApiError.conflict(`Category with name '${trimmedName}' already exists`);
      }
      updateData.name = trimmedName;
    }
  }

  if (payload.description !== undefined) {
    updateData.description = typeof payload.description === 'string' ? payload.description.trim() : null;
  }

  if (payload.status !== undefined) {
    const upper = String(payload.status).trim().toUpperCase();
    if (!VALID_CATEGORY_STATUSES.includes(upper)) {
      throw ApiError.badRequest(
        `Invalid category status '${payload.status}'. Allowed values: ${VALID_CATEGORY_STATUSES.join(', ')}`
      );
    }
    updateData.status = upper;
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return {
    id: updatedCategory.id,
    name: updatedCategory.name,
    description: updatedCategory.description,
    status: updatedCategory.status,
    productCount: updatedCategory._count.products,
    createdAt: updatedCategory.createdAt,
    updatedAt: updatedCategory.updatedAt,
  };
};

const updateCategoryStatus = async (id, status) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Valid Category ID is required');
  }

  if (!status) {
    throw ApiError.badRequest('Status is required');
  }

  const upper = String(status).trim().toUpperCase();
  if (!VALID_CATEGORY_STATUSES.includes(upper)) {
    throw ApiError.badRequest(
      `Invalid category status '${status}'. Allowed values: ${VALID_CATEGORY_STATUSES.join(', ')}`
    );
  }

  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound(`Category with ID '${id}' not found`);
  }

  const updated = await prisma.category.update({
    where: { id },
    data: { status: upper },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    status: updated.status,
    productCount: updated._count.products,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
};

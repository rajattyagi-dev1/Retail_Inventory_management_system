const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

const VALID_PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];
const ALLOWED_SORT_FIELDS = ['name', 'sku', 'sellingPrice', 'costPrice', 'reorderLevel', 'createdAt', 'updatedAt'];

/**
 * Format Product helper to ensure clean Decimal serialization in JSON.
 */
const formatProduct = (product) => {
  if (!product) return null;
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    brand: product.brand,
    categoryId: product.categoryId,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          description: product.category.description,
          status: product.category.status,
        }
      : undefined,
    costPrice: product.costPrice !== null && product.costPrice !== undefined ? Number(product.costPrice) : 0,
    sellingPrice: product.sellingPrice !== null && product.sellingPrice !== undefined ? Number(product.sellingPrice) : 0,
    unit: product.unit,
    reorderLevel: product.reorderLevel,
    status: product.status,
    imageUrl: product.imageUrl,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

/**
 * Product Service
 * Handles business logic, query validations, and database access for Products.
 * No HTTP response manipulation here.
 */

const getAllProducts = async ({
  page = 1,
  limit = 10,
  search,
  categoryId,
  status,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  const where = {};

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q } },
      { sku: { contains: q } },
      { brand: { contains: q } },
    ];
  }

  if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
    where.categoryId = categoryId.trim();
  }

  if (status && typeof status === 'string') {
    const upper = status.trim().toUpperCase();
    if (VALID_PRODUCT_STATUSES.includes(upper)) {
      where.status = upper;
    }
  }

  // Safe sorting whitelist
  const cleanSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const cleanSortOrder = ['asc', 'desc'].includes(String(sortOrder).toLowerCase())
    ? String(sortOrder).toLowerCase()
    : 'desc';

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: parsedLimit,
      orderBy: { [cleanSortBy]: cleanSortOrder },
      include: {
        category: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / parsedLimit) || 1;

  return {
    data: products.map(formatProduct),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
    },
  };
};

const getProductById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Valid Product ID is required');
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  return formatProduct(product);
};

const createProduct = async (payload) => {
  const {
    sku,
    name,
    description,
    brand,
    categoryId,
    costPrice,
    sellingPrice,
    unit,
    reorderLevel,
    status,
    imageUrl,
  } = payload || {};

  // Validations
  if (!sku || typeof sku !== 'string' || !sku.trim()) {
    throw ApiError.badRequest('SKU is required and must be a non-empty string');
  }
  const cleanSku = sku.trim();

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('Product name is required and must be a non-empty string');
  }
  const cleanName = name.trim();

  if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
    throw ApiError.badRequest('Category ID is required');
  }
  const cleanCategoryId = categoryId.trim();

  // Verify category exists
  const categoryExists = await prisma.category.findUnique({
    where: { id: cleanCategoryId },
  });
  if (!categoryExists) {
    throw ApiError.badRequest(`Category with ID '${cleanCategoryId}' does not exist`);
  }

  // Check unique SKU
  const existingSku = await prisma.product.findUnique({
    where: { sku: cleanSku },
  });
  if (existingSku) {
    throw ApiError.conflict(`Product with SKU '${cleanSku}' already exists`);
  }

  // Validate numeric fields
  let parsedCostPrice = 0.0;
  if (costPrice !== undefined && costPrice !== null && costPrice !== '') {
    parsedCostPrice = Number(costPrice);
    if (isNaN(parsedCostPrice) || parsedCostPrice < 0) {
      throw ApiError.badRequest('Cost price must be a valid non-negative number');
    }
  }

  let parsedSellingPrice = 0.0;
  if (sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== '') {
    parsedSellingPrice = Number(sellingPrice);
    if (isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
      throw ApiError.badRequest('Selling price must be a valid non-negative number');
    }
  }

  let parsedReorderLevel = 10;
  if (reorderLevel !== undefined && reorderLevel !== null && reorderLevel !== '') {
    parsedReorderLevel = parseInt(reorderLevel, 10);
    if (isNaN(parsedReorderLevel) || parsedReorderLevel < 0) {
      throw ApiError.badRequest('Reorder level must be a valid non-negative integer');
    }
  }

  let productStatus = 'ACTIVE';
  if (status) {
    const upper = String(status).trim().toUpperCase();
    if (!VALID_PRODUCT_STATUSES.includes(upper)) {
      throw ApiError.badRequest(
        `Invalid product status '${status}'. Allowed values: ${VALID_PRODUCT_STATUSES.join(', ')}`
      );
    }
    productStatus = upper;
  }

  const newProduct = await prisma.product.create({
    data: {
      sku: cleanSku,
      name: cleanName,
      description: typeof description === 'string' ? description.trim() : null,
      brand: typeof brand === 'string' ? brand.trim() : null,
      categoryId: cleanCategoryId,
      costPrice: parsedCostPrice,
      sellingPrice: parsedSellingPrice,
      unit: typeof unit === 'string' && unit.trim() ? unit.trim() : 'Pieces',
      reorderLevel: parsedReorderLevel,
      status: productStatus,
      imageUrl: typeof imageUrl === 'string' ? imageUrl.trim() : null,
    },
    include: {
      category: true,
    },
  });

  return formatProduct(newProduct);
};

const updateProduct = async (id, payload) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Valid Product ID is required');
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw ApiError.notFound('Product not found');
  }

  const updateData = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || !payload.name.trim()) {
      throw ApiError.badRequest('Product name cannot be empty');
    }
    updateData.name = payload.name.trim();
  }

  if (payload.sku !== undefined) {
    if (typeof payload.sku !== 'string' || !payload.sku.trim()) {
      throw ApiError.badRequest('SKU cannot be empty');
    }
    const cleanSku = payload.sku.trim();
    if (cleanSku !== existingProduct.sku) {
      const skuConflict = await prisma.product.findUnique({
        where: { sku: cleanSku },
      });
      if (skuConflict) {
        throw ApiError.conflict(`Product with SKU '${cleanSku}' already exists`);
      }
      updateData.sku = cleanSku;
    }
  }

  if (payload.categoryId !== undefined) {
    const cleanCatId = String(payload.categoryId).trim();
    if (!cleanCatId) {
      throw ApiError.badRequest('Category ID cannot be empty');
    }
    if (cleanCatId !== existingProduct.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: cleanCatId },
      });
      if (!categoryExists) {
        throw ApiError.badRequest(`Category with ID '${cleanCatId}' does not exist`);
      }
      updateData.categoryId = cleanCatId;
    }
  }

  if (payload.description !== undefined) {
    updateData.description = typeof payload.description === 'string' ? payload.description.trim() : null;
  }

  if (payload.brand !== undefined) {
    updateData.brand = typeof payload.brand === 'string' ? payload.brand.trim() : null;
  }

  if (payload.costPrice !== undefined) {
    const parsedCost = Number(payload.costPrice);
    if (isNaN(parsedCost) || parsedCost < 0) {
      throw ApiError.badRequest('Cost price must be a valid non-negative number');
    }
    updateData.costPrice = parsedCost;
  }

  if (payload.sellingPrice !== undefined) {
    const parsedSelling = Number(payload.sellingPrice);
    if (isNaN(parsedSelling) || parsedSelling < 0) {
      throw ApiError.badRequest('Selling price must be a valid non-negative number');
    }
    updateData.sellingPrice = parsedSelling;
  }

  if (payload.unit !== undefined) {
    updateData.unit = typeof payload.unit === 'string' && payload.unit.trim() ? payload.unit.trim() : 'Pieces';
  }

  if (payload.reorderLevel !== undefined) {
    const parsedReorder = parseInt(payload.reorderLevel, 10);
    if (isNaN(parsedReorder) || parsedReorder < 0) {
      throw ApiError.badRequest('Reorder level must be a valid non-negative integer');
    }
    updateData.reorderLevel = parsedReorder;
  }

  if (payload.status !== undefined) {
    const upper = String(payload.status).trim().toUpperCase();
    if (!VALID_PRODUCT_STATUSES.includes(upper)) {
      throw ApiError.badRequest(
        `Invalid product status '${payload.status}'. Allowed values: ${VALID_PRODUCT_STATUSES.join(', ')}`
      );
    }
    updateData.status = upper;
  }

  if (payload.imageUrl !== undefined) {
    updateData.imageUrl = typeof payload.imageUrl === 'string' ? payload.imageUrl.trim() : null;
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
    },
  });

  return formatProduct(updatedProduct);
};

const updateProductStatus = async (id, status) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Valid Product ID is required');
  }

  if (!status) {
    throw ApiError.badRequest('Status is required');
  }

  const upper = String(status).trim().toUpperCase();
  if (!VALID_PRODUCT_STATUSES.includes(upper)) {
    throw ApiError.badRequest(
      `Invalid product status '${status}'. Allowed values: ${VALID_PRODUCT_STATUSES.join(', ')}`
    );
  }

  const existing = await prisma.product.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Product not found');
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { status: upper },
    include: {
      category: true,
    },
  });

  return formatProduct(updated);
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
};

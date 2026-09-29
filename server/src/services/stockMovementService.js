const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { formatStockMovement } = require('./inventoryService');

const VALID_MOVEMENT_TYPES = [
  'RECEIPT',
  'SALE',
  'ADJUSTMENT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'RETURN',
];

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'quantity',
  'type',
];

/**
 * Build Prisma where clause for stock movement filtering.
 */
const buildMovementWhere = ({ productId, warehouseId, movementType, type, search }) => {
  const where = {};

  if (productId && typeof productId === 'string' && productId.trim()) {
    where.productId = productId.trim();
  }

  if (warehouseId && typeof warehouseId === 'string' && warehouseId.trim()) {
    where.warehouseId = warehouseId.trim();
  }

  const requestedType = movementType || type;
  if (requestedType && typeof requestedType === 'string') {
    const upper = requestedType.trim().toUpperCase();
    if (VALID_MOVEMENT_TYPES.includes(upper)) {
      where.type = upper;
    }
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim();
    where.OR = [
      { reference: { contains: q } },
      { notes: { contains: q } },
      { performedBy: { contains: q } },
      { product: { name: { contains: q } } },
      { product: { sku: { contains: q } } },
      { warehouse: { name: { contains: q } } },
      { warehouse: { code: { contains: q } } },
    ];
  }

  return where;
};

/**
 * Stock Movement Service
 * Handles data access and query validations for Stock Movements ledger.
 */

const getAllStockMovements = async ({
  page = 1,
  limit = 10,
  productId,
  warehouseId,
  movementType,
  type,
  search,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  const where = buildMovementWhere({ productId, warehouseId, movementType, type, search });

  const cleanSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const cleanSortOrder = ['asc', 'desc'].includes(String(sortOrder).toLowerCase())
    ? String(sortOrder).toLowerCase()
    : 'desc';

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      skip,
      take: parsedLimit,
      orderBy: { [cleanSortBy]: cleanSortOrder },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        warehouse: true,
        performedByUser: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / parsedLimit) || 1;

  return {
    data: movements.map(formatStockMovement),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
    },
  };
};

const getStockMovementById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Valid Stock Movement ID is required');
  }

  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          category: true,
        },
      },
      warehouse: true,
      performedByUser: true,
    },
  });

  if (!movement) {
    throw ApiError.notFound('Stock movement not found');
  }

  return formatStockMovement(movement);
};

const getStockMovementsByWarehouse = async (warehouseId, query = {}) => {
  if (!warehouseId || typeof warehouseId !== 'string') {
    throw ApiError.badRequest('Valid Warehouse ID is required');
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  return getAllStockMovements({
    ...query,
    warehouseId,
  });
};

const getStockMovementsByProduct = async (productId, query = {}) => {
  if (!productId || typeof productId !== 'string') {
    throw ApiError.badRequest('Valid Product ID is required');
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  return getAllStockMovements({
    ...query,
    productId,
  });
};

module.exports = {
  getAllStockMovements,
  getStockMovementById,
  getStockMovementsByWarehouse,
  getStockMovementsByProduct,
  formatStockMovement,
};

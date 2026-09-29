const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

const VALID_WAREHOUSE_STATUSES = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'];
const ALLOWED_SORT_FIELDS = [
  'name',
  'code',
  'city',
  'state',
  'capacity',
  'staffCount',
  'createdAt',
  'updatedAt',
];

/**
 * Format warehouse object for JSON responses.
 * Calculates currentStock from linked inventory if present.
 */
const formatWarehouse = (wh) => {
  if (!wh) return null;

  let currentStock = 0;
  if (wh.inventory && Array.isArray(wh.inventory)) {
    currentStock = wh.inventory.reduce((sum, item) => sum + (item.currentStock || 0), 0);
  }

  return {
    id: wh.id,
    code: wh.code,
    name: wh.name,
    address: wh.address || null,
    city: wh.city || null,
    state: wh.state || null,
    pincode: wh.pincode || null,
    capacity: wh.capacity !== null && wh.capacity !== undefined ? Number(wh.capacity) : 0,
    currentStock,
    status: wh.status,
    staffCount: wh.staffCount !== null && wh.staffCount !== undefined ? Number(wh.staffCount) : 0,
    managerId: wh.managerId || null,
    managerName: wh.managerName || null,
    managerEmail: wh.managerEmail || null,
    managerPhone: wh.managerPhone || null,
    createdAt: wh.createdAt,
    updatedAt: wh.updatedAt,
    ...(wh.manager && {
      manager: {
        id: wh.manager.id,
        name: wh.manager.name,
        email: wh.manager.email,
        department: wh.manager.department,
      },
    }),
  };
};

/**
 * Warehouse Service
 * Handles business logic, query validations, and database access for Warehouses.
 * Strictly no HTTP response manipulation here.
 */

const getAllWarehouses = async ({
  page = 1,
  limit = 10,
  search,
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
      { code: { contains: q } },
      { city: { contains: q } },
      { state: { contains: q } },
      { managerName: { contains: q } },
    ];
  }

  if (status && typeof status === 'string') {
    const upper = status.trim().toUpperCase();
    if (VALID_WAREHOUSE_STATUSES.includes(upper)) {
      where.status = upper;
    }
  }

  const cleanSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const cleanSortOrder = ['asc', 'desc'].includes(String(sortOrder).toLowerCase())
    ? String(sortOrder).toLowerCase()
    : 'desc';

  const [total, warehouses] = await Promise.all([
    prisma.warehouse.count({ where }),
    prisma.warehouse.findMany({
      where,
      skip,
      take: parsedLimit,
      orderBy: { [cleanSortBy]: cleanSortOrder },
      include: {
        inventory: {
          select: { currentStock: true },
        },
        manager: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / parsedLimit) || 1;

  return {
    data: warehouses.map(formatWarehouse),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
    },
  };
};

const getWarehouseById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Valid Warehouse ID is required');
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      inventory: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
      manager: {
        select: { id: true, name: true, email: true, department: true },
      },
    },
  });

  if (!warehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  return formatWarehouse(warehouse);
};

const createWarehouse = async (payload) => {
  const {
    code,
    name,
    address,
    city,
    state,
    pincode,
    capacity,
    status,
    staffCount,
    managerId,
    managerName,
    managerEmail,
    managerPhone,
  } = payload || {};

  // Required validations
  if (!code || typeof code !== 'string' || !code.trim()) {
    throw ApiError.badRequest('Warehouse code is required and must be a non-empty string');
  }
  const cleanCode = code.trim().toUpperCase();

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('Warehouse name is required and must be a non-empty string');
  }
  const cleanName = name.trim();

  // Enforce unique warehouse code
  const existingCode = await prisma.warehouse.findUnique({
    where: { code: cleanCode },
  });
  if (existingCode) {
    throw ApiError.conflict(`Warehouse with code '${cleanCode}' already exists`);
  }

  // Validate capacity
  let parsedCapacity = 0;
  if (capacity !== undefined && capacity !== null && capacity !== '') {
    parsedCapacity = parseInt(capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity < 0) {
      throw ApiError.badRequest('Capacity must be a valid non-negative integer');
    }
  }

  // Validate staffCount
  let parsedStaffCount = 0;
  if (staffCount !== undefined && staffCount !== null && staffCount !== '') {
    parsedStaffCount = parseInt(staffCount, 10);
    if (isNaN(parsedStaffCount) || parsedStaffCount < 0) {
      throw ApiError.badRequest('Staff count must be a valid non-negative integer');
    }
  }

  // Validate status
  let warehouseStatus = 'ACTIVE';
  if (status) {
    const upper = String(status).trim().toUpperCase();
    if (!VALID_WAREHOUSE_STATUSES.includes(upper)) {
      throw ApiError.badRequest(
        `Invalid warehouse status '${status}'. Allowed values: ${VALID_WAREHOUSE_STATUSES.join(', ')}`
      );
    }
    warehouseStatus = upper;
  }

  // Validate managerId if provided
  let cleanManagerId = null;
  if (managerId && typeof managerId === 'string' && managerId.trim()) {
    cleanManagerId = managerId.trim();
    const managerExists = await prisma.user.findUnique({
      where: { id: cleanManagerId },
    });
    if (!managerExists) {
      throw ApiError.badRequest(`Manager with user ID '${cleanManagerId}' does not exist`);
    }
  }

  const newWarehouse = await prisma.warehouse.create({
    data: {
      code: cleanCode,
      name: cleanName,
      address: typeof address === 'string' ? address.trim() : null,
      city: typeof city === 'string' ? city.trim() : null,
      state: typeof state === 'string' ? state.trim() : null,
      pincode: typeof pincode === 'string' ? pincode.trim() : null,
      capacity: parsedCapacity,
      status: warehouseStatus,
      staffCount: parsedStaffCount,
      managerId: cleanManagerId,
      managerName: typeof managerName === 'string' ? managerName.trim() : null,
      managerEmail: typeof managerEmail === 'string' ? managerEmail.trim() : null,
      managerPhone: typeof managerPhone === 'string' ? managerPhone.trim() : null,
    },
    include: {
      manager: {
        select: { id: true, name: true, email: true, department: true },
      },
    },
  });

  return formatWarehouse(newWarehouse);
};

const updateWarehouse = async (id, payload) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Valid Warehouse ID is required');
  }

  const existingWarehouse = await prisma.warehouse.findUnique({
    where: { id },
  });

  if (!existingWarehouse) {
    throw ApiError.notFound('Warehouse not found');
  }

  const updateData = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || !payload.name.trim()) {
      throw ApiError.badRequest('Warehouse name cannot be empty');
    }
    updateData.name = payload.name.trim();
  }

  if (payload.code !== undefined) {
    if (typeof payload.code !== 'string' || !payload.code.trim()) {
      throw ApiError.badRequest('Warehouse code cannot be empty');
    }
    const cleanCode = payload.code.trim().toUpperCase();
    if (cleanCode !== existingWarehouse.code) {
      const codeConflict = await prisma.warehouse.findUnique({
        where: { code: cleanCode },
      });
      if (codeConflict) {
        throw ApiError.conflict(`Warehouse with code '${cleanCode}' already exists`);
      }
      updateData.code = cleanCode;
    }
  }

  if (payload.capacity !== undefined) {
    const parsedCapacity = parseInt(payload.capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity < 0) {
      throw ApiError.badRequest('Capacity must be a valid non-negative integer');
    }
    updateData.capacity = parsedCapacity;
  }

  if (payload.staffCount !== undefined) {
    const parsedStaff = parseInt(payload.staffCount, 10);
    if (isNaN(parsedStaff) || parsedStaff < 0) {
      throw ApiError.badRequest('Staff count must be a valid non-negative integer');
    }
    updateData.staffCount = parsedStaff;
  }

  if (payload.status !== undefined) {
    const upper = String(payload.status).trim().toUpperCase();
    if (!VALID_WAREHOUSE_STATUSES.includes(upper)) {
      throw ApiError.badRequest(
        `Invalid warehouse status '${payload.status}'. Allowed values: ${VALID_WAREHOUSE_STATUSES.join(', ')}`
      );
    }
    updateData.status = upper;
  }

  if (payload.managerId !== undefined) {
    if (payload.managerId === null || payload.managerId === '') {
      updateData.managerId = null;
    } else {
      const cleanManagerId = String(payload.managerId).trim();
      const managerExists = await prisma.user.findUnique({
        where: { id: cleanManagerId },
      });
      if (!managerExists) {
        throw ApiError.badRequest(`Manager with user ID '${cleanManagerId}' does not exist`);
      }
      updateData.managerId = cleanManagerId;
    }
  }

  if (payload.address !== undefined) {
    updateData.address = typeof payload.address === 'string' ? payload.address.trim() : null;
  }

  if (payload.city !== undefined) {
    updateData.city = typeof payload.city === 'string' ? payload.city.trim() : null;
  }

  if (payload.state !== undefined) {
    updateData.state = typeof payload.state === 'string' ? payload.state.trim() : null;
  }

  if (payload.pincode !== undefined) {
    updateData.pincode = typeof payload.pincode === 'string' ? payload.pincode.trim() : null;
  }

  if (payload.managerName !== undefined) {
    updateData.managerName = typeof payload.managerName === 'string' ? payload.managerName.trim() : null;
  }

  if (payload.managerEmail !== undefined) {
    updateData.managerEmail = typeof payload.managerEmail === 'string' ? payload.managerEmail.trim() : null;
  }

  if (payload.managerPhone !== undefined) {
    updateData.managerPhone = typeof payload.managerPhone === 'string' ? payload.managerPhone.trim() : null;
  }

  const updatedWarehouse = await prisma.warehouse.update({
    where: { id },
    data: updateData,
    include: {
      inventory: {
        select: { currentStock: true },
      },
      manager: {
        select: { id: true, name: true, email: true, department: true },
      },
    },
  });

  return formatWarehouse(updatedWarehouse);
};

const updateWarehouseStatus = async (id, status) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Valid Warehouse ID is required');
  }

  if (!status) {
    throw ApiError.badRequest('Status is required');
  }

  const upper = String(status).trim().toUpperCase();
  if (!VALID_WAREHOUSE_STATUSES.includes(upper)) {
    throw ApiError.badRequest(
      `Invalid warehouse status '${status}'. Allowed values: ${VALID_WAREHOUSE_STATUSES.join(', ')}`
    );
  }

  const existing = await prisma.warehouse.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Warehouse not found');
  }

  const updated = await prisma.warehouse.update({
    where: { id },
    data: { status: upper },
    include: {
      inventory: {
        select: { currentStock: true },
      },
      manager: {
        select: { id: true, name: true, email: true, department: true },
      },
    },
  });

  return formatWarehouse(updated);
};

module.exports = {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  updateWarehouseStatus,
  VALID_WAREHOUSE_STATUSES,
  ALLOWED_SORT_FIELDS,
};

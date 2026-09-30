const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const auditLogService = require('./auditLogService');

const VALID_USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const VALID_ROLE_NAMES = [
  'ADMIN',
  'INVENTORY_MANAGER',
  'WAREHOUSE_MANAGER',
  'PROCUREMENT_MANAGER',
  'SALES_MANAGER',
  'STAFF',
];

const ALLOWED_SORT_FIELDS = ['name', 'email', 'department', 'status', 'createdAt', 'updatedAt'];

/**
 * Format user for public API responses.
 * Never leaks passwordHash.
 */
const formatUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department || null,
    status: user.status,
    roleId: user.roleId,
    role: user.role?.name || null,
    roleDescription: user.role?.description || null,
    lastLogin: user.lastLogin || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Resolve roleId from either RoleName string or raw roleId.
 */
const resolveRole = async (roleInput) => {
  if (!roleInput || typeof roleInput !== 'string') {
    throw ApiError.badRequest('Role is required');
  }

  const clean = roleInput.trim();
  const upper = clean.toUpperCase();

  // Try finding by RoleName if valid enum
  if (VALID_ROLE_NAMES.includes(upper)) {
    const byName = await prisma.role.findUnique({
      where: { name: upper },
    });
    if (byName) return byName;
  }

  // Try finding by role ID (cuid / string)
  const byId = await prisma.role.findUnique({
    where: { id: clean },
  });
  if (byId) return byId;

  throw ApiError.badRequest(
    `Invalid role "${roleInput}". Allowed roles: ${VALID_ROLE_NAMES.join(', ')}`
  );
};

/**
 * List all available system roles.
 */
const getAllRoles = async () => {
  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
  });
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || null,
  }));
};

/**
 * List users with pagination, search, role & status filters, and sorting.
 */
const getAllUsers = async ({
  page = 1,
  limit = 10,
  search,
  role,
  status,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (status && typeof status === 'string' && status.trim().toUpperCase() !== 'ALL') {
    const norm = status.trim().toUpperCase();
    if (!VALID_USER_STATUSES.includes(norm)) {
      throw ApiError.badRequest(`Invalid status filter. Allowed values: ${VALID_USER_STATUSES.join(', ')}`);
    }
    where.status = norm;
  }

  if (role && typeof role === 'string' && role.trim().toUpperCase() !== 'ALL') {
    const norm = role.trim().toUpperCase();
    where.role = { name: norm };
  }

  if (search && typeof search === 'string' && search.trim()) {
    const query = search.trim();
    where.OR = [
      { name: { contains: query } },
      { email: { contains: query } },
      { department: { contains: query } },
    ];
  }

  const cleanSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const cleanSortOrder = String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [cleanSortBy]: cleanSortOrder },
      include: {
        role: true,
      },
    }),
  ]);

  return {
    data: users.map(formatUser),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

/**
 * Get user by ID.
 */
const getUserById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('User ID is required');
  }

  const user = await prisma.user.findUnique({
    where: { id: id.trim() },
    include: { role: true },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return formatUser(user);
};

/**
 * Create a new user.
 */
const createUser = async (data) => {
  if (!data || typeof data !== 'object') {
    throw ApiError.badRequest('Request body must be an object');
  }

  const { name, email, department, role, roleId, status = 'ACTIVE' } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('User full name is required');
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    throw ApiError.badRequest('User email is required');
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw ApiError.badRequest('Invalid email address format');
  }

  // Check unique email
  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });
  if (existing) {
    throw ApiError.conflict(`A user account with email "${cleanEmail}" already exists`);
  }

  // Resolve role
  const resolvedRole = await resolveRole(role || roleId);

  // Validate status
  let normalizedStatus = 'ACTIVE';
  if (status) {
    normalizedStatus = String(status).trim().toUpperCase();
    if (!VALID_USER_STATUSES.includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid user status. Allowed values: ${VALID_USER_STATUSES.join(', ')}`
      );
    }
  }

  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: cleanEmail,
      department: department && typeof department === 'string' ? department.trim() : null,
      roleId: resolvedRole.id,
      status: normalizedStatus,
    },
    include: { role: true },
  });

  // Audit log
  await auditLogService.logEvent({
    action: 'CREATE',
    module: 'USER',
    entity: 'User',
    entityId: newUser.id,
    description: `Created new user account "${newUser.name}" (${newUser.email}) with role ${resolvedRole.name}`,
    severity: 'INFO',
  });

  return formatUser(newUser);
};

/**
 * Update an existing user.
 */
const updateUser = async (id, data) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('User ID is required');
  }

  const cleanId = id.trim();
  const existingUser = await prisma.user.findUnique({
    where: { id: cleanId },
    include: { role: true },
  });

  if (!existingUser) {
    throw ApiError.notFound('User not found');
  }

  const { name, email, department, role, roleId, status } = data;
  const updateData = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      throw ApiError.badRequest('User name cannot be empty');
    }
    updateData.name = name.trim();
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !email.trim()) {
      throw ApiError.badRequest('User email cannot be empty');
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw ApiError.badRequest('Invalid email address format');
    }
    if (cleanEmail !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (emailInUse) {
        throw ApiError.conflict(`A user with email "${cleanEmail}" already exists`);
      }
      updateData.email = cleanEmail;
    }
  }

  if (department !== undefined) {
    updateData.department = department ? String(department).trim() : null;
  }

  if (role !== undefined || roleId !== undefined) {
    const resolvedRole = await resolveRole(role || roleId);
    updateData.roleId = resolvedRole.id;
  }

  if (status !== undefined) {
    const normalizedStatus = String(status).trim().toUpperCase();
    if (!VALID_USER_STATUSES.includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Invalid user status. Allowed values: ${VALID_USER_STATUSES.join(', ')}`
      );
    }
    updateData.status = normalizedStatus;
  }

  const updatedUser = await prisma.user.update({
    where: { id: cleanId },
    data: updateData,
    include: { role: true },
  });

  // Audit log
  await auditLogService.logEvent({
    action: 'UPDATE',
    module: 'USER',
    entity: 'User',
    entityId: updatedUser.id,
    description: `Updated profile details for user "${updatedUser.name}" (${updatedUser.email})`,
    severity: 'INFO',
  });

  return formatUser(updatedUser);
};

/**
 * Update user status (ACTIVE / INACTIVE / SUSPENDED).
 */
const updateUserStatus = async (id, status) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('User ID is required');
  }

  if (!status || typeof status !== 'string') {
    throw ApiError.badRequest('Status is required');
  }

  const cleanId = id.trim();
  const normalizedStatus = status.trim().toUpperCase();

  if (!VALID_USER_STATUSES.includes(normalizedStatus)) {
    throw ApiError.badRequest(
      `Invalid user status. Allowed values: ${VALID_USER_STATUSES.join(', ')}`
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id: cleanId },
  });

  if (!existing) {
    throw ApiError.notFound('User not found');
  }

  const updated = await prisma.user.update({
    where: { id: cleanId },
    data: { status: normalizedStatus },
    include: { role: true },
  });

  // Audit log
  await auditLogService.logEvent({
    action: 'STATUS_CHANGE',
    module: 'USER',
    entity: 'User',
    entityId: updated.id,
    description: `Changed user status for "${updated.name}" from ${existing.status} to ${normalizedStatus}`,
    severity: normalizedStatus === 'SUSPENDED' ? 'WARNING' : 'INFO',
  });

  return formatUser(updated);
};

module.exports = {
  getAllRoles,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  formatUser,
};

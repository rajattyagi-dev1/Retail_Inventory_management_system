const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

const VALID_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'STATUS_CHANGE',
  'STOCK_ADJUSTMENT',
  'APPROVAL',
  'LOGIN',
];

const VALID_MODULES = [
  'PRODUCT',
  'WAREHOUSE',
  'INVENTORY',
  'SUPPLIER',
  'PURCHASE_ORDER',
  'ORDER',
  'USER',
  'SYSTEM',
];

const VALID_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL', 'SUCCESS'];

/**
 * Format audit log record for JSON responses.
 */
const formatAuditLog = (log) => {
  if (!log) return null;
  return {
    id: log.id,
    userId: log.userId || null,
    userName: log.userName || log.user?.name || 'System / Automated',
    userRole: log.userRole || log.user?.role?.name || 'SYSTEM',
    action: log.action,
    module: log.module,
    entity: log.entity,
    entityId: log.entityId,
    description: log.description,
    severity: log.severity,
    ipAddress: log.ipAddress || null,
    createdAt: log.createdAt,
    timestamp: log.createdAt ? log.createdAt.toISOString() : null,
  };
};

/**
 * Create an audit log entry.
 * Can be called standalone or passed an active Prisma transaction client (`tx`).
 */
const logEvent = async ({
  action,
  module,
  entity,
  entityId,
  description,
  severity = 'INFO',
  userId = null,
  userName = null,
  userRole = null,
  ipAddress = null,
}, tx = null) => {
  try {
    const client = tx || prisma;

    const normalizedAction = VALID_ACTIONS.includes(action) ? action : 'UPDATE';
    const normalizedModule = VALID_MODULES.includes(module) ? module : 'SYSTEM';
    const normalizedSeverity = VALID_SEVERITIES.includes(severity) ? severity : 'INFO';

    return await client.auditLog.create({
      data: {
        action: normalizedAction,
        module: normalizedModule,
        entity: String(entity || 'Unknown').slice(0, 100),
        entityId: String(entityId || 'N/A').slice(0, 100),
        description: String(description || '').trim(),
        severity: normalizedSeverity,
        userId: userId || null,
        userName: userName || null,
        userRole: userRole || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    // Audit logging failure should not crash primary operations
    console.error('Failed to log audit event:', err.message);
    return null;
  }
};

/**
 * Get paginated audit logs with search, filtering, and sorting.
 */
const getAllAuditLogs = async ({
  page = 1,
  limit = 10,
  search,
  module,
  action,
  severity,
  userId,
  startDate,
  endDate,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (module && typeof module === 'string' && module.trim().toUpperCase() !== 'ALL') {
    const norm = module.trim().toUpperCase();
    if (!VALID_MODULES.includes(norm)) {
      throw ApiError.badRequest(`Invalid module filter. Allowed values: ${VALID_MODULES.join(', ')}`);
    }
    where.module = norm;
  }

  if (action && typeof action === 'string' && action.trim().toUpperCase() !== 'ALL') {
    const norm = action.trim().toUpperCase();
    if (!VALID_ACTIONS.includes(norm)) {
      throw ApiError.badRequest(`Invalid action filter. Allowed values: ${VALID_ACTIONS.join(', ')}`);
    }
    where.action = norm;
  }

  if (severity && typeof severity === 'string' && severity.trim().toUpperCase() !== 'ALL') {
    const norm = severity.trim().toUpperCase();
    if (!VALID_SEVERITIES.includes(norm)) {
      throw ApiError.badRequest(`Invalid severity filter. Allowed values: ${VALID_SEVERITIES.join(', ')}`);
    }
    where.severity = norm;
  }

  if (userId && typeof userId === 'string' && userId.trim()) {
    where.userId = userId.trim();
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const query = search.trim();
    where.OR = [
      { description: { contains: query } },
      { entity: { contains: query } },
      { entityId: { contains: query } },
      { userName: { contains: query } },
      { userRole: { contains: query } },
    ];
  }

  const cleanSortBy = ['createdAt', 'action', 'module', 'severity'].includes(sortBy)
    ? sortBy
    : 'createdAt';
  const cleanSortOrder = String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [cleanSortBy]: cleanSortOrder },
      include: {
        user: {
          include: { role: true },
        },
      },
    }),
  ]);

  return {
    data: logs.map(formatAuditLog),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

/**
 * Get audit log details by ID.
 */
const getAuditLogById = async (id) => {
  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Audit log ID is required');
  }

  const log = await prisma.auditLog.findUnique({
    where: { id: id.trim() },
    include: {
      user: {
        include: { role: true },
      },
    },
  });

  if (!log) {
    throw ApiError.notFound('Audit log record not found');
  }

  return formatAuditLog(log);
};

module.exports = {
  logEvent,
  getAllAuditLogs,
  getAuditLogById,
  formatAuditLog,
};

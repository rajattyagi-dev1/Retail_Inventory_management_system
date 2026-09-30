const auditLogService = require('../services/auditLogService');

/**
 * Audit Log Controller
 * Handles HTTP requests and responses for system audit logs.
 */

const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      module,
      action,
      severity,
      userId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await auditLogService.getAllAuditLogs({
      page,
      limit,
      search,
      module,
      action,
      severity,
      userId,
      startDate,
      endDate,
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

const getAuditLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await auditLogService.getAuditLogById(id);
    return res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLog,
};

const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

/**
 * Audit Log Routes
 * Maps audit logging endpoints.
 */

router.get('/', auditLogController.getAuditLogs);
router.get('/:id', auditLogController.getAuditLog);

module.exports = router;

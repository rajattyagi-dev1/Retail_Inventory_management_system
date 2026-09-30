const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

/**
 * Audit Log Routes
 * Protected: Requires authentication and ADMIN role.
 */

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/', auditLogController.getAuditLogs);
router.get('/:id', auditLogController.getAuditLog);

module.exports = router;

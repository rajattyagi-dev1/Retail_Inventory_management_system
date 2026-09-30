const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/rbacMiddleware');

/**
 * Admin Console Routes
 * Protected: Requires authentication and ADMIN role.
 */

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/dashboard', reportController.getDashboardReport);

module.exports = router;

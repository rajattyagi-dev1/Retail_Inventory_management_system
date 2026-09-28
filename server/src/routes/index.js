const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');

// Mount module routes
router.use('/health', healthRoutes);

module.exports = router;

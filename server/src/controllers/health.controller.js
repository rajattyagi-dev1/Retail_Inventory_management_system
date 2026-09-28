const healthService = require('../services/health.service');

/**
 * Health Controller
 * Handles HTTP requests and responses for health checks.
 */
const checkHealth = (req, res, next) => {
  try {
    const healthData = healthService.getHealthStatus();
    return res.status(200).json(healthData);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  checkHealth,
};

const healthService = require('../services/healthService');

/**
 * Health Controller
 * Orchestrates request/response handling for health verification.
 * Does NOT contain database queries or business logic.
 */
const getHealth = async (req, res, next) => {
  try {
    const healthStatus = await healthService.checkHealth();

    return res.status(200).json({
      success: true,
      message: 'Retail Inventory API is healthy',
      database: healthStatus.database,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Retail Inventory API health check failed',
      database: 'disconnected',
    });
  }
};

module.exports = {
  getHealth,
};

/**
 * Health Service
 * Handles business logic for application health verification.
 */
const getHealthStatus = () => {
  return {
    success: true,
    message: 'Retail Inventory Management API is running',
  };
};

module.exports = {
  getHealthStatus,
};

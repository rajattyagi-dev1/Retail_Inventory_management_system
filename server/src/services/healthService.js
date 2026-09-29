const prisma = require('../config/prisma');

/**
 * Health Service
 * Executes a lightweight Prisma query to verify MySQL database connectivity.
 * Pure business logic layer — does NOT contain HTTP response handling.
 */
const checkHealth = async () => {
  // Execute a lightweight query to verify active database connectivity
  await prisma.$queryRaw`SELECT 1`;

  return {
    database: 'connected',
  };
};

module.exports = {
  checkHealth,
};

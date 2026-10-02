const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

const { seedDefaultUsers } = require('./services/authService');

const server = app.listen(PORT, () => {
  console.log(`Retail Inventory Management API server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  seedDefaultUsers()
    .then(() => console.log('Default security roles and operator accounts initialized.'))
    .catch((err) => console.error('Failed to initialize default auth accounts:', err.message));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = server;

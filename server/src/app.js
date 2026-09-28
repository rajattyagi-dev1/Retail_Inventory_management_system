const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Enable CORS
app.use(cors());

// Enable JSON and URL-encoded request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API Routes
app.use('/api', apiRoutes);

// Fallback 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;

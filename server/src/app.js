const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Configure CORS using CLIENT_URL from environment
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Configure JSON request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API Routes (/api/health, /api/categories, /api/products)
app.use('/api', apiRoutes);

// Fallback 404 handler for undefined routes
app.use(notFoundHandler);

// Register Centralized Error Handler
app.use(errorHandler);

module.exports = app;

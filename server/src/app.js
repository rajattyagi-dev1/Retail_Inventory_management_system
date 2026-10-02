const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded from server/.env regardless of working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Configure CORS for frontend client
const corsOptions = {
  origin: [
    clientUrl,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
};

// Register CORS middleware BEFORE API routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Configure JSON request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API Routes (/api/health, /api/auth, /api/products, etc.)
app.use('/api', apiRoutes);

// Fallback 404 handler for undefined routes
app.use(notFoundHandler);

// Register Centralized Error Handler
app.use(errorHandler);

module.exports = app;

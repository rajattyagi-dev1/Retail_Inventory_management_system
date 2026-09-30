const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { verifyToken } = require('../services/authService');

/**
 * JWT Authentication Middleware.
 * Validates Bearer token, verifies JWT signature, checks active account status,
 * and attaches sanitized user object to req.user.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return next(ApiError.unauthorized('Authentication token is required'));
    }

    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
      return next(ApiError.unauthorized('Invalid authorization header format. Expected "Bearer <token>"'));
    }

    const token = parts[1];

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Authentication token has expired'));
      }
      return next(ApiError.unauthorized('Invalid authentication token'));
    }

    if (!decoded || !decoded.userId) {
      return next(ApiError.unauthorized('Invalid token payload'));
    }

    // Lookup user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user) {
      return next(ApiError.unauthorized('Authenticated user account no longer exists'));
    }

    if (user.status === 'INACTIVE') {
      return next(ApiError.unauthorized('Account is inactive. Access denied.'));
    }

    if (user.status === 'SUSPENDED') {
      return next(ApiError.unauthorized('Account is suspended. Access denied.'));
    }

    // Attach sanitized user context to request (NO credentials)
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department || null,
      role: user.role?.name || null,
      roleId: user.roleId,
      status: user.status,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  authenticateToken,
};

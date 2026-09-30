const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const auditLogService = require('./auditLogService');

const JWT_SECRET = process.env.JWT_SECRET || 'retail_inventory_jwt_secret_dev_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password.
 */
const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw ApiError.badRequest('Password must be a valid non-empty string');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare plaintext password with stored hash.
 */
const comparePassword = async (plainPassword, hash) => {
  if (!plainPassword || !hash) return false;
  return await bcrypt.compare(plainPassword, hash);
};

/**
 * Generate signed JWT token.
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify JWT token.
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Format user for public response (NEVER includes passwordHash).
 */
const formatAuthUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department || null,
    role: user.role?.name || null,
    status: user.status,
    lastLogin: user.lastLogin || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Authenticate user credentials and return JWT with sanitized user profile.
 */
const login = async ({ email, password }) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    throw ApiError.badRequest('Email is required');
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    throw ApiError.badRequest('Password is required');
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw ApiError.badRequest('Invalid email address format');
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: { role: true },
  });

  // Generic credential error to avoid email enumeration
  if (!user || !user.passwordHash) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Compare password hash
  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check account status
  if (user.status === 'INACTIVE') {
    throw ApiError.unauthorized('Account is inactive. Please contact your system administrator.');
  }

  if (user.status === 'SUSPENDED') {
    throw ApiError.unauthorized('Account is suspended. Please contact your system administrator.');
  }

  // Update last login timestamp
  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: now },
  });
  user.lastLogin = now;

  // Log audit event
  await auditLogService.logEvent({
    action: 'LOGIN',
    module: 'USER',
    entity: 'User',
    entityId: user.id,
    userId: user.id,
    userName: user.name,
    userRole: user.role.name,
    description: `User "${user.name}" (${user.email}) logged in successfully`,
    severity: 'INFO',
  });

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role.name,
  });

  return {
    user: formatAuthUser(user),
    token,
  };
};

/**
 * Seed default development users for all roles if they do not exist.
 */
const seedDefaultUsers = async () => {
  const defaultPassword = 'Password123!';
  const defaultHash = await hashPassword(defaultPassword);

  const defaultAccounts = [
    {
      name: 'System Administrator',
      email: 'admin@retailflow.com',
      roleName: 'ADMIN',
      department: 'Executive IT & Governance',
    },
    {
      name: 'Inventory Controller',
      email: 'inventory@retailflow.com',
      roleName: 'INVENTORY_MANAGER',
      department: 'Inventory Management',
    },
    {
      name: 'Hub Logistics Director',
      email: 'warehouse@retailflow.com',
      roleName: 'WAREHOUSE_MANAGER',
      department: 'Warehouse Operations',
    },
    {
      name: 'Procurement Specialist',
      email: 'procurement@retailflow.com',
      roleName: 'PROCUREMENT_MANAGER',
      department: 'Supply Chain & Sourcing',
    },
    {
      name: 'Sales Operations Manager',
      email: 'sales@retailflow.com',
      roleName: 'SALES_MANAGER',
      department: 'Retail Fulfillment & Sales',
    },
    {
      name: 'Warehouse Operations Staff',
      email: 'staff@retailflow.com',
      roleName: 'STAFF',
      department: 'Warehouse Dock Operations',
    },
  ];

  for (const account of defaultAccounts) {
    const role = await prisma.role.findUnique({
      where: { name: account.roleName },
    });
    if (!role) continue;

    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        passwordHash: defaultHash,
        status: 'ACTIVE',
        roleId: role.id,
      },
      create: {
        name: account.name,
        email: account.email,
        passwordHash: defaultHash,
        department: account.department,
        status: 'ACTIVE',
        roleId: role.id,
      },
    });
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  login,
  formatAuthUser,
  seedDefaultUsers,
};

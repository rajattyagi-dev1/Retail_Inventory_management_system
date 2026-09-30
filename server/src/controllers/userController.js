const userService = require('../services/userService');

/**
 * User Controller
 * Handles HTTP requests and responses for Operator & User Management.
 */

const getUsers = async (req, res, next) => {
  try {
    const { page, limit, search, role, status, sortBy, sortOrder } = req.query;
    const result = await userService.getAllUsers({
      page,
      limit,
      search,
      role,
      status,
      sortBy,
      sortOrder,
    });
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const roles = await userService.getAllRoles();
    return res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    return next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await userService.updateUserStatus(id, status);
    return res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  getRoles,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
};

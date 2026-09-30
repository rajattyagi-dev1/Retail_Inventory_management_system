const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * User Management Routes
 */

router.get('/', userController.getUsers);
router.get('/roles', userController.getRoles);
router.get('/:id', userController.getUser);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id/status', userController.updateUserStatus);

module.exports = router;

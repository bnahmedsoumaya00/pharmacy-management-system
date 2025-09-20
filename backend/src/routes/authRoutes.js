const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');

const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange
} = require('../middleware/validation');

const { authenticateToken } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes (authentication required)
router.use(authenticateToken); // Apply authentication to all routes below

router.get('/profile', getProfile);
router.put('/profile', validateProfileUpdate, updateProfile);
router.put('/change-password', validatePasswordChange, changePassword);
router.post('/logout', logout);

module.exports = router;
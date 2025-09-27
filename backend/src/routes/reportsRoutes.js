const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Reports routes
router.get('/inventory', 
  authenticateToken, 
  authorizeRoles('admin', 'pharmacist'), 
  reportsController.getInventoryReport
);

module.exports = router;
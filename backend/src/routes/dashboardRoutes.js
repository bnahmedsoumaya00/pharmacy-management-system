const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Dashboard overview (all authenticated users)
router.get('/overview', DashboardController.getOverview);

// System alerts and notifications
router.get('/alerts', DashboardController.getAlerts);

// Chart data for dashboard widgets
router.get('/charts', DashboardController.getChartData);

module.exports = router;
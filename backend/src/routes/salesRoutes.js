const express = require('express');
const router = express.Router();
const SalesController = require('../controllers/salesController');
const { ValidatorFactory } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Public routes (all authenticated users can access)
router.get('/', SalesController.getAllSales);                          // GET /api/sales
router.get('/today', SalesController.getTodaySales);                   // GET /api/sales/today
router.get('/stats', SalesController.getSalesStats);                  // GET /api/sales/stats
router.get('/report', SalesController.getSalesReport);                // GET /api/sales/report
router.get('/:id', SalesController.getSaleById);                      // GET /api/sales/:id
router.get('/:id/receipt', SalesController.getSaleReceipt);           // GET /api/sales/:id/receipt

// Cashier, Pharmacist and Admin routes (can create sales)
router.post('/',
  authorizeRoles('admin', 'pharmacist', 'cashier'),
  ValidatorFactory.getValidator('sales', 'create'),
  SalesController.createSale
);                                                                      // POST /api/sales

// Pharmacist and Admin routes (can process refunds)
router.post('/:id/refund',
  authorizeRoles('admin', 'pharmacist'),
  ValidatorFactory.getValidator('sales', 'refund'),
  SalesController.processSaleRefund
);                                                                      // POST /api/sales/:id/refund

// Admin only routes (can update/delete sales)
router.put('/:id',
  authorizeRoles('admin'),
  ValidatorFactory.getValidator('sales', 'update'),
  SalesController.updateSale
);                                                                      // PUT /api/sales/:id

router.delete('/:id',
  authorizeRoles('admin'),
  SalesController.deleteSale
);                                                                      // DELETE /api/sales/:id

module.exports = router;
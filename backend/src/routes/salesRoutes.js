const express = require('express');
const router = express.Router();
const SalesController = require('../controllers/SalesController');
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
const SalesService = require('../services/SalesService');
const { validationResult } = require('express-validator');

class SalesController {
  constructor() {
    this.salesService = new SalesService();
  }

  // Get all sales
  getAllSales = async (req, res) => {
    try {
      const sales = await this.salesService.getAllSales();
      res.json({
        success: true,
        data: sales
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sales',
        error: error.message
      });
    }
  };

  // Create new sale
  createSale = async (req, res) => {
    try {
      const sale = await this.salesService.createSale(req.body);
      res.status(201).json({
        success: true,
        message: 'Sale created successfully',
        data: sale
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create sale',
        error: error.message
      });
    }
  };

  // Get sale by ID
  getSaleById = async (req, res) => {
    try {
      const { id } = req.params;
      const sale = await this.salesService.getSaleById(id);
      
      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'Sale not found'
        });
      }

      res.json({
        success: true,
        data: sale
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sale',
        error: error.message
      });
    }
  };
}

module.exports = new SalesController();
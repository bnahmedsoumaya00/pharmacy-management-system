const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const {
  validateMedicine,
  validateStockAdjustment,
  validateBulkStatusUpdate
} = require('../middleware/validation');
const { 
  authenticateToken, 
  authorizeRoles 
} = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Public routes (all authenticated users can access)
router.get('/', medicineController.getAllMedicines);                    // GET /api/medicines
router.get('/search', medicineController.searchMedicines);              // GET /api/medicines/search?q=term
router.get('/stats', medicineController.getMedicineStats);              // GET /api/medicines/stats
router.get('/low-stock', medicineController.getLowStockMedicines);      // GET /api/medicines/low-stock
router.get('/expiring', medicineController.getExpiringMedicines);       // GET /api/medicines/expiring
router.get('/top-by-value', medicineController.getTopMedicinesByValue); // GET /api/medicines/top-by-value
router.get('/highest-margins', medicineController.getHighestProfitMargins); // GET /api/medicines/highest-margins

// ✅ MOVE BULK-STATUS ROUTES BEFORE /:id
router.put('/bulk-status', 
  authorizeRoles('admin', 'pharmacist'),
  validateBulkStatusUpdate,
  medicineController.bulkUpdateStatus
);

// This must come AFTER ALL specific routes (including bulk-status)
router.get('/:id', medicineController.getMedicineById);                 // GET /api/medicines/:id

// Pharmacist and Admin only routes
router.post('/', 
  authorizeRoles('admin', 'pharmacist'),
  validateMedicine, 
  medicineController.createMedicine
);                                                                      // POST /api/medicines

router.put('/:id', 
  authorizeRoles('admin', 'pharmacist'),
  validateMedicine, 
  medicineController.updateMedicine
);                                                                      // PUT /api/medicines/:id

router.post('/:id/adjust-stock', 
  authorizeRoles('admin', 'pharmacist'),
  validateStockAdjustment, 
  medicineController.adjustStock
);                                                                      // POST /api/medicines/:id/adjust-stock

// Admin only routes
router.delete('/:id', 
  authorizeRoles('admin'),
  medicineController.deleteMedicine
);                                                                      // DELETE /api/medicines/:id

module.exports = router;
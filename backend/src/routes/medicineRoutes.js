const express = require('express');
const router = express.Router();

const {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getLowStockMedicines,
  getExpiringMedicines,
  getInventoryStats,
  adjustStock
} = require('../controllers/medicineController');

const {
  validateMedicine,
  validateStockAdjustment
} = require('../middleware/validation');

const { 
  authenticateToken, 
  authorizeRoles 
} = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Public routes (all authenticated users can access)
router.get('/', getAllMedicines);                    // GET /api/medicines
router.get('/stats', getInventoryStats);             // GET /api/medicines/stats
router.get('/low-stock', getLowStockMedicines);      // GET /api/medicines/low-stock
router.get('/expiring', getExpiringMedicines);       // GET /api/medicines/expiring
router.get('/:id', getMedicineById);                 // GET /api/medicines/:id

// Pharmacist and Admin only routes
router.post('/', 
  authorizeRoles('admin', 'pharmacist'),
  validateMedicine, 
  createMedicine
);                                                   // POST /api/medicines

router.put('/:id', 
  authorizeRoles('admin', 'pharmacist'),
  validateMedicine, 
  updateMedicine
);                                                   // PUT /api/medicines/:id

router.post('/:id/adjust-stock', 
  authorizeRoles('admin', 'pharmacist'),
  validateStockAdjustment, 
  adjustStock
);                                                   // POST /api/medicines/:id/adjust-stock

// Admin only routes
router.delete('/:id', 
  authorizeRoles('admin'),
  deleteMedicine
);                                                   // DELETE /api/medicines/:id

module.exports = router;
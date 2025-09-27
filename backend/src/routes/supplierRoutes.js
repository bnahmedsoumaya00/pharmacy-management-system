const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/SupplierController');
const { ValidatorFactory } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Public routes (all authenticated users can access)
router.get('/', supplierController.getAllSuppliers);                    // GET /api/suppliers
router.get('/stats', supplierController.getSupplierStats);             // GET /api/suppliers/stats
router.get('/top-rated', supplierController.getTopRatedSuppliers);     // GET /api/suppliers/top-rated
router.get('/search', supplierController.searchSuppliers);             // GET /api/suppliers/search
router.get('/:id', supplierController.getSupplierById);                // GET /api/suppliers/:id
router.get('/:id/performance', supplierController.getSupplierPerformance); // GET /api/suppliers/:id/performance

// Admin and Pharmacist routes (can manage suppliers)
router.post('/',
  authorizeRoles('admin', 'pharmacist'),
  ValidatorFactory.getValidator('supplier', 'create'),
  supplierController.createSupplier
);                                                                      // POST /api/suppliers

router.put('/:id',
  authorizeRoles('admin', 'pharmacist'),
  ValidatorFactory.getValidator('supplier', 'update'),
  supplierController.updateSupplier
);                                                                      // PUT /api/suppliers/:id

router.put('/:id/rating',
  authorizeRoles('admin', 'pharmacist'),
  ValidatorFactory.getValidator('supplier', 'rating'),
  supplierController.updateSupplierRating
);                                                                      // PUT /api/suppliers/:id/rating

router.put('/:id/status',
  authorizeRoles('admin', 'pharmacist'),
  ValidatorFactory.getValidator('supplier', 'status'),
  supplierController.toggleSupplierStatus
);                                                                      // PUT /api/suppliers/:id/status

// Admin only routes
router.delete('/:id',
  authorizeRoles('admin'),
  supplierController.deleteSupplier
);                                                                      // DELETE /api/suppliers/:id

module.exports = router;
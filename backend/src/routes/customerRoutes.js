const express = require('express');
const router = express.Router();

const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
  getCustomerStats
} = require('../controllers/customerController');

const { validateCustomer } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Public routes (all authenticated users can access)
router.get('/', getAllCustomers);                        // GET /api/customers
router.get('/stats', getCustomerStats);                  // GET /api/customers/stats
router.get('/:id', getCustomerById);                     // GET /api/customers/:id
router.get('/:id/history', getCustomerHistory);         // GET /api/customers/:id/history

// Pharmacist and Admin routes (can create and update customers)
router.post('/', 
  authorizeRoles('admin', 'pharmacist', 'cashier'),
  validateCustomer, 
  createCustomer
);                                                       // POST /api/customers

router.put('/:id', 
  authorizeRoles('admin', 'pharmacist', 'cashier'),
  validateCustomer, 
  updateCustomer
);                                                       // PUT /api/customers/:id

// Admin only routes
router.delete('/:id', 
  authorizeRoles('admin'),
  deleteCustomer
);                                                       // DELETE /api/customers/:id

module.exports = router;
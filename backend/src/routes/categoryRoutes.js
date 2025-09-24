const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/CategoryController');
const { validateCategory } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Public routes (all authenticated users can access)
router.get('/', categoryController.getAllCategories);          // GET /api/categories
router.get('/stats', categoryController.getCategoryStats);     // GET /api/categories/stats
router.get('/search', categoryController.searchCategories);    // GET /api/categories/search
router.get('/:id', categoryController.getCategoryById);        // GET /api/categories/:id

// Admin and Pharmacist routes (can manage categories)
router.post('/',
  authorizeRoles('admin', 'pharmacist'),
  validateCategory,
  categoryController.createCategory
);                                                             // POST /api/categories

router.put('/:id',
  authorizeRoles('admin', 'pharmacist'),
  validateCategory,
  categoryController.updateCategory
);                                                             // PUT /api/categories/:id

// Admin only routes
router.delete('/:id',
  authorizeRoles('admin'),
  categoryController.deleteCategory
);                                                             // DELETE /api/categories/:id

module.exports = router;
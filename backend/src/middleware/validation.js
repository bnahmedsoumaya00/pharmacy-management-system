const { body } = require('express-validator');

// Registration validation
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
    
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\u00C0-\u017F]+$/)
    .withMessage('Full name can only contain letters and spaces'),
    
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$|^\+216-?\d{8}$/)
    .withMessage('Please provide a valid phone number (international format or Tunisian format: +216-12345678)'),
    
  body('role')
    .optional()
    .isIn(['admin', 'pharmacist', 'cashier'])
    .withMessage('Role must be admin, pharmacist, or cashier')
];

// Login validation
const validateLogin = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Profile update validation
const validateProfileUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\u00C0-\u017F]+$/)
    .withMessage('Full name can only contain letters and spaces'),
    
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$|^\+216-?\d{8}$/)
    .withMessage('Please provide a valid phone number (international format or Tunisian format: +216-12345678)'),
    
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New password confirmation does not match new password');
      }
      return true;
    })
];

// User creation validation (for admin)
const validateUserCreation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\u00C0-\u017F]+$/)
    .withMessage('Full name can only contain letters and spaces'),
    
    body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$|^\+216-?\d{8}$/)
    .withMessage('Please provide a valid phone number (international format or Tunisian format: +216-12345678)'),
    
  body('role')
    .isIn(['admin', 'pharmacist', 'cashier'])
    .withMessage('Role must be admin, pharmacist, or cashier')
];

// Medicine validation
const validateMedicine = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Medicine name must be between 2 and 200 characters')
    .notEmpty()
    .withMessage('Medicine name is required'),
    
  body('genericName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Generic name cannot exceed 200 characters'),
    
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Brand name cannot exceed 100 characters'),
    
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer'),
    
  body('supplierId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a valid integer'),
    
  body('batchNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Batch number cannot exceed 50 characters'),
    
  body('barcode')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Barcode cannot exceed 100 characters'),
    
  body('description')
    .optional()
    .trim(),
    
  body('dosage')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dosage cannot exceed 100 characters'),
    
  body('unit')
    .isIn(['piece', 'bottle', 'box', 'tube', 'vial', 'pack', 'strip', 'ml', 'mg', 'g'])
    .withMessage('Unit must be a valid measurement unit'),
    
  body('purchasePrice')
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),
    
  body('sellingPrice')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
    
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
    
  body('minStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
    
  body('maxStockLevel')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum stock level must be at least 1'),
    
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
    
  body('manufactureDate')
    .optional()
    .isISO8601()
    .withMessage('Manufacture date must be a valid date'),
    
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
    
  body('isPrescriptionRequired')
    .optional()
    .isBoolean()
    .withMessage('Prescription required must be true or false')
];

// Stock adjustment validation
const validateStockAdjustment = [
  body('adjustment')
    .isInt()
    .withMessage('Adjustment must be an integer (positive or negative)'),
    
  body('reason')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Reason must be between 3 and 255 characters')
];

// Customer validation
const validateCustomer = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .isAlpha()
    .withMessage('First name can only contain letters'),
    
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .isAlpha()
    .withMessage('Last name can only contain letters'),
    
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$|^\+216-?\d{8}$/)
    .withMessage('Please provide a valid phone number (international format or Tunisian format: +216-12345678)'),
    
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .isBefore(new Date().toISOString().split('T')[0])
    .withMessage('Date of birth cannot be in the future'),
    
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
    
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
    
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),
    
  body('emergencyContact')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact cannot exceed 100 characters'),
    
  body('emergencyPhone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$|^\+216-?\d{8}$/)
    .withMessage('Please provide a valid emergency phone number'),
    
  body('allergies')
    .optional()
    .trim(),
    
  body('medicalConditions')
    .optional()
    .trim()
];

// Sales validation
const validateSale = [
  body('customerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a valid integer'),
    
  body('items')
    .isArray({ min: 1 })
    .withMessage('Sale must contain at least one item'),
    
  body('items.*.medicineId')
    .isInt({ min: 1 })
    .withMessage('Medicine ID must be a valid integer'),
    
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
    
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
    
  body('items.*.discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),
    
  body('paymentMethod')
    .isIn(['cash', 'card', 'insurance', 'credit'])
    .withMessage('Payment method must be cash, card, insurance, or credit'),
    
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Refund validation
const validateRefund = [
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Refund reason must be between 10 and 500 characters'),
    
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be a positive number')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateUserCreation,
  validateMedicine,
  validateStockAdjustment,
  validateCustomer,
  validateSale,
  validateRefund
};const express = require('express');
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
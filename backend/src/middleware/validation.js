const ValidatorFactory = require('../validators/ValidatorFactory');

/**
 * Validation Middleware - Uses Validator Factory pattern
 * Provides backward compatibility with existing routes
 */

// Authentication validators
const validateRegister = ValidatorFactory.getValidator('auth', 'register');
const validateLogin = ValidatorFactory.getValidator('auth', 'login');
const validateProfileUpdate = ValidatorFactory.getValidator('auth', 'profileUpdate');
const validatePasswordChange = ValidatorFactory.getValidator('auth', 'passwordChange');
const validateUserCreation = ValidatorFactory.getValidator('auth', 'userCreation');

// Medicine validators
const validateMedicine = ValidatorFactory.getValidator('medicine', 'create');
const validateMedicineUpdate = ValidatorFactory.getValidator('medicine', 'update');
const validateStockAdjustment = ValidatorFactory.getValidator('medicine', 'stockAdjustment');
const validateMedicineSearch = ValidatorFactory.getValidator('medicine', 'search');
const validateMedicineBulkImport = ValidatorFactory.getValidator('medicine', 'bulkImport');

// Customer validators
const validateCustomer = ValidatorFactory.getValidator('customer', 'create');
const validateCustomerUpdate = ValidatorFactory.getValidator('customer', 'update');
const validateCustomerSearch = ValidatorFactory.getValidator('customer', 'search');
const validateLoyaltyAdjustment = ValidatorFactory.getValidator('customer', 'loyaltyAdjustment');

// Sales validators
const validateSale = ValidatorFactory.getValidator('sales', 'create');
const validateRefund = ValidatorFactory.getValidator('sales', 'refund');
const validateSalesReport = ValidatorFactory.getValidator('sales', 'report');
const validateSalesFilter = ValidatorFactory.getValidator('sales', 'filter');

// Category validators
const validateCategory = ValidatorFactory.getValidator('category', 'create');
const validateCategoryUpdate = ValidatorFactory.getValidator('category', 'update');
const validateCategorySearch = ValidatorFactory.getValidator('category', 'search');

module.exports = {
  // Backward compatibility exports
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateUserCreation,
  validateMedicine,
  validateMedicineUpdate,
  validateStockAdjustment,
  validateMedicineSearch,
  validateMedicineBulkImport,
  validateCustomer,
  validateCustomerUpdate,
  validateCustomerSearch,
  validateLoyaltyAdjustment,
  validateSale,
  validateRefund,
  validateSalesReport,
  validateSalesFilter,
  validateCategory,
  validateCategoryUpdate,
  validateCategorySearch,
  
  // New Factory Pattern exports
  ValidatorFactory
};
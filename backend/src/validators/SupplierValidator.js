const { body } = require('express-validator');
const BaseValidator = require('./BaseValidator');

/**
 * Supplier Validator - Supplier-related validations
 */
class SupplierValidator extends BaseValidator {
  /**
   * Supplier creation/update validation
   */
  static validateSupplier() {
    return [
      body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Supplier name must be between 2 and 100 characters')
        .notEmpty()
        .withMessage('Supplier name is required'),

      body('contactPerson')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Contact person name cannot exceed 100 characters'),

      this.phoneValidation(),
      this.emailValidation(),

      this.textValidation('address', 500, false),

      body('city')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('City cannot exceed 50 characters'),

      body('country')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Country must be between 2 and 50 characters'),

      body('website')
        .optional()
        .trim()
        .isURL()
        .withMessage('Website must be a valid URL'),

      body('taxId')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Tax ID cannot exceed 50 characters'),

      this.enumValidation('paymentTerms', ['immediate', 'net_15', 'net_30', 'net_60', 'net_90'])
        .optional(),

      body('creditLimit')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Credit limit must be a positive number'),

      body('rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Rating must be between 0 and 5'),

      this.textValidation('notes', 1000, false)
    ];
  }

  /**
   * Supplier rating update validation
   */
  static validateSupplierRating() {
    return [
      body('rating')
        .isFloat({ min: 0, max: 5 })
        .withMessage('Rating must be between 0 and 5')
    ];
  }

  /**
   * Supplier status toggle validation
   */
  static validateSupplierStatus() {
    return [
      body('isActive')
        .isBoolean()
        .withMessage('isActive must be a boolean value')
    ];
  }

  /**
   * Supplier search validation
   */
  static validateSupplierSearch() {
    return [
      body('searchTerm')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Search term must be at least 2 characters')
    ];
  }
}

module.exports = SupplierValidator;
const { body } = require('express-validator');
const BaseValidator = require('./BaseValidator');

/**
 * Sales Validator - Sales and transaction-related validations
 */
class SalesValidator extends BaseValidator {
  /**
   * Sale creation validation
   */
  static validateSale() {
    return [
      this.idValidation('customerId'),

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

      this.enumValidation('paymentMethod', ['cash', 'card', 'insurance', 'credit']),

      body('discountAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Discount amount must be a positive number'),

      this.textValidation('notes', 500, false)
    ];
  }

  /**
   * Refund validation
   */
  static validateRefund() {
    return [
      body('reason')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Refund reason must be between 10 and 500 characters'),

      body('amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Refund amount must be a positive number')
    ];
  }

  /**
   * Sales report validation
   */
  static validateSalesReport() {
    return [
      body('startDate')
        .isISO8601()
        .withMessage('Start date must be a valid date'),

      body('endDate')
        .isISO8601()
        .withMessage('End date must be a valid date')
        .custom((value, { req }) => {
          if (new Date(value) <= new Date(req.body.startDate)) {
            throw new Error('End date must be after start date');
          }
          return true;
        }),

      this.enumValidation('groupBy', ['hour', 'day', 'week', 'month'])
        .optional()
    ];
  }

  /**
   * Sales filter validation
   */
  static validateSalesFilter() {
    return [
      this.idValidation('customerId'),
      this.idValidation('userId'),
      this.enumValidation('paymentMethod', ['cash', 'card', 'insurance', 'credit']).optional(),
      this.enumValidation('paymentStatus', ['paid', 'pending', 'partial', 'refunded']).optional(),
      
      body('minAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum amount must be a positive number'),

      body('maxAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum amount must be a positive number'),

      this.dateValidation('startDate'),
      this.dateValidation('endDate')
    ];
  }
}

module.exports = SalesValidator;
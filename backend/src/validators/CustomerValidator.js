const { body } = require('express-validator');
const BaseValidator = require('./BaseValidator');

/**
 * Customer Validator - Customer-related validations
 */
class CustomerValidator extends BaseValidator {
  /**
   * Customer creation/update validation
   */
  static validateCustomer() {
    return [
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

      this.phoneValidation(),
      this.emailValidation(),

      body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date')
        .isBefore(new Date().toISOString().split('T')[0])
        .withMessage('Date of birth cannot be in the future'),

      this.enumValidation('gender', ['male', 'female', 'other'])
        .optional(),

      this.textValidation('address', 500, false),

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

      this.textValidation('allergies', 1000, false),
      this.textValidation('medicalConditions', 1000, false)
    ];
  }

  /**
   * Customer search validation
   */
  static validateCustomerSearch() {
    return [
      body('searchTerm')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Search term must be at least 2 characters')
    ];
  }

  /**
   * Loyalty points adjustment validation
   */
  static validateLoyaltyAdjustment() {
    return [
      body('points')
        .isInt()
        .withMessage('Points must be an integer (positive or negative)'),

      body('reason')
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('Reason must be between 3 and 255 characters')
    ];
  }
}

module.exports = CustomerValidator;
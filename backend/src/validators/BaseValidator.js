const { body } = require('express-validator');

/**
 * Base Validator - Common validation utilities and patterns
 * Implements reusable validation logic using Template Method Pattern
 */
class BaseValidator {
  /**
   * Common phone validation for Tunisian format
   * @returns {function}
   */
  static phoneValidation() {
    return body('phone')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$|^\+216-?\d{8}$/)
      .withMessage('Please provide a valid phone number (international format or Tunisian format: +216-12345678)');
  }

  /**
   * Common email validation
   * @returns {function}
   */
  static emailValidation() {
    return body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail();
  }

  /**
   * Required email validation
   * @returns {function}
   */
  static requiredEmailValidation() {
    return body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail();
  }

  /**
   * Common password validation
   * @param {string} fieldName - Field name (password, newPassword, etc.)
   * @returns {function}
   */
  static passwordValidation(fieldName = 'password') {
    return body(fieldName)
      .isLength({ min: 6 })
      .withMessage(`${fieldName} must be at least 6 characters long`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(`${fieldName} must contain at least one uppercase letter, one lowercase letter, and one number`);
  }

  /**
   * Common name validation (letters and spaces only)
   * @param {string} fieldName - Field name
   * @param {number} minLength - Minimum length
   * @param {number} maxLength - Maximum length
   * @returns {function}
   */
  static nameValidation(fieldName, minLength = 2, maxLength = 100) {
    return body(fieldName)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${fieldName} must be between ${minLength} and ${maxLength} characters`)
      .matches(/^[a-zA-Z\s\u00C0-\u017F]+$/)
      .withMessage(`${fieldName} can only contain letters and spaces`);
  }

  /**
   * Common ID validation
   * @param {string} fieldName - Field name
   * @returns {function}
   */
  static idValidation(fieldName) {
    return body(fieldName)
      .optional()
      .isInt({ min: 1 })
      .withMessage(`${fieldName} must be a valid positive integer`);
  }

  /**
   * Required ID validation
   * @param {string} fieldName - Field name
   * @returns {function}
   */
  static requiredIdValidation(fieldName) {
    return body(fieldName)
      .isInt({ min: 1 })
      .withMessage(`${fieldName} must be a valid positive integer`);
  }

  /**
   * Price validation (positive decimal)
   * @param {string} fieldName - Field name
   * @returns {function}
   */
  static priceValidation(fieldName) {
    return body(fieldName)
      .isFloat({ min: 0 })
      .withMessage(`${fieldName} must be a positive number`);
  }

  /**
   * Quantity validation (positive integer)
   * @param {string} fieldName - Field name
   * @returns {function}
   */
  static quantityValidation(fieldName) {
    return body(fieldName)
      .isInt({ min: 1 })
      .withMessage(`${fieldName} must be at least 1`);
  }

  /**
   * Date validation (ISO format)
   * @param {string} fieldName - Field name
   * @returns {function}
   */
  static dateValidation(fieldName) {
    return body(fieldName)
      .optional()
      .isISO8601()
      .withMessage(`${fieldName} must be a valid date`);
  }

  /**
   * Enum validation
   * @param {string} fieldName - Field name
   * @param {Array} allowedValues - Allowed values
   * @returns {function}
   */
  static enumValidation(fieldName, allowedValues) {
    return body(fieldName)
      .isIn(allowedValues)
      .withMessage(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }

  /**
   * Text field validation with length limits
   * @param {string} fieldName - Field name
   * @param {number} maxLength - Maximum length
   * @param {boolean} required - Is field required
   * @returns {function}
   */
  static textValidation(fieldName, maxLength = 500, required = false) {
    const validation = body(fieldName);
    
    if (!required) {
      validation.optional();
    }
    
    return validation
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${fieldName} cannot exceed ${maxLength} characters`);
  }

  /**
   * Username validation
   * @returns {function}
   */
  static usernameValidation() {
    return body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens');
  }

  /**
   * Password confirmation validation
   * @param {string} passwordField - Main password field name
   * @param {string} confirmField - Confirmation field name
   * @returns {function}
   */
  static passwordConfirmValidation(passwordField = 'password', confirmField = 'confirmPassword') {
    return body(confirmField)
      .custom((value, { req }) => {
        if (value !== req.body[passwordField]) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      });
  }
}

module.exports = BaseValidator;
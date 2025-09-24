const { body } = require('express-validator');
const BaseValidator = require('./BaseValidator');

/**
 * Category Validator - Category-related validations
 */
class CategoryValidator extends BaseValidator {
  /**
   * Category creation/update validation
   */
  static validateCategory() {
    return [
      body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-&]+$/)
        .withMessage('Category name can only contain letters, numbers, spaces, hyphens and ampersand'),

      this.textValidation('description', 500, false)
    ];
  }

  /**
   * Category search validation
   */
  static validateCategorySearch() {
    return [
      body('searchTerm')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Search term must be at least 2 characters')
    ];
  }
}

module.exports = CategoryValidator;
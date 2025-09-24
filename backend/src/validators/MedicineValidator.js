const { body } = require('express-validator');
const BaseValidator = require('./BaseValidator');

/**
 * Medicine Validator - Medicine-related validations
 */
class MedicineValidator extends BaseValidator {
  /**
   * Medicine creation/update validation
   */
  static validateMedicine() {
    return [
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

      this.idValidation('categoryId'),
      this.idValidation('supplierId'),

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

      this.textValidation('description', 1000, false),

      body('dosage')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Dosage cannot exceed 100 characters'),

      this.enumValidation('unit', ['piece', 'bottle', 'box', 'tube', 'vial', 'pack', 'strip', 'ml', 'mg', 'g']),

      this.priceValidation('purchasePrice'),
      this.priceValidation('sellingPrice'),

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

      this.dateValidation('expiryDate'),
      this.dateValidation('manufactureDate'),

      this.textValidation('location', 100, false),

      body('isPrescriptionRequired')
        .optional()
        .isBoolean()
        .withMessage('Prescription required must be true or false')
    ];
  }

  /**
   * Stock adjustment validation
   */
  static validateStockAdjustment() {
    return [
      body('adjustment')
        .isInt()
        .withMessage('Adjustment must be an integer (positive or negative)'),

      body('reason')
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('Reason must be between 3 and 255 characters')
    ];
  }

  /**
   * Medicine search validation
   */
  static validateMedicineSearch() {
    return [
      body('searchTerm')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Search term must be at least 2 characters')
    ];
  }

  /**
   * Bulk medicine import validation
   */
  static validateMedicineBulkImport() {
    return [
      body('medicines')
        .isArray({ min: 1 })
        .withMessage('Medicines array is required and must contain at least one item'),

      body('medicines.*.name')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Medicine name must be between 2 and 200 characters'),

      body('medicines.*.purchasePrice')
        .isFloat({ min: 0 })
        .withMessage('Purchase price must be a positive number'),

      body('medicines.*.sellingPrice')
        .isFloat({ min: 0 })
        .withMessage('Selling price must be a positive number')
    ];
  }
}

module.exports = MedicineValidator;
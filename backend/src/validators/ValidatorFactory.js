const AuthValidator = require('./AuthValidator');
const MedicineValidator = require('./MedicineValidator');
const CustomerValidator = require('./CustomerValidator');
const SalesValidator = require('./SalesValidator');
const CategoryValidator = require('./CategoryValidator');
const SupplierValidator = require('./SupplierValidator');

/**
 * Validator Factory - Factory pattern for creating validators
 * Centralizes all validation logic and provides a clean interface
 */
class ValidatorFactory {
  /**
   * Get authentication validators
   */
  static auth() {
    return {
      register: AuthValidator.validateRegister(),
      login: AuthValidator.validateLogin(),
      profileUpdate: AuthValidator.validateProfileUpdate(),
      passwordChange: AuthValidator.validatePasswordChange(),
      userCreation: AuthValidator.validateUserCreation()
    };
  }

  /**
   * Get medicine validators
   */
  static medicine() {
    return {
      create: MedicineValidator.validateMedicine(),
      update: MedicineValidator.validateMedicine(),
      stockAdjustment: MedicineValidator.validateStockAdjustment(),
      search: MedicineValidator.validateMedicineSearch(),
      bulkImport: MedicineValidator.validateMedicineBulkImport()
    };
  }

  /**
   * Get customer validators
   */
  static customer() {
    return {
      create: CustomerValidator.validateCustomer(),
      update: CustomerValidator.validateCustomer(),
      search: CustomerValidator.validateCustomerSearch(),
      loyaltyAdjustment: CustomerValidator.validateLoyaltyAdjustment()
    };
  }

  /**
   * Get sales validators
   */
  static sales() {
    return {
      create: SalesValidator.validateSale(),
      refund: SalesValidator.validateRefund(),
      report: SalesValidator.validateSalesReport(),
      filter: SalesValidator.validateSalesFilter()
    };
  }

  /**
   * Get category validators
   */
  static category() {
    return {
      create: CategoryValidator.validateCategory(),
      update: CategoryValidator.validateCategory(),
      search: CategoryValidator.validateCategorySearch()
    };
  }

  /**
   * Get supplier validators
   */
  static supplier() {
    return {
      create: SupplierValidator.validateSupplier(),
      update: SupplierValidator.validateSupplier(),
      rating: SupplierValidator.validateSupplierRating(),
      status: SupplierValidator.validateSupplierStatus(),
      search: SupplierValidator.validateSupplierSearch()
    };
  }

  /**
   * Get validator by entity and action
   * @param {string} entity - Entity name (auth, medicine, customer, sales, category, supplier)
   * @param {string} action - Action name (create, update, etc.)
   * @returns {Array} Validation middleware array
   */
  static getValidator(entity, action) {
    const validators = {
      auth: this.auth(),
      medicine: this.medicine(),
      customer: this.customer(),
      sales: this.sales(),
      category: this.category(),
      supplier: this.supplier()
    };

    const entityValidators = validators[entity.toLowerCase()];
    
    if (!entityValidators) {
      throw new Error(`Unknown entity: ${entity}`);
    }

    const validator = entityValidators[action];
    
    if (!validator) {
      throw new Error(`Unknown action: ${action} for entity: ${entity}`);
    }

    return validator;
  }

  /**
   * Get all available validators for an entity
   * @param {string} entity - Entity name
   * @returns {object} All validators for the entity
   */
  static getAllValidators(entity) {
    const validators = {
      auth: this.auth(),
      medicine: this.medicine(),
      customer: this.customer(),
      sales: this.sales(),
      category: this.category(),
      supplier: this.supplier()
    };

    const entityValidators = validators[entity.toLowerCase()];
    
    if (!entityValidators) {
      throw new Error(`Unknown entity: ${entity}`);
    }

    return entityValidators;
  }

  /**
   * List available entities
   * @returns {Array} Available entity names
   */
  static getAvailableEntities() {
    return ['auth', 'medicine', 'customer', 'sales', 'category', 'supplier'];
  }

  /**
   * List available actions for an entity
   * @param {string} entity - Entity name
   * @returns {Array} Available action names
   */
  static getAvailableActions(entity) {
    const entityValidators = this.getAllValidators(entity);
    return Object.keys(entityValidators);
  }
}

module.exports = ValidatorFactory;
const SupplierRepository = require('../repositories/SuplierRepository');
const ValidationError = require('../exceptions/ValidationError');

/**
 * Supplier Service - Business logic for supplier operations
 */
class SupplierService {
  constructor() {
    this.supplierRepository = new SupplierRepository();
  }

  /**
   * Get all suppliers with optional filters
   * @param {object} filters - Filter criteria
   * @returns {Promise<object>}
   */
  async getAllSuppliers(filters = {}) {
    const { includeMedicineCount = false, ...searchFilters } = filters;
    
    if (includeMedicineCount) {
      const suppliers = await this.supplierRepository.getSuppliersWithMedicineCount();
      return {
        suppliers,
        pagination: null // No pagination for this special query
      };
    }

    const result = await this.supplierRepository.searchSuppliersAdvanced(searchFilters);
    
    return {
      suppliers: result.rows,
      pagination: this._buildPaginationInfo(result, searchFilters)
    };
  }

  /**
   * Get supplier by ID with optional medicines
   * @param {number} supplierId - Supplier ID
   * @param {boolean} includeMedicines - Include medicines
   * @returns {Promise<object>}
   */
  async getSupplierById(supplierId, includeMedicines = false) {
    if (!supplierId || isNaN(supplierId)) {
      throw new ValidationError('Invalid supplier ID', 'INVALID_SUPPLIER_ID', 400);
    }

    let supplier;
    
    if (includeMedicines) {
      supplier = await this.supplierRepository.getSupplierWithMedicines(supplierId);
    } else {
      supplier = await this.supplierRepository.findById(supplierId);
    }

    if (!supplier) {
      throw new ValidationError('Supplier not found', 'SUPPLIER_NOT_FOUND', 404);
    }

    return supplier;
  }

  /**
   * Create new supplier
   * @param {object} supplierData - Supplier data
   * @returns {Promise<object>}
   */
  async createSupplier(supplierData) {
    // Validate required fields
    if (!supplierData.name) {
      throw new ValidationError('Supplier name is required', 'MISSING_SUPPLIER_NAME', 400);
    }

    // Check if supplier with same name and email already exists
    if (supplierData.email) {
      const existingSupplier = await this.supplierRepository.findOne({
        email: supplierData.email,
        isActive: true
      });

      if (existingSupplier) {
        throw new ValidationError(
          'Supplier with this email already exists',
          'SUPPLIER_EMAIL_EXISTS',
          409
        );
      }
    }

    // Validate rating if provided
    if (supplierData.rating !== undefined && (supplierData.rating < 0 || supplierData.rating > 5)) {
      throw new ValidationError(
        'Rating must be between 0 and 5',
        'INVALID_RATING',
        400
      );
    }

    // Validate credit limit if provided
    if (supplierData.creditLimit !== undefined && supplierData.creditLimit < 0) {
      throw new ValidationError(
        'Credit limit cannot be negative',
        'INVALID_CREDIT_LIMIT',
        400
      );
    }

    // Set default values
    const supplierToCreate = {
      ...supplierData,
      isActive: supplierData.isActive !== undefined ? supplierData.isActive : true,
      country: supplierData.country || 'Tunisia',
      paymentTerms: supplierData.paymentTerms || 'net_30'
    };

    return await this.supplierRepository.create(supplierToCreate);
  }

  /**
   * Update supplier
   * @param {number} supplierId - Supplier ID
   * @param {object} updateData - Update data
   * @returns {Promise<object>}
   */
  async updateSupplier(supplierId, updateData) {
    if (!supplierId || isNaN(supplierId)) {
      throw new ValidationError('Invalid supplier ID', 'INVALID_SUPPLIER_ID', 400);
    }

    const supplier = await this.supplierRepository.findById(supplierId);
    
    if (!supplier) {
      throw new ValidationError('Supplier not found', 'SUPPLIER_NOT_FOUND', 404);
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== supplier.email) {
      const existingSupplier = await this.supplierRepository.findOne({
        email: updateData.email,
        isActive: true
      });

      if (existingSupplier && existingSupplier.id !== supplierId) {
        throw new ValidationError(
          'Supplier with this email already exists',
          'SUPPLIER_EMAIL_EXISTS',
          409
        );
      }
    }

    // Validate rating if provided
    if (updateData.rating !== undefined && (updateData.rating < 0 || updateData.rating > 5)) {
      throw new ValidationError(
        'Rating must be between 0 and 5',
        'INVALID_RATING',
        400
      );
    }

    // Validate credit limit if provided
    if (updateData.creditLimit !== undefined && updateData.creditLimit < 0) {
      throw new ValidationError(
        'Credit limit cannot be negative',
        'INVALID_CREDIT_LIMIT',
        400
      );
    }

    await this.supplierRepository.update(supplierId, updateData);
    return await this.supplierRepository.findById(supplierId);
  }

  /**
   * Delete supplier (soft delete)
   * @param {number} supplierId - Supplier ID
   * @returns {Promise<void>}
   */
  async deleteSupplier(supplierId) {
    if (!supplierId || isNaN(supplierId)) {
      throw new ValidationError('Invalid supplier ID', 'INVALID_SUPPLIER_ID', 400);
    }

    const supplier = await this.supplierRepository.findById(supplierId);
    
    if (!supplier) {
      throw new ValidationError('Supplier not found', 'SUPPLIER_NOT_FOUND', 404);
    }

    // Check if supplier can be deleted
    const canDelete = await this.supplierRepository.canBeDeleted(supplierId);
    
    if (!canDelete) {
      throw new ValidationError(
        'Cannot delete supplier with active medicines or purchase orders. Deactivate the supplier instead.',
        'SUPPLIER_HAS_DEPENDENCIES',
        409
      );
    }

    await this.supplierRepository.softDelete(supplierId);
  }

  /**
   * Search suppliers
   * @param {string} searchTerm - Search term
   * @param {object} additionalFilters - Additional filters
   * @returns {Promise<Array>}
   */
  async searchSuppliers(searchTerm, additionalFilters = {}) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new ValidationError(
        'Search term must be at least 2 characters',
        'INVALID_SEARCH_TERM',
        400
      );
    }

    const filters = {
      search: searchTerm.trim(),
      ...additionalFilters
    };

    const result = await this.supplierRepository.searchSuppliersAdvanced(filters);
    return result.rows;
  }

  /**
   * Get top-rated suppliers
   * @param {number} limit - Number of suppliers to return
   * @returns {Promise<Array>}
   */
  async getTopRatedSuppliers(limit = 10) {
    if (limit < 1 || limit > 50) {
      throw new ValidationError(
        'Limit must be between 1 and 50',
        'INVALID_LIMIT',
        400
      );
    }

    return await this.supplierRepository.getTopRatedSuppliers(limit);
  }

  /**
   * Get supplier statistics
   * @returns {Promise<object>}
   */
  async getSupplierStatistics() {
    return await this.supplierRepository.getSupplierStats();
  }

  /**
   * Update supplier rating
   * @param {number} supplierId - Supplier ID
   * @param {number} rating - New rating (0-5)
   * @returns {Promise<object>}
   */
  async updateSupplierRating(supplierId, rating) {
    if (!supplierId || isNaN(supplierId)) {
      throw new ValidationError('Invalid supplier ID', 'INVALID_SUPPLIER_ID', 400);
    }

    if (rating < 0 || rating > 5) {
      throw new ValidationError(
        'Rating must be between 0 and 5',
        'INVALID_RATING',
        400
      );
    }

    const supplier = await this.supplierRepository.findById(supplierId);
    
    if (!supplier) {
      throw new ValidationError('Supplier not found', 'SUPPLIER_NOT_FOUND', 404);
    }

    // Use the model's updateRating method
    await supplier.updateRating(rating);
    return await this.supplierRepository.findById(supplierId);
  }

  /**
   * Get supplier performance metrics
   * @param {number} supplierId - Supplier ID
   * @returns {Promise<object>}
   */
  async getSupplierPerformance(supplierId) {
    if (!supplierId || isNaN(supplierId)) {
      throw new ValidationError('Invalid supplier ID', 'INVALID_SUPPLIER_ID', 400);
    }

    const performance = await this.supplierRepository.getSupplierPerformance(supplierId);
    
    if (!performance) {
      throw new ValidationError('Supplier not found', 'SUPPLIER_NOT_FOUND', 404);
    }

    return performance;
  }

  /**
   * Get suppliers by payment terms
   * @param {string} paymentTerms - Payment terms
   * @returns {Promise<Array>}
   */
  async getSuppliersByPaymentTerms(paymentTerms) {
    const validTerms = ['immediate', 'net_15', 'net_30', 'net_60', 'net_90'];
    
    if (!validTerms.includes(paymentTerms)) {
      throw new ValidationError(
        `Invalid payment terms. Must be one of: ${validTerms.join(', ')}`,
        'INVALID_PAYMENT_TERMS',
        400
      );
    }

    return await this.supplierRepository.getSuppliersByPaymentTerms(paymentTerms);
  }

  /**
   * Activate or deactivate supplier
   * @param {number} supplierId - Supplier ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<object>}
   */
  async toggleSupplierStatus(supplierId, isActive) {
    if (!supplierId || isNaN(supplierId)) {
      throw new ValidationError('Invalid supplier ID', 'INVALID_SUPPLIER_ID', 400);
    }

    if (typeof isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean value', 'INVALID_STATUS', 400);
    }

    const supplier = await this.supplierRepository.findById(supplierId);
    
    if (!supplier) {
      throw new ValidationError('Supplier not found', 'SUPPLIER_NOT_FOUND', 404);
    }

    await this.supplierRepository.update(supplierId, { isActive });
    return await this.supplierRepository.findById(supplierId);
  }

  /**
   * Get suppliers with medicine count
   * @returns {Promise<Array>}
   */
  async getSuppliersWithMedicineCount() {
    return await this.supplierRepository.getSuppliersWithMedicineCount();
  }

  /**
   * Bulk update suppliers
   * @param {Array} updates - Array of {id, data} objects
   * @returns {Promise<Array>}
   */
  async bulkUpdateSuppliers(updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ValidationError('Updates must be a non-empty array', 'INVALID_UPDATES', 400);
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        if (!update.id || !update.data) {
          throw new ValidationError('Each update must have id and data', 'INVALID_UPDATE_FORMAT', 400);
        }

        const updatedSupplier = await this.updateSupplier(update.id, update.data);
        results.push({ id: update.id, success: true, supplier: updatedSupplier });
      } catch (error) {
        errors.push({ id: update.id, success: false, error: error.message });
      }
    }

    return { results, errors };
  }

  /**
   * Get supplier summary for dashboard
   * @returns {Promise<object>}
   */
  async getSupplierDashboardSummary() {
    const stats = await this.getSupplierStatistics();
    const topRated = await this.getTopRatedSuppliers(5);
    
    return {
      statistics: stats,
      topRatedSuppliers: topRated,
      timestamp: new Date()
    };
  }

  // Private helper methods

  /**
   * Build pagination information
   * @private
   * @param {object} result - Query result with count
   * @param {object} filters - Applied filters
   * @returns {object}
   */
  _buildPaginationInfo(result, filters) {
    const { page = 1, limit = 20 } = filters;
    const totalPages = Math.ceil(result.count / parseInt(limit));

    return {
      currentPage: parseInt(page),
      totalPages,
      totalItems: result.count,
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  /**
   * Validate supplier data
   * @private
   * @param {object} data - Supplier data to validate
   * @returns {void}
   */
  _validateSupplierData(data) {
    const errors = [];

    if (data.name && (data.name.length < 2 || data.name.length > 100)) {
      errors.push('Supplier name must be between 2 and 100 characters');
    }

    if (data.email && !this._isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.phone && !this._isValidPhone(data.phone)) {
      errors.push('Invalid phone format');
    }

    if (data.website && !this._isValidUrl(data.website)) {
      errors.push('Invalid website URL');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '), 'VALIDATION_ERROR', 400);
    }
  }

  /**
   * Validate email format
   * @private
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   * @private
   * @param {string} phone - Phone to validate
   * @returns {boolean}
   */
  _isValidPhone(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$|^\+216-?\d{8}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Validate URL format
   * @private
   * @param {string} url - URL to validate
   * @returns {boolean}
   */
  _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = SupplierService;

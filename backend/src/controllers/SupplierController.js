const SupplierService = require('../services/SupplierService');
const { validationResult } = require('express-validator');
const ValidationError = require('../exceptions/ValidationError');

/**
 * Supplier Controller - HTTP handling for supplier operations
 */
class SupplierController {
  constructor() {
    this.supplierService = new SupplierService();
    
    // Bind methods to preserve 'this' context
    this.getAllSuppliers = this.getAllSuppliers.bind(this);
    this.getSupplierById = this.getSupplierById.bind(this);
    this.createSupplier = this.createSupplier.bind(this);
    this.updateSupplier = this.updateSupplier.bind(this);
    this.deleteSupplier = this.deleteSupplier.bind(this);
    this.searchSuppliers = this.searchSuppliers.bind(this);
    this.getSupplierStats = this.getSupplierStats.bind(this);
    this.getTopRatedSuppliers = this.getTopRatedSuppliers.bind(this);
    this.updateSupplierRating = this.updateSupplierRating.bind(this);
    this.getSupplierPerformance = this.getSupplierPerformance.bind(this);
    this.toggleSupplierStatus = this.toggleSupplierStatus.bind(this);
  }

  /**
   * Get all suppliers
   * GET /api/suppliers
   */
  async getAllSuppliers(req, res) {
    try {
      const filters = this._extractSupplierFilters(req.query);
      const result = await this.supplierService.getAllSuppliers(filters);

      res.json({
        success: true,
        message: 'Suppliers retrieved successfully',
        data: result
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Get supplier by ID
   * GET /api/suppliers/:id
   */
  async getSupplierById(req, res) {
    try {
      const supplierId = parseInt(req.params.id);
      const { includeMedicines = 'false' } = req.query;
      
      if (isNaN(supplierId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier ID',
          code: 'INVALID_SUPPLIER_ID'
        });
      }

      const supplier = await this.supplierService.getSupplierById(
        supplierId,
        includeMedicines === 'true'
      );

      res.json({
        success: true,
        message: 'Supplier retrieved successfully',
        data: { supplier }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Create new supplier
   * POST /api/suppliers
   */
  async createSupplier(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const supplier = await this.supplierService.createSupplier(req.body);

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: { supplier }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Update supplier
   * PUT /api/suppliers/:id
   */
  async updateSupplier(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const supplierId = parseInt(req.params.id);
      
      if (isNaN(supplierId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier ID',
          code: 'INVALID_SUPPLIER_ID'
        });
      }

      const supplier = await this.supplierService.updateSupplier(supplierId, req.body);

      res.json({
        success: true,
        message: 'Supplier updated successfully',
        data: { supplier }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Delete supplier
   * DELETE /api/suppliers/:id
   */
  async deleteSupplier(req, res) {
    try {
      const supplierId = parseInt(req.params.id);
      
      if (isNaN(supplierId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier ID',
          code: 'INVALID_SUPPLIER_ID'
        });
      }

      await this.supplierService.deleteSupplier(supplierId);

      res.json({
        success: true,
        message: 'Supplier deleted successfully'
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Search suppliers
   * GET /api/suppliers/search
   */
  async searchSuppliers(req, res) {
    try {
      const { q: searchTerm, ...filters } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required',
          code: 'MISSING_SEARCH_TERM'
        });
      }

      const suppliers = await this.supplierService.searchSuppliers(searchTerm, filters);

      res.json({
        success: true,
        message: 'Supplier search completed',
        data: { 
          suppliers,
          searchTerm,
          filters
        }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Get supplier statistics
   * GET /api/suppliers/stats
   */
  async getSupplierStats(req, res) {
    try {
      const stats = await this.supplierService.getSupplierStatistics();

      res.json({
        success: true,
        message: 'Supplier statistics retrieved successfully',
        data: { stats }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Get top-rated suppliers
   * GET /api/suppliers/top-rated
   */
  async getTopRatedSuppliers(req, res) {
    try {
      const { limit = 10 } = req.query;
      const limitNum = parseInt(limit);

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be a number between 1 and 50',
          code: 'INVALID_LIMIT'
        });
      }

      const suppliers = await this.supplierService.getTopRatedSuppliers(limitNum);

      res.json({
        success: true,
        message: 'Top-rated suppliers retrieved successfully',
        data: { suppliers, limit: limitNum }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Update supplier rating
   * PUT /api/suppliers/:id/rating
   */
  async updateSupplierRating(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const supplierId = parseInt(req.params.id);
      const { rating } = req.body;
      
      if (isNaN(supplierId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier ID',
          code: 'INVALID_SUPPLIER_ID'
        });
      }

      const supplier = await this.supplierService.updateSupplierRating(supplierId, rating);

      res.json({
        success: true,
        message: 'Supplier rating updated successfully',
        data: { supplier }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Get supplier performance metrics
   * GET /api/suppliers/:id/performance
   */
  async getSupplierPerformance(req, res) {
    try {
      const supplierId = parseInt(req.params.id);
      
      if (isNaN(supplierId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier ID',
          code: 'INVALID_SUPPLIER_ID'
        });
      }

      const performance = await this.supplierService.getSupplierPerformance(supplierId);

      res.json({
        success: true,
        message: 'Supplier performance metrics retrieved successfully',
        data: performance
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Toggle supplier active status
   * PUT /api/suppliers/:id/status
   */
  async toggleSupplierStatus(req, res) {
    try {
      const supplierId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (isNaN(supplierId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier ID',
          code: 'INVALID_SUPPLIER_ID'
        });
      }

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value',
          code: 'INVALID_STATUS_VALUE'
        });
      }

      const supplier = await this.supplierService.toggleSupplierStatus(supplierId, isActive);

      res.json({
        success: true,
        message: `Supplier ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { supplier }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  // Private helper methods

  /**
   * Extract and validate supplier filters
   * @private
   */
  _extractSupplierFilters(query) {
    const {
      page = 1,
      limit = 20,
      search,
      city,
      country,
      rating,
      paymentTerms,
      activeOnly = 'true',
      includeMedicineCount = 'false',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = query;

    // Validate pagination
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));

    // Validate sort order
    const validatedSortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) 
      ? sortOrder.toUpperCase() 
      : 'ASC';

    // Validate payment terms
    const validPaymentTerms = ['immediate', 'net_15', 'net_30', 'net_60', 'net_90'];
    const validatedPaymentTerms = validPaymentTerms.includes(paymentTerms) 
      ? paymentTerms 
      : undefined;

    return {
      page: validatedPage,
      limit: validatedLimit,
      search: search?.trim(),
      city: city?.trim(),
      country: country?.trim(),
      rating: rating ? parseFloat(rating) : undefined,
      paymentTerms: validatedPaymentTerms,
      activeOnly: activeOnly === 'true',
      includeMedicineCount: includeMedicineCount === 'true',
      sortBy,
      sortOrder: validatedSortOrder
    };
  }

  /**
   * Centralized error handling
   * @private
   */
  _handleError(res, error) {
    console.error('Supplier Controller Error:', error);

    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Database validation failed',
        errors: validationErrors
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Supplier with this information already exists',
        code: 'DUPLICATE_SUPPLIER'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}

module.exports = new SupplierController();
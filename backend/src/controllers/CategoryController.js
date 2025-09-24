const CategoryService = require('../services/CategoryService');
const { validationResult } = require('express-validator');
const ValidationError = require('../exceptions/ValidationError');

/**
 * Category Controller - HTTP handling for category operations
 */
class CategoryController {
  constructor() {
    this.categoryService = new CategoryService();
    
    // Bind methods to preserve 'this' context
    this.getAllCategories = this.getAllCategories.bind(this);
    this.getCategoryById = this.getCategoryById.bind(this);
    this.createCategory = this.createCategory.bind(this);
    this.updateCategory = this.updateCategory.bind(this);
    this.deleteCategory = this.deleteCategory.bind(this);
    this.searchCategories = this.searchCategories.bind(this);
    this.getCategoryStats = this.getCategoryStats.bind(this);
  }

  /**
   * Get all categories
   * GET /api/categories
   */
  async getAllCategories(req, res) {
    try {
      const { includeMedicineCount = 'false' } = req.query;
      const includeCount = includeMedicineCount === 'true';
      
      const categories = await this.categoryService.getAllCategories(includeCount);

      res.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: { categories }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  async getCategoryById(req, res) {
    try {
      const categoryId = parseInt(req.params.id);
      const { includeMedicines = 'false' } = req.query;
      
      if (isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID',
          code: 'INVALID_CATEGORY_ID'
        });
      }

      const category = await this.categoryService.getCategoryById(
        categoryId, 
        includeMedicines === 'true'
      );

      res.json({
        success: true,
        message: 'Category retrieved successfully',
        data: { category }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Create new category
   * POST /api/categories
   */
  async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const category = await this.categoryService.createCategory(req.body);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Update category
   * PUT /api/categories/:id
   */
  async updateCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const categoryId = parseInt(req.params.id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID',
          code: 'INVALID_CATEGORY_ID'
        });
      }

      const category = await this.categoryService.updateCategory(categoryId, req.body);

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: { category }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  async deleteCategory(req, res) {
    try {
      const categoryId = parseInt(req.params.id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID',
          code: 'INVALID_CATEGORY_ID'
        });
      }

      await this.categoryService.deleteCategory(categoryId);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Search categories
   * GET /api/categories/search
   */
  async searchCategories(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required',
          code: 'MISSING_SEARCH_TERM'
        });
      }

      const categories = await this.categoryService.searchCategories(searchTerm);

      res.json({
        success: true,
        message: 'Category search completed',
        data: { 
          categories,
          searchTerm 
        }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Get category statistics
   * GET /api/categories/stats
   */
  async getCategoryStats(req, res) {
    try {
      const stats = await this.categoryService.getCategoryStatistics();

      res.json({
        success: true,
        message: 'Category statistics retrieved successfully',
        data: { stats }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Centralized error handling
   * @private
   */
  _handleError(res, error) {
    console.error('Category Controller Error:', error);

    // Handle custom business exceptions
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    // Handle Sequelize validation errors
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

    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Category name already exists',
        code: 'CATEGORY_NAME_EXISTS'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}

module.exports = new CategoryController();
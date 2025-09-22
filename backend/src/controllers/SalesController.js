const SalesService = require('../services/SalesService');
const { validationResult } = require('express-validator');
const SalesValidationError = require('../exceptions/SalesValidationError');
const InsufficientStockError = require('../exceptions/InsufficientStockError');

/**
 * Sales Controller - HTTP request handling for sales operations
 * Thin layer that delegates business logic to SalesService
 * Follows Single Responsibility Principle - only handles HTTP concerns
 */
class SalesController {
  constructor() {
    this.salesService = new SalesService();
    
    // Bind methods to preserve 'this' context
    this.createSale = this.createSale.bind(this);
    this.getAllSales = this.getAllSales.bind(this);
    this.getSaleById = this.getSaleById.bind(this);
    this.getTodaysSales = this.getTodaysSales.bind(this);
    this.getSalesReport = this.getSalesReport.bind(this);
    this.processRefund = this.processRefund.bind(this);
    this.getCustomerHistory = this.getCustomerHistory.bind(this);
  }

  /**
   * Create new sale transaction
   * POST /api/sales
   */
  async createSale(req, res) {
    try {
      // Validate request input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const saleData = req.body;
      const userId = req.user.id;

      // Delegate to service layer
      const sale = await this.salesService.processSale(saleData, userId);

      res.status(201).json({
        success: true,
        message: 'Sale processed successfully',
        data: { 
          sale,
          receipt: sale.getReceiptData ? sale.getReceiptData() : null
        }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Get all sales with filtering
   * GET /api/sales
   */
  async getAllSales(req, res) {
    try {
      const filters = this._extractSalesFilters(req.query);
      const result = await this.salesService.getSales(filters);

      res.json({
        success: true,
        message: 'Sales retrieved successfully',
        data: result
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Get single sale by ID
   * GET /api/sales/:id
   */
  async getSaleById(req, res) {
    try {
      const saleId = parseInt(req.params.id);
      
      if (isNaN(saleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sale ID',
          code: 'INVALID_SALE_ID'
        });
      }

      const sale = await this.salesService.getSaleById(saleId);

      res.json({
        success: true,
        message: 'Sale retrieved successfully',
        data: { sale }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Get today's sales dashboard
   * GET /api/sales/today
   */
  async getTodaysSales(req, res) {
    try {
      const todayData = await this.salesService.getTodaysDashboard();

      res.json({
        success: true,
        message: 'Today\'s sales retrieved successfully',
        data: todayData
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Generate sales report
   * GET /api/sales/report
   */
  async getSalesReport(req, res) {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
          code: 'MISSING_DATE_RANGE'
        });
      }

      // Validate date format
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT'
        });
      }

      if (start > end) {
        return res.status(400).json({
          success: false,
          message: 'Start date cannot be after end date',
          code: 'INVALID_DATE_RANGE'
        });
      }

      const report = await this.salesService.generateSalesReport(start, end, groupBy);

      res.json({
        success: true,
        message: 'Sales report generated successfully',
        data: report
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Process sale refund
   * POST /api/sales/:id/refund
   */
  async processRefund(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const saleId = parseInt(req.params.id);
      const { reason, amount } = req.body;

      if (isNaN(saleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sale ID',
          code: 'INVALID_SALE_ID'
        });
      }

      const refundResult = await this.salesService.processRefund(saleId, reason, amount);

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: refundResult
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Get customer purchase history
   * GET /api/customers/:id/sales-history
   */
  async getCustomerHistory(req, res) {
    try {
      const customerId = parseInt(req.params.id);
      const { page = 1, limit = 10 } = req.query;

      if (isNaN(customerId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid customer ID',
          code: 'INVALID_CUSTOMER_ID'
        });
      }

      const history = await this.salesService.getCustomerHistory(
        customerId, 
        parseInt(page), 
        parseInt(limit)
      );

      res.json({
        success: true,
        message: 'Customer purchase history retrieved successfully',
        data: history
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  // Private helper methods

  /**
   * Extract and validate sales filters from query parameters
   * @private
   */
  _extractSalesFilters(query) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      customerId,
      paymentMethod,
      paymentStatus,
      userId,
      minAmount,
      maxAmount,
      sortBy = 'saleDate',
      sortOrder = 'DESC'
    } = query;

    // Validate pagination
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // Validate sort order
    const validatedSortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) 
      ? sortOrder.toUpperCase() 
      : 'DESC';

    // Validate payment method
    const validPaymentMethods = ['cash', 'card', 'insurance', 'credit'];
    const validatedPaymentMethod = validPaymentMethods.includes(paymentMethod) 
      ? paymentMethod 
      : undefined;

    // Validate payment status
    const validPaymentStatuses = ['paid', 'pending', 'partial', 'refunded'];
    const validatedPaymentStatus = validPaymentStatuses.includes(paymentStatus) 
      ? paymentStatus 
      : undefined;

    return {
      page: validatedPage,
      limit: validatedLimit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      customerId: customerId ? parseInt(customerId) : undefined,
      paymentMethod: validatedPaymentMethod,
      paymentStatus: validatedPaymentStatus,
      userId: userId ? parseInt(userId) : undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      sortBy,
      sortOrder: validatedSortOrder
    };
  }

  /**
   * Centralized error handling with proper HTTP status codes
   * @private
   */
  _handleError(res, error) {
    console.error('Sales Controller Error:', error);

    // Handle custom business exceptions
    if (error instanceof SalesValidationError || error instanceof InsufficientStockError) {
      return res.status(error.getStatusCode()).json(error.toJSON());
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

    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference to related entity',
        code: 'FOREIGN_KEY_CONSTRAINT'
      });
    }

    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry detected',
        code: 'UNIQUE_CONSTRAINT'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }
}

// Export instance to maintain singleton pattern
module.exports = new SalesController();
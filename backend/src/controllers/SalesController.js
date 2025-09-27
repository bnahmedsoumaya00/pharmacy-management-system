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
    this.getTodaySales = this.getTodaySales.bind(this);
    this.getSalesStats = this.getSalesStats.bind(this);
    this.getSalesReport = this.getSalesReport.bind(this);
    this.getSaleReceipt = this.getSaleReceipt.bind(this);
    this.processSaleRefund = this.processSaleRefund.bind(this);
    this.updateSale = this.updateSale.bind(this);
    this.deleteSale = this.deleteSale.bind(this);
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
  async getTodaySales(req, res) {
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
   * Get sales statistics
   * GET /api/sales/stats
   */
  async getSalesStats(req, res) {
    try {
      const { period = 'month' } = req.query;
      const stats = await this.salesService.getSalesStatistics(period);

      res.json({
        success: true,
        message: 'Sales statistics retrieved successfully',
        data: stats
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
   * Get sale receipt
   * GET /api/sales/:id/receipt
   */
  async getSaleReceipt(req, res) {
    try {
      const saleId = parseInt(req.params.id);
      
      if (isNaN(saleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sale ID',
          code: 'INVALID_SALE_ID'
        });
      }

      const receipt = await this.salesService.generateReceipt(saleId);

      res.json({
        success: true,
        message: 'Receipt generated successfully',
        data: receipt
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Process sale refund
   * POST /api/sales/:id/refund
   */
  async processSaleRefund(req, res) {
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
   * Update sale
   * PUT /api/sales/:id
   */
  async updateSale(req, res) {
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
      const updateData = req.body;

      if (isNaN(saleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sale ID',
          code: 'INVALID_SALE_ID'
        });
      }

      const updatedSale = await this.salesService.updateSale(saleId, updateData);

      res.json({
        success: true,
        message: 'Sale updated successfully',
        data: { sale: updatedSale }
      });

    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Delete sale
   * DELETE /api/sales/:id
   */
  async deleteSale(req, res) {
    try {
      const saleId = parseInt(req.params.id);

      if (isNaN(saleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sale ID',
          code: 'INVALID_SALE_ID'
        });
      }

      await this.salesService.deleteSale(saleId);

      res.json({
        success: true,
        message: 'Sale deleted successfully'
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

    return {
      page: validatedPage,
      limit: validatedLimit,
      startDate,
      endDate,
      customerId: customerId ? parseInt(customerId) : null,
      paymentMethod,
      paymentStatus,
      userId: userId ? parseInt(userId) : null,
      minAmount: minAmount ? parseFloat(minAmount) : null,
      maxAmount: maxAmount ? parseFloat(maxAmount) : null,
      sortBy,
      sortOrder: validatedSortOrder
    };
  }

  /**
   * Handle errors and send appropriate response
   * @private
   */
  _handleError(res, error) {
    console.error('Sales Controller Error:', error);

    if (error instanceof SalesValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    if (error instanceof InsufficientStockError) {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: 'INSUFFICIENT_STOCK',
        details: {
          medicineId: error.medicineId,
          availableStock: error.availableStock,
          requestedQuantity: error.requestedQuantity
        }
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    });
  }
}

module.exports = new SalesController();
const SalesService = require('../services/SalesService');
const { validationResult } = require('express-validator');
const SalesValidationError = require('../exceptions/SalesValidationError');
const InsufficientStockError = require('../exceptions/InsufficientStockError');
const sequelize = require('sequelize');
const { Sale, Medicine, SaleItem, User, Customer, Category } = require('../models');
const { Op } = require('sequelize');

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
    this.refundSale = this.refundSale.bind(this);
    this.getReceipt = this.getReceipt.bind(this);
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
      const { startDate, endDate } = req.query;
      const { Sale, sequelize } = require('../models');
      const { Op } = require('sequelize');
      
      let whereClause = {};
      if (startDate && endDate) {
        whereClause.saleDate = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      // Get basic stats with safe error handling
      let totalSales = 0;
      let totalRevenue = 0;
      let averageSale = 0;
      let highestSale = 0;
      let dailySummary = [];

      try {
        totalSales = await Sale.count({ where: whereClause });
      } catch (error) {
        console.log('Error counting sales:', error.message);
      }

      try {
        const totalRevenueResult = await Sale.sum('finalAmount', { where: whereClause });
        totalRevenue = totalRevenueResult || 0;
        averageSale = totalSales > 0 ? (totalRevenue / totalSales) : 0;
      } catch (error) {
        console.log('Error calculating revenue:', error.message);
      }

      try {
        const highestSaleResult = await Sale.max('finalAmount', { where: whereClause });
        highestSale = highestSaleResult || 0;
      } catch (error) {
        console.log('Error getting highest sale:', error.message);
      }

      try {
        dailySummary = await Sale.findAll({
          where: whereClause,
          attributes: [
            [sequelize.fn('DATE', sequelize.col('saleDate')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'salesCount'],
            [sequelize.fn('SUM', sequelize.col('finalAmount')), 'dailyRevenue']
          ],
          group: [sequelize.fn('DATE', sequelize.col('saleDate'))],
          order: [[sequelize.fn('DATE', sequelize.col('saleDate')), 'DESC']],
          raw: true,
          limit: 10
        });
      } catch (error) {
        console.log('Error getting daily summary:', error.message);
        dailySummary = [];
      }

      res.json({
        success: true,
        data: {
          overview: {
            totalSales,
            totalRevenue: parseFloat(totalRevenue).toFixed(2),
            averageSale: parseFloat(averageSale).toFixed(2),
            highestSale: parseFloat(highestSale).toFixed(2)
          },
          dailySummary: dailySummary || []
        }
      });

    } catch (error) {
      console.error('Sales stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching sales statistics',
        error: error.message
      });
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

  /**
   * Refund sale
   * POST /api/sales/:id/refund
   */
  async refundSale(req, res) {
    try {
      const { id } = req.params;
      const { reason, refundAmount } = req.body;

      // Find sale with items
      const sale = await Sale.findByPk(id, {
        include: [{
          model: SaleItem,
          as: 'items',
          include: [{
            model: Medicine,
            as: 'medicine'
          }]
        }]
      });

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'Sale not found'
        });
      }

      if (sale.status === 'refunded') {
        return res.status(400).json({
          success: false,
          message: 'Sale already refunded'
        });
      }

      // Calculate refund amount if not provided
      const calculatedRefund = refundAmount || sale.finalAmount;

      // Restore inventory
      for (const item of sale.items) {
        await Medicine.increment('stockQuantity', {
          by: item.quantity,
          where: { id: item.medicineId }
        });
      }

      // Update sale status
      await sale.update({
        status: 'refunded',
        refundAmount: calculatedRefund,
        refundReason: reason,
        refundDate: new Date()
      });

      res.json({
        success: true,
        message: 'Sale refunded successfully',
        data: {
          saleId: sale.id,
          refundAmount: calculatedRefund,
          reason: reason,
          refundDate: new Date()
        }
      });

    } catch (error) {
      console.error('Refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing refund',
        error: error.message
      });
    }
  }

  /**
   * Get receipt
   * GET /api/sales/:id/receipt
   */
  async getReceipt(req, res) {
    try {
      const { id } = req.params;

      const sale = await Sale.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer'
          },
          {
            model: User,
            as: 'user'
          },
          {
            model: SaleItem,
            as: 'items',
            include: [{
              model: Medicine,
              as: 'medicine',
              include: [{
                model: Category,
                as: 'category'
              }]
            }]
          }
        ]
      });

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'Sale not found'
        });
      }

      // Generate receipt data
      const receipt = {
        receiptNumber: `RCP-${sale.id.toString().padStart(6, '0')}`,
        saleDate: sale.saleDate,
        customer: sale.customer ? {
          name: `${sale.customer.firstName} ${sale.customer.lastName}`,
          phone: sale.customer.phone,
          loyaltyPoints: sale.customer.loyaltyPoints
        } : { name: 'Walk-in Customer' },
        cashier: sale.user.username,
        items: sale.items.map(item => ({
          name: item.medicine.name,
          category: item.medicine.category.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          totalPrice: item.totalPrice
        })),
        summary: {
          subtotal: sale.totalAmount,
          tax: sale.taxAmount || 0,
          discount: sale.items.reduce((sum, item) => sum + (item.discount || 0), 0),
          final: sale.finalAmount
        },
        payment: {
          method: sale.paymentMethod,
          received: sale.amountReceived || sale.finalAmount,
          change: (sale.amountReceived || sale.finalAmount) - sale.finalAmount
        }
      };

      res.json({
        success: true,
        data: receipt
      });

    } catch (error) {
      console.error('Receipt generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating receipt',
        error: error.message
      });
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
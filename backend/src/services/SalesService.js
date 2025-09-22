const SalesRepository = require('../repositories/SalesRepository');
const BaseRepository = require('../repositories/BaseRepository');
const { Customer, Medicine, SaleItem, sequelize } = require('../models/index');
const SalesValidationError = require('../exceptions/SalesValidationError');
const InsufficientStockError = require('../exceptions/InsufficientStockError');

/**
 * Sales Service - Business logic for sales operations
 * Implements domain rules and orchestrates repository operations
 */
class SalesService {
  constructor() {
    this.salesRepository = new SalesRepository();
    this.customerRepository = new BaseRepository(Customer);
    this.medicineRepository = new BaseRepository(Medicine);
  }

  /**
   * Process a new sale transaction
   * @param {object} saleData - Sale information
   * @param {number} userId - ID of user processing sale
   * @returns {Promise<object>}
   */
  async processSale(saleData, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const { customerId, items, paymentMethod, discountAmount = 0, notes } = saleData;

      // Validate customer if provided
      let customer = null;
      if (customerId) {
        customer = await this.customerRepository.findOne(
          { id: customerId, isActive: true }
        );
        
        if (!customer) {
          throw new SalesValidationError('Customer not found', 'CUSTOMER_NOT_FOUND');
        }
      }

      // Validate and prepare items
      const validatedItems = await this._validateAndPrepareItems(items, transaction);

      // Calculate totals using business rules
      const totals = this._calculateSaleTotals(validatedItems, discountAmount);

      // Create sale record
      const sale = await this.salesRepository.createSaleWithItems({
        customerId: customerId || null,
        userId,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        totalAmount: totals.totalAmount,
        paymentMethod,
        paymentStatus: 'paid',
        notes: notes || null,
        saleDate: new Date()
      }, validatedItems, transaction);

      // Update inventory
      await this._updateInventoryAfterSale(validatedItems, transaction);

      // Update customer loyalty
      if (customer) {
        await this._updateCustomerLoyalty(customer, totals.totalAmount);
      }

      await transaction.commit();

      // Return complete sale data
      return await this.salesRepository.getSaleWithDetails(sale.id);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get sales with advanced filtering
   * @param {object} filters - Filter criteria
   * @returns {Promise<{data: Array, pagination: object, summary: object}>}
   */
  async getSales(filters) {
    const result = await this.salesRepository.getSalesWithFilters(filters);
    
    // Calculate summary for current page
    const summary = this._calculateSalesSummary(result.rows);
    
    return {
      data: result.rows,
      pagination: this._buildPaginationInfo(result, filters),
      summary
    };
  }

  /**
   * Get single sale with full details
   * @param {number} saleId - Sale ID
   * @returns {Promise<object>}
   */
  async getSaleById(saleId) {
    const sale = await this.salesRepository.getSaleWithDetails(saleId);
    
    if (!sale) {
      throw new SalesValidationError('Sale not found', 'SALE_NOT_FOUND');
    }
    
    return sale;
  }

  /**
   * Get today's sales dashboard data
   * @returns {Promise<object>}
   */
  async getTodaysDashboard() {
    return await this.salesRepository.getTodaysSales();
  }

  /**
   * Generate sales report
   * @param {Date} startDate - Report start date
   * @param {Date} endDate - Report end date
   * @param {string} groupBy - Grouping period
   * @returns {Promise<object>}
   */
  async generateSalesReport(startDate, endDate, groupBy = 'day') {
    const [reportData, paymentStats] = await Promise.all([
      this.salesRepository.getSalesReport(startDate, endDate, groupBy),
      this.salesRepository.getPaymentMethodStats(startDate, endDate)
    ]);

    return {
      reportData,
      paymentStats,
      dateRange: { startDate, endDate },
      groupBy,
      generatedAt: new Date()
    };
  }

  /**
   * Process refund for a sale
   * @param {number} saleId - Sale ID
   * @param {string} reason - Refund reason
   * @param {number} amount - Refund amount (optional, defaults to full amount)
   * @returns {Promise<object>}
   */
  async processRefund(saleId, reason, amount = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const sale = await this.salesRepository.getSaleWithDetails(saleId);
      
      if (!sale) {
        throw new SalesValidationError('Sale not found', 'SALE_NOT_FOUND');
      }

      if (sale.paymentStatus === 'refunded') {
        throw new SalesValidationError('Sale already refunded', 'ALREADY_REFUNDED');
      }

      const refundAmount = amount || sale.totalAmount;
      
      // Validate refund amount
      if (refundAmount > sale.totalAmount) {
        throw new SalesValidationError('Refund amount cannot exceed sale total', 'INVALID_REFUND_AMOUNT');
      }

      // Update sale status
      const notes = `${sale.notes || ''}\nREFUND: ${reason} - Amount: ${refundAmount} TND`;
      await this.salesRepository.updateSaleStatus(
        saleId, 
        'refunded', 
        notes, 
        transaction
      );

      // Restore inventory
      await this._restoreInventoryAfterRefund(sale.items, transaction);

      // Update customer loyalty (deduct points/purchases)
      if (sale.customer) {
        await this._adjustCustomerLoyaltyForRefund(sale.customer, refundAmount);
      }

      await transaction.commit();

      return {
        saleId: sale.id,
        refundAmount: parseFloat(refundAmount),
        reason,
        processedAt: new Date()
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get customer purchase history
   * @param {number} customerId - Customer ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<object>}
   */
  async getCustomerHistory(customerId, page = 1, limit = 10) {
    const customer = await this.customerRepository.findOne(
      { id: customerId, isActive: true }
    );
    
    if (!customer) {
      throw new SalesValidationError('Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    const salesHistory = await this.salesRepository.getCustomerSalesHistory(
      customerId, 
      page, 
      limit
    );

    return {
      customer: {
        id: customer.id,
        fullName: customer.getFullName(),
        customerCode: customer.customerCode,
        totalPurchases: customer.totalPurchases,
        loyaltyPoints: customer.loyaltyPoints
      },
      sales: salesHistory.rows,
      pagination: this._buildPaginationInfo(salesHistory, { page, limit })
    };
  }

  // Private helper methods

  /**
   * Validate sale items and check stock availability
   * @private
   */
  async _validateAndPrepareItems(items, transaction) {
    const validatedItems = [];

    for (const item of items) {
      const medicine = await this.medicineRepository.findOne(
        { id: item.medicineId, isActive: true },
        { transaction }
      );

      if (!medicine) {
        throw new SalesValidationError(
          `Medicine with ID ${item.medicineId} not found`,
          'MEDICINE_NOT_FOUND'
        );
      }

      if (medicine.stockQuantity < item.quantity) {
        throw new InsufficientStockError(
          `Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}, Requested: ${item.quantity}`,
          medicine.id,
          medicine.stockQuantity,
          item.quantity
        );
      }

      validatedItems.push({
        medicineId: medicine.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice || medicine.sellingPrice,
        discount: item.discount || 0,
        batchNumber: medicine.batchNumber,
        expiryDate: medicine.expiryDate,
        medicine: medicine // Keep reference for inventory update
      });
    }

    return validatedItems;
  }

  /**
   * Calculate sale totals with business rules
   * @private
   */
  _calculateSaleTotals(items, saleDiscountAmount) {
    const subtotal = items.reduce((sum, item) => {
      return sum + ((item.unitPrice * item.quantity) - item.discount);
    }, 0);

    const discountAmount = parseFloat(saleDiscountAmount) || 0;
    const taxRate = 0.18; // 18% VAT for Tunisia
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount - discountAmount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2))
    };
  }

  /**
   * Update inventory after successful sale
   * @private
   */
  async _updateInventoryAfterSale(items, transaction) {
    await Promise.all(
      items.map(async (item) => {
        await this.medicineRepository.update(
          item.medicine.id,
          { stockQuantity: item.medicine.stockQuantity - item.quantity },
          { transaction }
        );
      })
    );
  }

  /**
   * Update customer loyalty after purchase
   * @private
   */
  async _updateCustomerLoyalty(customer, totalAmount) {
    await customer.updatePurchaseTotal(totalAmount);
  }

  /**
   * Restore inventory after refund
   * @private
   */
  async _restoreInventoryAfterRefund(saleItems, transaction) {
    await Promise.all(
      saleItems.map(async (item) => {
        await this.medicineRepository.update(
          item.medicineId,
          { stockQuantity: item.medicine.stockQuantity + item.quantity },
          { transaction }
        );
      })
    );
  }

  /**
   * Adjust customer loyalty for refund
   * @private
   */
  async _adjustCustomerLoyaltyForRefund(customer, refundAmount) {
    // Deduct from total purchases and loyalty points
    const newTotal = Math.max(0, customer.totalPurchases - refundAmount);
    const pointsToDeduct = Math.floor(refundAmount / 10);
    const newPoints = Math.max(0, customer.loyaltyPoints - pointsToDeduct);

    await customer.update({
      totalPurchases: newTotal,
      loyaltyPoints: newPoints
    });
  }

  /**
   * Calculate sales summary statistics
   * @private
   */
  _calculateSalesSummary(sales) {
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const averageTransaction = sales.length > 0 ? totalRevenue / sales.length : 0;

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageTransaction: parseFloat(averageTransaction.toFixed(2)),
      transactionCount: sales.length
    };
  }

  /**
   * Build pagination information
   * @private
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
}

module.exports = SalesService;
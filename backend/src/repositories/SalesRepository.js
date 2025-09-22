const BaseRepository = require('./BaseRepository');
const { Sale, SaleItem, Customer, Medicine, User, sequelize } = require('../models/index');
const { Op } = require('sequelize');

/**
 * Sales Repository - Handles all sales-related database operations
 * Extends BaseRepository for common CRUD operations
 */
class SalesRepository extends BaseRepository {
  constructor() {
    super(Sale);
  }

  /**
   * Get sale with full relations
   * @param {number} saleId - Sale ID
   * @returns {Promise<object|null>}
   */
  async getSaleWithDetails(saleId) {
    return await this.findById(saleId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          required: false
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: SaleItem,
          as: 'items',
          include: [{
            model: Medicine,
            as: 'medicine'
          }]
        }
      ]
    });
  }

  /**
   * Get paginated sales with filters
   * @param {object} filters - Filter criteria
   * @returns {Promise<{rows: Array, count: number}>}
   */
  async getSalesWithFilters(filters) {
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
    } = filters;

    const where = {};

    // Date range filter
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate[Op.gte] = new Date(startDate);
      if (endDate) where.saleDate[Op.lte] = new Date(endDate);
    }

    // Other filters
    if (customerId) where.customerId = customerId;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (userId) where.userId = userId;

    // Amount range filter
    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.totalAmount[Op.lte] = parseFloat(maxAmount);
    }

    return await this.findAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customerCode', 'firstName', 'lastName'],
          required: false
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: SaleItem,
          as: 'items',
          attributes: ['id', 'quantity', 'unitPrice', 'totalPrice'],
          include: [{
            model: Medicine,
            as: 'medicine',
            attributes: ['id', 'name', 'unit']
          }]
        }
      ],
      page,
      limit,
      order: [[sortBy, sortOrder.toUpperCase()]]
    });
  }

  /**
   * Get today's sales with statistics
   * @returns {Promise<{sales: Array, stats: object}>}
   */
  async getTodaysSales() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const sales = await this.findAll({
      where: {
        saleDate: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      order: [['saleDate', 'DESC']]
    });

    const stats = await this.model.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'avgSaleValue'],
        [sequelize.fn('SUM', sequelize.col('tax_amount')), 'totalTax']
      ],
      where: {
        saleDate: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      raw: true
    });

    return {
      sales: sales.rows,
      stats: stats[0] || {
        totalSales: 0,
        totalRevenue: 0,
        avgSaleValue: 0,
        totalTax: 0
      }
    };
  }

  /**
   * Get sales report with grouping
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} groupBy - Group by period (day, week, month)
   * @returns {Promise<Array>}
   */
  async getSalesReport(startDate, endDate, groupBy = 'day') {
    const dateFormats = {
      hour: '%Y-%m-%d %H:00:00',
      day: '%Y-%m-%d',
      week: '%Y-%u',
      month: '%Y-%m'
    };

    const dateFormat = dateFormats[groupBy] || dateFormats.day;

    return await this.model.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('sale_date'), dateFormat), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'avgSaleValue'],
        [sequelize.fn('SUM', sequelize.col('tax_amount')), 'totalTax']
      ],
      where: {
        saleDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('sale_date'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('sale_date'), dateFormat), 'ASC']],
      raw: true
    });
  }

  /**
   * Get payment method statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>}
   */
  async getPaymentMethodStats(startDate, endDate) {
    return await this.model.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalAmount'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'avgAmount']
      ],
      where: {
        saleDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['paymentMethod'],
      order: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'DESC']],
      raw: true
    });
  }

  /**
   * Create complete sale with items (transaction-safe)
   * @param {object} saleData - Sale data
   * @param {Array} items - Sale items
   * @param {object} transaction - Database transaction
   * @returns {Promise<object>}
   */
  async createSaleWithItems(saleData, items, transaction) {
    // Create the sale
    const sale = await this.create(saleData, { transaction });

    // Create sale items
    const saleItems = items.map(item => ({
      saleId: sale.id,
      ...item
    }));

    await SaleItem.bulkCreate(saleItems, { transaction });

    return sale;
  }

  /**
   * Update sale status (for refunds, etc.)
   * @param {number} saleId - Sale ID
   * @param {string} status - New status
   * @param {string} notes - Additional notes
   * @param {object} transaction - Database transaction
   * @returns {Promise<[number, Array]>}
   */
  async updateSaleStatus(saleId, status, notes, transaction) {
    return await this.update(saleId, {
      paymentStatus: status,
      notes
    }, { transaction });
  }

  /**
   * Get customer sales history
   * @param {number} customerId - Customer ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<{rows: Array, count: number}>}
   */
  async getCustomerSalesHistory(customerId, page = 1, limit = 10) {
    return await this.findAll({
      where: { customerId },
      include: [{
        model: SaleItem,
        as: 'items',
        attributes: ['medicineId', 'quantity', 'unitPrice', 'totalPrice']
      }],
      page,
      limit,
      order: [['saleDate', 'DESC']]
    });
  }

  /**
   * Get sales by user (cashier performance)
   * @param {number} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<{sales: Array, stats: object}>}
   */
  async getUserSalesPerformance(userId, startDate, endDate) {
    const where = { userId };
    
    if (startDate && endDate) {
      where.saleDate = { [Op.between]: [startDate, endDate] };
    }

    const sales = await this.findAll({ where });
    
    const stats = await this.model.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'avgSaleValue']
      ],
      where,
      raw: true
    });

    return {
      sales: sales.rows,
      stats: stats[0] || { totalSales: 0, totalRevenue: 0, avgSaleValue: 0 }
    };
  }
}

module.exports = SalesRepository;
const BaseRepository = require('./BaseRepository');
const { Supplier, Medicine, sequelize } = require('../models/index');
const { Op } = require('sequelize');

/**
 * Supplier Repository - Handles supplier-specific database operations
 */
class SupplierRepository extends BaseRepository {
  constructor() {
    super(Supplier);
  }

  /**
   * Get suppliers with medicine count
   * @returns {Promise<Array>}
   */
  async getSuppliersWithMedicineCount() {
    return await this.model.findAll({
      attributes: [
        'id',
        'name',
        'contactPerson',
        'phone',
        'email',
        'city',
        'country',
        'rating',
        'paymentTerms',
        'isActive',
        'createdAt',
        [sequelize.fn('COUNT', sequelize.col('medicines.id')), 'medicineCount']
      ],
      include: [{
        model: Medicine,
        as: 'medicines',
        attributes: [],
        required: false,
        where: { isActive: true }
      }],
      group: ['Supplier.id'],
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get supplier with medicines
   * @param {number} supplierId - Supplier ID
   * @returns {Promise<object|null>}
   */
  async getSupplierWithMedicines(supplierId) {
    return await this.findById(supplierId, {
      include: [{
        model: Medicine,
        as: 'medicines',
        where: { isActive: true },
        required: false,
        order: [['name', 'ASC']]
      }]
    });
  }

  /**
   * Search suppliers with advanced filters
   * @param {object} filters - Search filters
   * @returns {Promise<{rows: Array, count: number}>}
   */
  async searchSuppliersAdvanced(filters) {
    const {
      search,
      city,
      country,
      rating,
      paymentTerms,
      activeOnly = true,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = filters;

    const where = {};

    if (activeOnly) {
      where.isActive = true;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } }
      ];
    }

    if (city) {
      where.city = { [Op.like]: `%${city}%` };
    }

    if (country) {
      where.country = country;
    }

    if (rating) {
      where.rating = { [Op.gte]: parseFloat(rating) };
    }

    if (paymentTerms) {
      where.paymentTerms = paymentTerms;
    }

    return await this.findAll({
      where,
      page,
      limit,
      order: [[sortBy, sortOrder.toUpperCase()]]
    });
  }

  /**
   * Get top-rated suppliers
   * @param {number} limit - Number of suppliers to return
   * @returns {Promise<Array>}
   */
  async getTopRatedSuppliers(limit = 10) {
    return await this.model.findAll({
      where: {
        isActive: true,
        rating: { [Op.ne]: null }
      },
      order: [['rating', 'DESC'], ['name', 'ASC']],
      limit
    });
  }

  /**
   * Get suppliers by payment terms
   * @param {string} paymentTerms - Payment terms
   * @returns {Promise<Array>}
   */
  async getSuppliersByPaymentTerms(paymentTerms) {
    return await this.model.findAll({
      where: {
        paymentTerms,
        isActive: true
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get supplier statistics
   * @returns {Promise<object>}
   */
  async getSupplierStats() {
    const stats = await this.model.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSuppliers'],
        [sequelize.fn('COUNT', 
          sequelize.literal('CASE WHEN is_active = 1 THEN 1 END')
        ), 'activeSuppliers'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        [sequelize.fn('COUNT', 
          sequelize.literal('CASE WHEN rating >= 4 THEN 1 END')
        ), 'topRatedSuppliers'],
        [sequelize.fn('SUM', sequelize.col('credit_limit')), 'totalCreditLimit']
      ],
      raw: true
    });

    // Get country distribution
    const countryStats = await this.model.findAll({
      attributes: [
        'country',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['country'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });

    // Get payment terms distribution
    const paymentTermsStats = await this.model.findAll({
      attributes: [
        'paymentTerms',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['paymentTerms'],
      order: [['paymentTerms', 'ASC']],
      raw: true
    });

    return {
      overview: stats[0] || {
        totalSuppliers: 0,
        activeSuppliers: 0,
        avgRating: 0,
        topRatedSuppliers: 0,
        totalCreditLimit: 0
      },
      countryDistribution: countryStats,
      paymentTermsDistribution: paymentTermsStats
    };
  }

  /**
   * Check if supplier can be deleted
   * @param {number} supplierId - Supplier ID
   * @returns {Promise<boolean>}
   */
  async canBeDeleted(supplierId) {
    // Check if supplier has any medicines
    const medicineCount = await Medicine.count({
      where: {
        supplierId,
        isActive: true
      }
    });

    // TODO: Also check for purchase orders when implemented
    // const poCount = await PurchaseOrder.count({
    //   where: { supplierId }
    // });

    return medicineCount === 0;
  }

  /**
   * Get supplier performance metrics
   * @param {number} supplierId - Supplier ID
   * @returns {Promise<object>}
   */
  async getSupplierPerformance(supplierId) {
    // Get basic supplier info
    const supplier = await this.findById(supplierId);
    
    if (!supplier) {
      return null;
    }

    // Get medicine count and value
    const medicineStats = await Medicine.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'medicineCount'],
        [sequelize.fn('SUM', sequelize.col('stock_quantity')), 'totalStock'],
        [sequelize.fn('SUM', 
          sequelize.literal('stock_quantity * selling_price')
        ), 'totalValue'],
        [sequelize.fn('AVG', sequelize.col('selling_price')), 'avgPrice']
      ],
      where: {
        supplierId,
        isActive: true
      },
      raw: true
    });

    // TODO: Add purchase order statistics when implemented
    const purchaseOrderStats = {
      totalOrders: 0,
      totalValue: 0,
      avgOrderValue: 0,
      onTimeDeliveries: 0,
      deliveryPerformance: 0
    };

    return {
      supplier: supplier.toJSON(),
      medicineStats: medicineStats[0] || {
        medicineCount: 0,
        totalStock: 0,
        totalValue: 0,
        avgPrice: 0
      },
      purchaseOrderStats
    };
  }
}

module.exports = SupplierRepository;
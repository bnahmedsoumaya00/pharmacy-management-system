const BaseRepository = require('./BaseRepository');
const { Medicine } = require('../models');
const { Op, literal, fn, col } = require('sequelize');

class MedicineRepository extends BaseRepository {
  constructor() {
    super(Medicine);
  }

  /**
   * Find medicines with low stock
   * @param {number} threshold - Custom threshold or use model's minStockLevel
   * @returns {Array} - Array of medicines with low stock
   */
  async findLowStock(threshold = null) {
    const whereClause = {
      isActive: true
    };

    if (threshold) {
      whereClause.stockQuantity = { [Op.lte]: threshold };
    } else {
      // Use the model's static method for dynamic comparison
      return await Medicine.findLowStock();
    }

    return await this.model.findAll({
      where: whereClause,
      order: [['stockQuantity', 'ASC']]
    });
  }

  /**
   * Find medicines expiring within specified days
   * @param {number} days - Number of days to look ahead
   * @returns {Array} - Array of expiring medicines
   */
  async findExpiring(days = 30) {
    return await Medicine.findExpiring(days);
  }

  /**
   * Find expired medicines
   * @returns {Array} - Array of expired medicines
   */
  async findExpired() {
    return await Medicine.findExpired();
  }

  /**
   * Search medicines by name, generic name, or brand
   * @param {string} searchTerm - Search term
   * @returns {Array} - Array of matching medicines
   */
  async searchByName(searchTerm) {
    return await Medicine.searchByName(searchTerm);
  }

  /**
   * Find medicine by barcode
   * @param {string} barcode - Medicine barcode
   * @returns {Object|null} - Medicine object or null
   */
  async findByBarcode(barcode) {
    return await this.model.findOne({
      where: { 
        barcode,
        isActive: true
      }
    });
  }

  /**
   * Find medicines by category
   * @param {number} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Array} - Array of medicines in category
   */
  async findByCategory(categoryId, options = {}) {
    const { limit, offset, includeInactive = false } = options;
    
    const whereClause = { categoryId };
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    return await this.model.findAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });
  }

  /**
   * Find medicines by supplier
   * @param {number} supplierId - Supplier ID
   * @param {Object} options - Query options
   * @returns {Array} - Array of medicines from supplier
   */
  async findBySupplier(supplierId, options = {}) {
    const { limit, offset, includeInactive = false } = options;
    
    const whereClause = { supplierId };
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    return await this.model.findAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });
  }

  /**
   * Find medicines requiring prescription
   * @returns {Array} - Array of prescription medicines
   */
  async findPrescriptionRequired() {
    return await this.model.findAll({
      where: {
        isPrescriptionRequired: true,
        isActive: true
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Find medicines by stock range
   * @param {number} minStock - Minimum stock quantity
   * @param {number} maxStock - Maximum stock quantity
   * @returns {Array} - Array of medicines within stock range
   */
  async findByStockRange(minStock, maxStock) {
    return await this.model.findAll({
      where: {
        stockQuantity: {
          [Op.between]: [minStock, maxStock]
        },
        isActive: true
      },
      order: [['stockQuantity', 'ASC']]
    });
  }

  /**
   * Find medicines by price range
   * @param {number} minPrice - Minimum selling price
   * @param {number} maxPrice - Maximum selling price
   * @returns {Array} - Array of medicines within price range
   */
  async findByPriceRange(minPrice, maxPrice) {
    return await this.model.findAll({
      where: {
        sellingPrice: {
          [Op.between]: [minPrice, maxPrice]
        },
        isActive: true
      },
      order: [['sellingPrice', 'ASC']]
    });
  }

  /**
   * Find medicines by expiry date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} - Array of medicines expiring in date range
   */
  async findByExpiryRange(startDate, endDate) {
    return await this.model.findAll({
      where: {
        expiryDate: {
          [Op.between]: [startDate, endDate]
        },
        isActive: true
      },
      order: [['expiryDate', 'ASC']]
    });
  }

  /**
   * Advanced search with multiple filters
   * @param {Object} filters - Search filters
   * @returns {Array} - Array of matching medicines
   */
  async advancedSearch(filters = {}) {
    const {
      name,
      categoryId,
      supplierId,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      isPrescriptionRequired,
      isLowStock,
      isExpiringSoon,
      location,
      limit = 50,
      offset = 0
    } = filters;

    const whereClause = { isActive: true };

    // Name search
    if (name) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${name}%` } },
        { genericName: { [Op.like]: `%${name}%` } },
        { brand: { [Op.like]: `%${name}%` } }
      ];
    }

    // Category filter
    if (categoryId) whereClause.categoryId = categoryId;

    // Supplier filter
    if (supplierId) whereClause.supplierId = supplierId;

    // Price range
    if (minPrice || maxPrice) {
      whereClause.sellingPrice = {};
      if (minPrice) whereClause.sellingPrice[Op.gte] = minPrice;
      if (maxPrice) whereClause.sellingPrice[Op.lte] = maxPrice;
    }

    // Stock range
    if (minStock || maxStock) {
      whereClause.stockQuantity = {};
      if (minStock) whereClause.stockQuantity[Op.gte] = minStock;
      if (maxStock) whereClause.stockQuantity[Op.lte] = maxStock;
    }

    // Prescription requirement
    if (typeof isPrescriptionRequired === 'boolean') {
      whereClause.isPrescriptionRequired = isPrescriptionRequired;
    }

    // Location filter
    if (location) {
      whereClause.location = { [Op.like]: `%${location}%` };
    }

    // Low stock filter
    if (isLowStock) {
      whereClause[Op.and] = literal('stock_quantity <= min_stock_level');
    }

    // Expiring soon filter
    if (isExpiringSoon) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      whereClause.expiryDate = {
        [Op.lte]: futureDate,
        [Op.gte]: new Date()
      };
    }

    return await this.model.findAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']]
    });
  }

  /**
   * Update stock quantity
   * @param {number} medicineId - Medicine ID
   * @param {number} quantity - New quantity
   * @returns {Array} - Update result
   */
  async updateStock(medicineId, quantity) {
    return await this.model.update(
      { stockQuantity: quantity },
      { where: { id: medicineId } }
    );
  }

  /**
   * Adjust stock quantity (add/subtract)
   * @param {number} medicineId - Medicine ID
   * @param {number} adjustment - Quantity adjustment (positive or negative)
   * @returns {Object} - Updated medicine
   */
  async adjustStock(medicineId, adjustment) {
    const medicine = await this.findById(medicineId);
    if (!medicine) {
      throw new Error('Medicine not found');
    }

    const newQuantity = medicine.stockQuantity + adjustment;
    if (newQuantity < 0) {
      throw new Error('Insufficient stock for adjustment');
    }

    await this.updateStock(medicineId, newQuantity);
    return await this.findById(medicineId);
  }

  /**
   * Get comprehensive inventory statistics
   * @returns {Object} - Inventory statistics
   */
  async getInventoryStats() {
    return await Medicine.getInventoryStats();
  }

  /**
   * Get medicines grouped by category with counts
   * @returns {Array} - Category statistics
   */
  async getCategoryStats() {
    return await this.model.findAll({
      attributes: [
        'categoryId',
        [fn('COUNT', col('id')), 'medicineCount'],
        [fn('SUM', col('stock_quantity')), 'totalStock'],
        [fn('SUM', literal('stock_quantity * selling_price')), 'totalValue']
      ],
      where: { isActive: true },
      group: ['categoryId'],
      order: [[literal('medicineCount'), 'DESC']]
    });
  }

  /**
   * Get medicines grouped by supplier with counts
   * @returns {Array} - Supplier statistics
   */
  async getSupplierStats() {
    return await this.model.findAll({
      attributes: [
        'supplierId',
        [fn('COUNT', col('id')), 'medicineCount'],
        [fn('SUM', col('stock_quantity')), 'totalStock'],
        [fn('SUM', literal('stock_quantity * selling_price')), 'totalValue']
      ],
      where: { isActive: true },
      group: ['supplierId'],
      order: [[literal('medicineCount'), 'DESC']]
    });
  }

  /**
   * Get top selling medicines by value
   * @param {number} limit - Number of medicines to return
   * @returns {Array} - Top medicines by stock value
   */
  async getTopMedicinesByValue(limit = 10) {
    return await this.model.findAll({
      where: { isActive: true },
      order: [[literal('stock_quantity * selling_price'), 'DESC']],
      limit
    });
  }

  /**
   * Find medicines with highest profit margins
   * @param {number} limit - Number of medicines to return
   * @returns {Array} - Medicines with highest profit margins
   */
  async getHighestProfitMargins(limit = 10) {
    return await this.model.findAll({
      where: { 
        isActive: true,
        purchasePrice: { [Op.gt]: 0 }
      },
      order: [[literal('((selling_price - purchase_price) / purchase_price) * 100'), 'DESC']],
      limit
    });
  }

  /**
   * Check if barcode is unique (excluding specific medicine)
   * @param {string} barcode - Barcode to check
   * @param {number} excludeId - Medicine ID to exclude from check
   * @returns {boolean} - True if unique, false otherwise
   */
  async isBarcodeUnique(barcode, excludeId = null) {
    const whereClause = { barcode };
    
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const medicine = await this.model.findOne({ where: whereClause });
    return !medicine;
  }

  /**
   * Bulk update medicine status
   * @param {Array} medicineIds - Array of medicine IDs
   * @param {boolean} isActive - Active status
   * @returns {Array} - Update result
   */
  async bulkUpdateStatus(medicineIds, isActive) {
    return await this.model.update(
      { isActive },
      {
        where: {
          id: { [Op.in]: medicineIds }
        }
      }
    );
  }

  /**
   * Get medicines by location
   * @param {string} location - Storage location
   * @returns {Array} - Medicines in specified location
   */
  async findByLocation(location) {
    return await this.model.findAll({
      where: {
        location: { [Op.like]: `%${location}%` },
        isActive: true
      },
      order: [['name', 'ASC']]
    });
  }
}

module.exports = MedicineRepository;
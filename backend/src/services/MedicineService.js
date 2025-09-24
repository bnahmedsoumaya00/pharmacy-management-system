const MedicineRepository = require('../repositories/MedicineRepository');
const { ValidationError } = require('../exceptions/ValidationError');
const { InsufficientStockError } = require('../exceptions/InsufficientStockError');

class MedicineService {
  constructor() {
    this.medicineRepository = new MedicineRepository();
  }

  /**
   * Get all medicines with options
   * @param {Object} options - Query options
   * @returns {Array} - Array of medicines
   */
  async getAllMedicines(options = {}) {
    return await this.medicineRepository.findAll(options);
  }

  /**
   * Get medicine by ID
   * @param {number} id - Medicine ID
   * @returns {Object|null} - Medicine object or null
   */
  async getMedicineById(id) {
    const medicine = await this.medicineRepository.findById(id);
    if (!medicine) {
      throw new ValidationError('Medicine not found', 'MEDICINE_NOT_FOUND');
    }
    return medicine;
  }

  /**
   * Create new medicine
   * @param {Object} medicineData - Medicine data
   * @returns {Object} - Created medicine
   */
  async createMedicine(medicineData) {
    // Check barcode uniqueness if provided
    if (medicineData.barcode) {
      const isUnique = await this.medicineRepository.isBarcodeUnique(medicineData.barcode);
      if (!isUnique) {
        throw new ValidationError('Barcode already exists', 'BARCODE_EXISTS');
      }
    }

    // Validate stock levels
    if (medicineData.stockQuantity < 0) {
      throw new ValidationError('Stock quantity cannot be negative', 'INVALID_STOCK');
    }

    if (medicineData.minStockLevel && medicineData.stockQuantity < medicineData.minStockLevel) {
      console.warn(`Warning: Initial stock (${medicineData.stockQuantity}) is below minimum level (${medicineData.minStockLevel})`);
    }

    // Validate prices
    if (medicineData.sellingPrice <= medicineData.purchasePrice) {
      console.warn('Warning: Selling price is not higher than purchase price');
    }

    return await this.medicineRepository.create(medicineData);
  }

  /**
   * Update medicine
   * @param {number} id - Medicine ID
   * @param {Object} updateData - Update data
   * @returns {Object} - Updated medicine
   */
  async updateMedicine(id, updateData) {
    // Check if medicine exists
    const existingMedicine = await this.medicineRepository.findById(id);
    if (!existingMedicine) {
      throw new ValidationError('Medicine not found', 'MEDICINE_NOT_FOUND');
    }

    // Check barcode uniqueness if being updated
    if (updateData.barcode && updateData.barcode !== existingMedicine.barcode) {
      const isUnique = await this.medicineRepository.isBarcodeUnique(updateData.barcode, id);
      if (!isUnique) {
        throw new ValidationError('Barcode already exists', 'BARCODE_EXISTS');
      }
    }

    // Validate stock levels
    if (updateData.stockQuantity !== undefined && updateData.stockQuantity < 0) {
      throw new ValidationError('Stock quantity cannot be negative', 'INVALID_STOCK');
    }

    const updatedMedicine = await this.medicineRepository.update(id, updateData);
    return updatedMedicine;
  }

  /**
   * Delete medicine (soft delete)
   * @param {number} id - Medicine ID
   * @returns {boolean} - Success status
   */
  async deleteMedicine(id) {
    const existingMedicine = await this.medicineRepository.findById(id);
    if (!existingMedicine) {
      throw new ValidationError('Medicine not found', 'MEDICINE_NOT_FOUND');
    }

    // Check if medicine is used in any pending sales
    // This would require checking sale_items table
    // For now, we'll just soft delete by setting isActive = false
    
    return await this.medicineRepository.update(id, { isActive: false });
  }

  /**
   * Get low stock medicines
   * @param {number} threshold - Custom threshold or use model's minStockLevel
   * @returns {Array} - Array of low stock medicines
   */
  async getLowStockMedicines(threshold = null) {
    return await this.medicineRepository.findLowStock(threshold);
  }

  /**
   * Get expiring medicines
   * @param {number} days - Number of days to look ahead
   * @returns {Array} - Array of expiring medicines
   */
  async getExpiringMedicines(days = 30) {
    return await this.medicineRepository.findExpiring(days);
  }

  /**
   * Get expired medicines
   * @returns {Array} - Array of expired medicines
   */
  async getExpiredMedicines() {
    return await this.medicineRepository.findExpired();
  }

  /**
   * Adjust stock quantity
   * @param {number} id - Medicine ID
   * @param {number} quantity - Quantity adjustment (positive or negative)
   * @param {string} reason - Reason for adjustment
   * @returns {Object} - Updated medicine
   */
  async adjustStock(id, quantity, reason = 'Manual adjustment') {
    const medicine = await this.medicineRepository.findById(id);
    if (!medicine) {
      throw new ValidationError('Medicine not found', 'MEDICINE_NOT_FOUND');
    }

    const newStock = medicine.stockQuantity + quantity;
    
    if (newStock < 0) {
      throw new InsufficientStockError(
        `Cannot adjust stock. Would result in negative stock (${newStock}).`,
        'INSUFFICIENT_STOCK'
      );
    }

    // Update stock
    const updatedMedicine = await this.medicineRepository.adjustStock(id, quantity);

    // TODO: Log stock movement in stock_movements table
    // await this.logStockMovement(id, quantity, 'adjustment', reason);

    return updatedMedicine;
  }

  /**
   * Search medicines by name, generic name, or brand
   * @param {string} searchTerm - Search term
   * @returns {Array} - Array of matching medicines
   */
  async searchMedicines(searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new ValidationError('Search term must be at least 2 characters long', 'INVALID_SEARCH');
    }

    return await this.medicineRepository.searchByName(searchTerm.trim());
  }

  /**
   * Get medicine statistics
   * @returns {Object} - Medicine statistics
   */
  async getMedicineStats() {
    return await this.medicineRepository.getInventoryStats();
  }

  /**
   * Advanced search with multiple filters
   * @param {Object} filters - Search filters
   * @returns {Array} - Array of filtered medicines
   */
  async advancedSearch(filters = {}) {
    // Validate numeric filters
    if (filters.minPrice && filters.minPrice < 0) {
      throw new ValidationError('Minimum price cannot be negative', 'INVALID_PRICE');
    }
    
    if (filters.maxPrice && filters.maxPrice < 0) {
      throw new ValidationError('Maximum price cannot be negative', 'INVALID_PRICE');
    }

    if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
      throw new ValidationError('Minimum price cannot be greater than maximum price', 'INVALID_PRICE_RANGE');
    }

    return await this.medicineRepository.advancedSearch(filters);
  }

  /**
   * Get medicine by barcode
   * @param {string} barcode - Barcode
   * @returns {Object|null} - Medicine object or null
   */
  async getMedicineByBarcode(barcode) {
    if (!barcode) {
      throw new ValidationError('Barcode is required', 'BARCODE_REQUIRED');
    }

    return await this.medicineRepository.findByBarcode(barcode);
  }

  /**
   * Get medicines by category
   * @param {number} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Array} - Array of medicines in category
   */
  async getMedicinesByCategory(categoryId, options = {}) {
    return await this.medicineRepository.findByCategory(categoryId, options);
  }

  /**
   * Get medicines by supplier
   * @param {number} supplierId - Supplier ID
   * @param {Object} options - Query options
   * @returns {Array} - Array of medicines from supplier
   */
  async getMedicinesBySupplier(supplierId, options = {}) {
    return await this.medicineRepository.findBySupplier(supplierId, options);
  }

  /**
   * Get prescription required medicines
   * @returns {Array} - Array of prescription medicines
   */
  async getPrescriptionMedicines() {
    return await this.medicineRepository.findPrescriptionRequired();
  }

  /**
   * Get medicines by price range
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @returns {Array} - Array of medicines within price range
   */
  async getMedicinesByPriceRange(minPrice, maxPrice) {
    if (minPrice < 0 || maxPrice < 0) {
      throw new ValidationError('Price values cannot be negative', 'INVALID_PRICE');
    }

    if (minPrice > maxPrice) {
      throw new ValidationError('Minimum price cannot be greater than maximum price', 'INVALID_PRICE_RANGE');
    }

    return await this.medicineRepository.findByPriceRange(minPrice, maxPrice);
  }

  /**
   * Get medicines by stock range
   * @param {number} minStock - Minimum stock
   * @param {number} maxStock - Maximum stock
   * @returns {Array} - Array of medicines within stock range
   */
  async getMedicinesByStockRange(minStock, maxStock) {
    if (minStock < 0 || maxStock < 0) {
      throw new ValidationError('Stock values cannot be negative', 'INVALID_STOCK');
    }

    if (minStock > maxStock) {
      throw new ValidationError('Minimum stock cannot be greater than maximum stock', 'INVALID_STOCK_RANGE');
    }

    return await this.medicineRepository.findByStockRange(minStock, maxStock);
  }

  /**
   * Get medicines by location
   * @param {string} location - Storage location
   * @returns {Array} - Array of medicines in specified location
   */
  async getMedicinesByLocation(location) {
    if (!location || location.trim().length < 1) {
      throw new ValidationError('Location is required', 'LOCATION_REQUIRED');
    }

    return await this.medicineRepository.findByLocation(location.trim());
  }

  /**
   * Update multiple medicine statuses
   * @param {Array} medicineIds - Array of medicine IDs
   * @param {boolean} isActive - Active status
   * @returns {Object} - Update result
   */
  async bulkUpdateStatus(medicineIds, isActive) {
    if (!Array.isArray(medicineIds) || medicineIds.length === 0) {
      throw new ValidationError('Medicine IDs array is required', 'INVALID_IDS');
    }

    return await this.medicineRepository.bulkUpdateStatus(medicineIds, isActive);
  }

  /**
   * Get top medicines by inventory value
   * @param {number} limit - Number of medicines to return
   * @returns {Array} - Top medicines by value
   */
  async getTopMedicinesByValue(limit = 10) {
    return await this.medicineRepository.getTopMedicinesByValue(limit);
  }

  /**
   * Get medicines with highest profit margins
   * @param {number} limit - Number of medicines to return
   * @returns {Array} - Medicines with highest profit margins
   */
  async getHighestProfitMargins(limit = 10) {
    return await this.medicineRepository.getHighestProfitMargins(limit);
  }
}

module.exports = MedicineService;
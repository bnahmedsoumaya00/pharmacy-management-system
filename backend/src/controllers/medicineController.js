const Medicine = require('../models/Medicine');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Get all medicines with pagination and filtering
const getAllMedicines = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      category, 
      lowStock, 
      expiring,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * parseInt(limit);
    const whereClause = { isActive: true };

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { genericName: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } }
      ];
    }

    // Category filter
    if (category) {
      whereClause.categoryId = category;
    }

    // Low stock filter
    if (lowStock === 'true') {
      whereClause[Op.and] = [
        { [Op.literal]: 'stock_quantity <= min_stock_level' }
      ];
    }

    // Expiring soon filter (30 days)
    if (expiring === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      whereClause.expiryDate = {
        [Op.lte]: thirtyDaysFromNow,
        [Op.gte]: new Date()
      };
    }

    const { count, rows: medicines } = await Medicine.findAndCountAll({
      where: whereClause,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
        required: false
      }],
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      distinct: true
    });

    // Add computed fields
    const medicinesWithStatus = medicines.map(medicine => {
      const medicineData = medicine.toJSON();
      return {
        ...medicineData,
        isLowStock: medicine.isLowStock(),
        isExpiringSoon: medicine.isExpiringSoon(),
        isExpired: medicine.isExpired(),
        profitMargin: medicine.calculateProfitMargin(),
        totalValue: medicine.getTotalValue()
      };
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      message: 'Medicines retrieved successfully',
      data: {
        medicines: medicinesWithStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve medicines',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get single medicine by ID
const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findOne({
      where: { id, isActive: true },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'description'],
        required: false
      }]
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
        code: 'MEDICINE_NOT_FOUND'
      });
    }

    const medicineData = medicine.toJSON();
    const medicineWithStatus = {
      ...medicineData,
      isLowStock: medicine.isLowStock(),
      isExpiringSoon: medicine.isExpiringSoon(),
      isExpired: medicine.isExpired(),
      profitMargin: medicine.calculateProfitMargin(),
      totalValue: medicine.getTotalValue()
    };

    res.json({
      success: true,
      message: 'Medicine retrieved successfully',
      data: { medicine: medicineWithStatus }
    });

  } catch (error) {
    console.error('Get medicine by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve medicine',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create new medicine
const createMedicine = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const medicineData = req.body;

    // Check if barcode already exists (if provided)
    if (medicineData.barcode) {
      const existingMedicine = await Medicine.findOne({
        where: { barcode: medicineData.barcode, isActive: true }
      });

      if (existingMedicine) {
        return res.status(409).json({
          success: false,
          message: 'Medicine with this barcode already exists',
          code: 'BARCODE_EXISTS'
        });
      }
    }

    // Validate price logic
    if (medicineData.sellingPrice <= medicineData.purchasePrice) {
      return res.status(400).json({
        success: false,
        message: 'Selling price must be greater than purchase price',
        code: 'INVALID_PRICING'
      });
    }

    // Validate stock levels
    if (medicineData.minStockLevel >= medicineData.maxStockLevel) {
      return res.status(400).json({
        success: false,
        message: 'Maximum stock level must be greater than minimum stock level',
        code: 'INVALID_STOCK_LEVELS'
      });
    }

    const newMedicine = await Medicine.create(medicineData);

    // Fetch the created medicine with category
    const createdMedicine = await Medicine.findByPk(newMedicine.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
        required: false
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: { medicine: createdMedicine }
    });

  } catch (error) {
    console.error('Create medicine error:', error);

    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create medicine',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update medicine
const updateMedicine = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Find existing medicine
    const medicine = await Medicine.findOne({
      where: { id, isActive: true }
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
        code: 'MEDICINE_NOT_FOUND'
      });
    }

    // Check barcode uniqueness (if being updated)
    if (updateData.barcode && updateData.barcode !== medicine.barcode) {
      const existingMedicine = await Medicine.findOne({
        where: { 
          barcode: updateData.barcode,
          id: { [Op.ne]: id },
          isActive: true
        }
      });

      if (existingMedicine) {
        return res.status(409).json({
          success: false,
          message: 'Medicine with this barcode already exists',
          code: 'BARCODE_EXISTS'
        });
      }
    }

    // Validate price logic
    const purchasePrice = updateData.purchasePrice || medicine.purchasePrice;
    const sellingPrice = updateData.sellingPrice || medicine.sellingPrice;
    
    if (sellingPrice <= purchasePrice) {
      return res.status(400).json({
        success: false,
        message: 'Selling price must be greater than purchase price',
        code: 'INVALID_PRICING'
      });
    }

    // Validate stock levels
    const minStock = updateData.minStockLevel || medicine.minStockLevel;
    const maxStock = updateData.maxStockLevel || medicine.maxStockLevel;
    
    if (minStock >= maxStock) {
      return res.status(400).json({
        success: false,
        message: 'Maximum stock level must be greater than minimum stock level',
        code: 'INVALID_STOCK_LEVELS'
      });
    }

    await medicine.update(updateData);

    // Fetch updated medicine with category
    const updatedMedicine = await Medicine.findByPk(id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
        required: false
      }]
    });

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: { medicine: updatedMedicine }
    });

  } catch (error) {
    console.error('Update medicine error:', error);

    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update medicine',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Soft delete medicine
const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findOne({
      where: { id, isActive: true }
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
        code: 'MEDICINE_NOT_FOUND'
      });
    }

    await medicine.update({ isActive: false });

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });

  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete medicine',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get low stock medicines
const getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.findLowStock();

    const medicinesWithStatus = medicines.map(medicine => {
      const medicineData = medicine.toJSON();
      return {
        ...medicineData,
        isLowStock: true,
        stockDeficit: medicine.minStockLevel - medicine.stockQuantity,
        profitMargin: medicine.calculateProfitMargin(),
        totalValue: medicine.getTotalValue()
      };
    });

    res.json({
      success: true,
      message: 'Low stock medicines retrieved successfully',
      data: {
        medicines: medicinesWithStatus,
        count: medicines.length
      }
    });

  } catch (error) {
    console.error('Get low stock medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve low stock medicines',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get expiring medicines
const getExpiringMedicines = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const medicines = await Medicine.findExpiring(parseInt(days));

    const medicinesWithStatus = medicines.map(medicine => {
      const medicineData = medicine.toJSON();
      const daysUntilExpiry = Math.ceil((new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        ...medicineData,
        isExpiringSoon: true,
        daysUntilExpiry,
        totalValue: medicine.getTotalValue()
      };
    });

    res.json({
      success: true,
      message: 'Expiring medicines retrieved successfully',
      data: {
        medicines: medicinesWithStatus,
        count: medicines.length,
        warningDays: parseInt(days)
      }
    });

  } catch (error) {
    console.error('Get expiring medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expiring medicines',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get inventory statistics
const getInventoryStats = async (req, res) => {
  try {
    const stats = await Medicine.getInventoryStats();

    res.json({
      success: true,
      message: 'Inventory statistics retrieved successfully',
      data: { stats }
    });

  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Adjust stock quantity
const adjustStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { adjustment, reason } = req.body; // adjustment can be positive or negative

    const medicine = await Medicine.findOne({
      where: { id, isActive: true }
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
        code: 'MEDICINE_NOT_FOUND'
      });
    }

    const newStock = medicine.stockQuantity + adjustment;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock adjustment would result in negative stock',
        code: 'NEGATIVE_STOCK'
      });
    }

    await medicine.update({ stockQuantity: newStock });

    // TODO: Create stock movement record here (when we implement stock movements)

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        medicine: {
          id: medicine.id,
          name: medicine.name,
          previousStock: medicine.stockQuantity - adjustment,
          newStock: newStock,
          adjustment,
          reason
        }
      }
    });

  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust stock',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getLowStockMedicines,
  getExpiringMedicines,
  getInventoryStats,
  adjustStock
};
const MedicineService = require('../services/MedicineService');
const { validationResult } = require('express-validator');

class MedicineController {
  constructor() {
    this.medicineService = new MedicineService();
  }

  // Get all medicines with filtering
  getAllMedicines = async (req, res) => {
    try {
      const { page = 1, limit = 20, category, supplier, search, lowStock, expiring } = req.query;
      const offset = (page - 1) * limit;

      let medicines;
      
      if (search) {
        medicines = await this.medicineService.searchMedicines(search);
      } else if (lowStock) {
        medicines = await this.medicineService.getLowStockMedicines();
      } else if (expiring) {
        medicines = await this.medicineService.getExpiringMedicines(parseInt(expiring));
      } else {
        const filters = {};
        if (category) filters.categoryId = category;
        if (supplier) filters.supplierId = supplier;
        
        medicines = await this.medicineService.advancedSearch({
          ...filters,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      }

      res.json({
        success: true,
        data: medicines,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: medicines.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch medicines',
        error: error.message
      });
    }
  };

  // Get medicine by ID
  getMedicineById = async (req, res) => {
    try {
      const { id } = req.params;
      const medicine = await this.medicineService.getMedicineById(id);

      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: 'Medicine not found'
        });
      }

      res.json({
        success: true,
        data: medicine
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch medicine',
        error: error.message
      });
    }
  };

  // Create new medicine
  createMedicine = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const medicine = await this.medicineService.createMedicine(req.body);

      res.status(201).json({
        success: true,
        message: 'Medicine created successfully',
        data: medicine
      });
    } catch (error) {
      if (error.code === 'BARCODE_EXISTS') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create medicine',
        error: error.message
      });
    }
  };

  // Update medicine
  updateMedicine = async (req, res) => {
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
      const medicine = await this.medicineService.updateMedicine(id, req.body);

      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: 'Medicine not found'
        });
      }

      res.json({
        success: true,
        message: 'Medicine updated successfully',
        data: medicine
      });
    } catch (error) {
      if (error.code === 'BARCODE_EXISTS') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update medicine',
        error: error.message
      });
    }
  };

  // Delete medicine
  deleteMedicine = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.medicineService.deleteMedicine(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Medicine not found'
        });
      }

      res.json({
        success: true,
        message: 'Medicine deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete medicine',
        error: error.message
      });
    }
  };

  // Get medicine statistics
  getMedicineStats = async (req, res) => {
    try {
      const stats = await this.medicineService.getMedicineStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  };

  // Get low stock medicines
  getLowStockMedicines = async (req, res) => {
    try {
      const { threshold } = req.query;
      const medicines = await this.medicineService.getLowStockMedicines(
        threshold ? parseInt(threshold) : null
      );

      res.json({
        success: true,
        data: medicines,
        count: medicines.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch low stock medicines',
        error: error.message
      });
    }
  };

  // Get expiring medicines
  getExpiringMedicines = async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const medicines = await this.medicineService.getExpiringMedicines(parseInt(days));

      res.json({
        success: true,
        data: medicines,
        count: medicines.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expiring medicines',
        error: error.message
      });
    }
  };

  // Adjust stock
  adjustStock = async (req, res) => {
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
      const { quantity, reason } = req.body;

      const medicine = await this.medicineService.adjustStock(id, quantity, reason);

      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: medicine
      });
    } catch (error) {
      if (error.message.includes('Insufficient stock')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to adjust stock',
        error: error.message
      });
    }
  };

  // Search medicines
  searchMedicines = async (req, res) => {
    try {
      const { q: searchTerm } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      const medicines = await this.medicineService.searchMedicines(searchTerm);

      res.json({
        success: true,
        data: medicines,
        count: medicines.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to search medicines',
        error: error.message
      });
    }
  };

  // Get top medicines by inventory value
  getTopMedicinesByValue = async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const medicines = await this.medicineService.getTopMedicinesByValue(parseInt(limit));

      res.json({
        success: true,
        data: medicines,
        count: medicines.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top medicines by value',
        error: error.message
      });
    }
  };

  // Get medicines with highest profit margins
  getHighestProfitMargins = async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const medicines = await this.medicineService.getHighestProfitMargins(parseInt(limit));

      res.json({
        success: true,
        data: medicines,
        count: medicines.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch medicines with highest margins',
        error: error.message
      });
    }
  };

  // Bulk update medicine status
  bulkUpdateStatus = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { medicineIds, isActive } = req.body;
      const result = await this.medicineService.bulkUpdateStatus(medicineIds, isActive);

      res.json({
        success: true,
        message: `Successfully updated ${result.updatedCount} medicines`,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update medicine status',
        error: error.message
      });
    }
  };
}

module.exports = new MedicineController();
const { Medicine, Category, Supplier, sequelize } = require('../models');
const { Op } = require('sequelize');

class ReportsController {
  async getInventoryReport(req, res) {
    try {
      const { category, lowStock, expiring } = req.query;
      
      let whereClause = { isActive: true };
      
      if (category) {
        whereClause.categoryId = category;
      }
      
      if (lowStock === 'true') {
        whereClause.stockQuantity = { [Op.lte]: sequelize.col('minStockLevel') };
      }
      
      if (expiring === 'true') {
        whereClause.expiryDate = {
          [Op.between]: [new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
        };
      }

      const medicines = await Medicine.findAll({
        where: whereClause,
        include: [
          { model: Category, as: 'category' },
          { model: Supplier, as: 'supplier' }
        ],
        order: [['name', 'ASC']]
      });

      const summary = {
        totalItems: medicines.length,
        totalValue: medicines.reduce((sum, med) => sum + (med.stockQuantity * med.purchasePrice), 0),
        lowStockItems: medicines.filter(med => med.stockQuantity <= med.minStockLevel).length,
        expiringItems: medicines.filter(med => {
          const daysLeft = (new Date(med.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
          return daysLeft <= 30 && daysLeft > 0;
        }).length
      };

      res.json({
        success: true,
        data: {
          summary,
          items: medicines.map(med => ({
            id: med.id,
            name: med.name,
            category: med.category?.name || 'N/A',
            supplier: med.supplier?.name || 'N/A',
            stockQuantity: med.stockQuantity,
            minStockLevel: med.minStockLevel,
            purchasePrice: med.purchasePrice,
            sellingPrice: med.sellingPrice,
            expiryDate: med.expiryDate,
            status: med.stockQuantity <= med.minStockLevel ? 'Low Stock' : 'Normal'
          }))
        }
      });

    } catch (error) {
      console.error('Inventory report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating inventory report',
        error: error.message
      });
    }
  }
}

module.exports = new ReportsController();
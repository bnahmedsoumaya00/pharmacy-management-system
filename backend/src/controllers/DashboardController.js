const { Medicine, Customer, Sale, Category, Supplier, sequelize } = require('../models');
const { Op } = require('sequelize');

class DashboardController {
  async getDashboardStats(req, res) {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get stats safely with error handling
      let totalMedicines = 0;
      let lowStockCount = 0;
      let totalCustomers = 0;
      let todaySales = 0;
      let totalRevenue = 0;
      let expiringMedicines = 0;

      try {
        totalMedicines = await Medicine.count({ 
          where: { isActive: true } 
        });
      } catch (error) {
        console.log('Error counting medicines:', error.message);
      }

      try {
        lowStockCount = await Medicine.count({ 
          where: { 
            isActive: true,
            stockQuantity: { [Op.lte]: 10 } // Simple condition instead of using sequelize.col
          }
        });
      } catch (error) {
        console.log('Error counting low stock:', error.message);
      }

      try {
        totalCustomers = await Customer.count({ 
          where: { isActive: true } 
        });
      } catch (error) {
        console.log('Error counting customers:', error.message);
      }

      try {
        todaySales = await Sale.count({
          where: {
            saleDate: { [Op.gte]: today, [Op.lt]: tomorrow }
          }
        });
      } catch (error) {
        console.log('Error counting today sales:', error.message);
      }

      try {
        const revenueResult = await Sale.sum('finalAmount', {
          where: {
            saleDate: { [Op.gte]: today, [Op.lt]: tomorrow }
          }
        });
        totalRevenue = revenueResult || 0;
      } catch (error) {
        console.log('Error calculating revenue:', error.message);
      }

      try {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        expiringMedicines = await Medicine.count({
          where: {
            isActive: true,
            expiryDate: {
              [Op.between]: [new Date(), expiryDate]
            }
          }
        });
      } catch (error) {
        console.log('Error counting expiring medicines:', error.message);
      }

      res.json({
        success: true,
        data: {
          inventory: {
            totalMedicines,
            lowStockCount,
            expiringCount: expiringMedicines
          },
          sales: {
            todaySales,
            todayRevenue: parseFloat(totalRevenue).toFixed(2)
          },
          customers: {
            totalCustomers
          }
        }
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard statistics',
        error: error.message
      });
    }
  }
}

module.exports = new DashboardController();
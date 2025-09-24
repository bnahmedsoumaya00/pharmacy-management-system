const MedicineService = require('../services/MedicineService');
const CustomerService = require('../services/CustomerService');
const SalesService = require('../services/SalesService');
const SupplierService = require('../services/SupplierService');
const CategoryService = require('../services/CategoryService');

class DashboardController {
  constructor() {
    this.medicineService = new MedicineService();
    this.customerService = new CustomerService();
    this.salesService = new SalesService();
    this.supplierService = new SupplierService();
    this.categoryService = new CategoryService();
  }

  // Get dashboard overview
  getOverview = async (req, res) => {
    try {
      const [
        medicineStats,
        customerStats,
        salesStats,
        supplierStats,
        lowStockCount,
        expiringCount
      ] = await Promise.all([
        this.medicineService.getMedicineStats(),
        this.customerService.getCustomerStats(),
        this.salesService.getSalesStats(),
        this.supplierService.getSupplierStats(),
        this.medicineService.getLowStockMedicines(),
        this.medicineService.getExpiringMedicines()
      ]);

      const overview = {
        medicines: {
          total: medicineStats.totalMedicines || 0,
          lowStock: lowStockCount.length || 0,
          expiring: expiringCount.length || 0,
          value: medicineStats.totalValue || 0
        },
        customers: {
          total: customerStats.totalCustomers || 0,
          active: customerStats.activeCustomers || 0,
          new: customerStats.newCustomers || 0
        },
        sales: {
          today: salesStats.todaySales || 0,
          thisMonth: salesStats.monthlySales || 0,
          totalRevenue: salesStats.totalRevenue || 0,
          transactionCount: salesStats.totalTransactions || 0
        },
        suppliers: {
          total: supplierStats.totalSuppliers || 0,
          active: supplierStats.activeSuppliers || 0,
          topRated: supplierStats.topRatedCount || 0
        }
      };

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard overview',
        error: error.message
      });
    }
  };

  // Get alerts and notifications
  getAlerts = async (req, res) => {
    try {
      const [lowStockMedicines, expiringMedicines, birthdayCustomers] = await Promise.all([
        this.medicineService.getLowStockMedicines(),
        this.medicineService.getExpiringMedicines(30),
        this.customerService.getBirthdayCustomers(7)
      ]);

      const alerts = [
        ...lowStockMedicines.map(medicine => ({
          type: 'low_stock',
          severity: 'warning',
          title: 'Low Stock Alert',
          message: `${medicine.name} is running low (${medicine.stockQuantity} remaining)`,
          data: medicine
        })),
        ...expiringMedicines.map(medicine => ({
          type: 'expiring',
          severity: medicine.expiryDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'error' : 'warning',
          title: 'Expiry Alert',
          message: `${medicine.name} expires on ${medicine.expiryDate.toDateString()}`,
          data: medicine
        })),
        ...birthdayCustomers.map(customer => ({
          type: 'birthday',
          severity: 'info',
          title: 'Customer Birthday',
          message: `${customer.firstName} ${customer.lastName} has a birthday coming up`,
          data: customer
        }))
      ];

      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alerts',
        error: error.message
      });
    }
  };

  // Get chart data for dashboard
  getChartData = async (req, res) => {
    try {
      const { type, period = '7d' } = req.query;

      let chartData = {};

      switch (type) {
        case 'sales':
          chartData = await this.getSalesChartData(period);
          break;
        case 'inventory':
          chartData = await this.getInventoryChartData();
          break;
        case 'customers':
          chartData = await this.getCustomerChartData();
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid chart type'
          });
      }

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chart data',
        error: error.message
      });
    }
  };

  // Helper method for sales chart data
  getSalesChartData = async (period) => {
    // This would need to be implemented based on your sales data structure
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Daily Sales',
        data: [1200, 1900, 3000, 500, 2000, 3000, 4500]
      }]
    };
  };

  // Helper method for inventory chart data
  getInventoryChartData = async () => {
    return {
      labels: ['In Stock', 'Low Stock', 'Out of Stock'],
      datasets: [{
        data: [85, 10, 5],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
      }]
    };
  };

  // Helper method for customer chart data
  getCustomerChartData = async () => {
    return {
      labels: ['New', 'Regular', 'VIP'],
      datasets: [{
        data: [30, 60, 10],
        backgroundColor: ['#3B82F6', '#8B5CF6', '#F59E0B']
      }]
    };
  };
}

module.exports = new DashboardController();
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SaleItem = sequelize.define('SaleItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  saleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sale_id',
    references: {
      model: 'sales',
      key: 'id'
    }
  },
  medicineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'medicine_id',
    references: {
      model: 'medicines',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Quantity must be at least 1'
      },
      isInt: {
        msg: 'Quantity must be a whole number'
      }
    }
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price',
    validate: {
      min: {
        args: [0],
        msg: 'Unit price must be positive'
      },
      isDecimal: {
        msg: 'Unit price must be a valid decimal number'
      }
    }
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Discount cannot be negative'
      },
      isDecimal: {
        msg: 'Discount must be a valid decimal number'
      }
    }
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price',
    validate: {
      min: {
        args: [0],
        msg: 'Total price must be positive'
      },
      isDecimal: {
        msg: 'Total price must be a valid decimal number'
      }
    }
  },
  batchNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'batch_number'
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'expiry_date'
  }
}, {
  tableName: 'sale_items',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Sale items don't get updated
  indexes: [
    {
      fields: ['sale_id']
    },
    {
      fields: ['medicine_id']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    beforeCreate: (saleItem) => {
      // Calculate total price automatically
      saleItem.totalPrice = (saleItem.unitPrice * saleItem.quantity) - saleItem.discount;
    },
    beforeUpdate: (saleItem) => {
      // Recalculate total price if quantity, unit price, or discount changes
      if (saleItem.changed('quantity') || saleItem.changed('unitPrice') || saleItem.changed('discount')) {
        saleItem.totalPrice = (saleItem.unitPrice * saleItem.quantity) - saleItem.discount;
      }
    }
  }
});

// Instance methods
SaleItem.prototype.calculateTotalPrice = function() {
  this.totalPrice = (this.unitPrice * this.quantity) - this.discount;
  return this.totalPrice;
};

SaleItem.prototype.getItemSummary = function() {
  return {
    medicineId: this.medicineId,
    quantity: this.quantity,
    unitPrice: this.unitPrice,
    discount: this.discount,
    totalPrice: this.totalPrice,
    batchNumber: this.batchNumber,
    expiryDate: this.expiryDate
  };
};

// Static methods
SaleItem.getTopSellingMedicines = async function(startDate, endDate, limit = 10) {
  const Sale = sequelize.models.Sale; // Use sequelize.models instead of require
  
  return await SaleItem.findAll({
    attributes: [
      'medicineId',
      [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('quantity')), 'totalQuantity'],
      [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('total_price')), 'totalRevenue'],
      [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('SaleItem.id')), 'timesOrdered'],
      [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('quantity')), 'avgQuantityPerSale']
    ],
    include: [{
      model: Sale,
      attributes: [],
      where: startDate && endDate ? {
        saleDate: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      } : {},
      required: true
    }],
    group: ['medicineId'],
    order: [[sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('quantity')), 'DESC']],
    limit: limit,
    raw: true
  });
};

SaleItem.getMedicineRevenueAnalysis = async function(medicineId, startDate, endDate) {
  const Sale = sequelize.models.Sale; // Use sequelize.models instead of require
  
  return await SaleItem.findAll({
    attributes: [
      [sequelize.Sequelize.fn('DATE', sequelize.Sequelize.col('Sale.sale_date')), 'date'],
      [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('quantity')), 'quantitySold'],
      [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('total_price')), 'revenue'],
      [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('unit_price')), 'avgPrice'],
      [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('SaleItem.id')), 'transactions']
    ],
    include: [{
      model: Sale,
      attributes: [],
      where: {
        saleDate: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      required: true
    }],
    where: {
      medicineId: medicineId
    },
    group: [sequelize.Sequelize.fn('DATE', sequelize.Sequelize.col('Sale.sale_date'))],
    order: [[sequelize.Sequelize.fn('DATE', sequelize.Sequelize.col('Sale.sale_date')), 'ASC']],
    raw: true
  });
};

SaleItem.getSaleItemStats = async function(startDate, endDate) {
  const Sale = sequelize.models.Sale; // Use sequelize.models instead of require
  
  const stats = await SaleItem.findAll({
    attributes: [
      [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('SaleItem.id')), 'totalItems'],
      [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('quantity')), 'totalQuantity'],
      [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('total_price')), 'totalRevenue'],
      [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('quantity')), 'avgQuantityPerItem'],
      [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('unit_price')), 'avgUnitPrice'],
      [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('discount')), 'totalDiscounts']
    ],
    include: [{
      model: Sale,
      attributes: [],
      where: startDate && endDate ? {
        saleDate: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      } : {},
      required: true
    }],
    raw: true
  });

  return stats[0] || {
    totalItems: 0,
    totalQuantity: 0,
    totalRevenue: 0,
    avgQuantityPerItem: 0,
    avgUnitPrice: 0,
    totalDiscounts: 0
  };
};

module.exports = SaleItem;
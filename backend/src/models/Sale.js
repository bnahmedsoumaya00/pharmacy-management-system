const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  saleNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: {
      name: 'sale_number',
      msg: 'Sale number already exists'
    },
    field: 'sale_number'
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'customer_id',
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Subtotal must be positive'
      },
      isDecimal: {
        msg: 'Subtotal must be a valid decimal number'
      }
    }
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'tax_amount',
    validate: {
      min: {
        args: [0],
        msg: 'Tax amount cannot be negative'
      },
      isDecimal: {
        msg: 'Tax amount must be a valid decimal number'
      }
    }
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'discount_amount',
    validate: {
      min: {
        args: [0],
        msg: 'Discount amount cannot be negative'
      },
      isDecimal: {
        msg: 'Discount amount must be a valid decimal number'
      }
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'total_amount',
    validate: {
      min: {
        args: [0],
        msg: 'Total amount must be positive'
      },
      isDecimal: {
        msg: 'Total amount must be a valid decimal number'
      }
    }
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'insurance', 'credit'),
    allowNull: false,
    field: 'payment_method',
    validate: {
      isIn: {
        args: [['cash', 'card', 'insurance', 'credit']],
        msg: 'Payment method must be cash, card, insurance, or credit'
      }
    }
  },
  paymentStatus: {
    type: DataTypes.ENUM('paid', 'pending', 'partial'),
    allowNull: false,
    defaultValue: 'paid',
    field: 'payment_status',
    validate: {
      isIn: {
        args: [['paid', 'pending', 'partial']],
        msg: 'Payment status must be paid, pending, or partial'
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  saleDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'sale_date'
  }
}, {
  tableName: 'sales',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['sale_number']
    },
    {
      fields: ['sale_date']
    },
    {
      fields: ['customer_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['payment_method']
    },
    {
      fields: ['payment_status']
    }
  ]
});

Sale.addHook('beforeCreate', async (sale) => {
  if (!sale.saleNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const count = await Sale.count({
      where: {
        saleDate: {
          [Op.gte]: new Date(today.setHours(0, 0, 0, 0))
        }
      }
    });
    sale.saleNumber = `SA${dateStr}${String(count + 1).padStart(4, '0')}`;
  }
});

// Instance methods
Sale.prototype.calculateTotals = function(taxRate = 0.18) { // 18% VAT for Tunisia
  this.taxAmount = this.subtotal * taxRate;
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  return {
    subtotal: this.subtotal,
    taxAmount: this.taxAmount,
    discountAmount: this.discountAmount,
    totalAmount: this.totalAmount
  };
};

Sale.prototype.getReceiptData = function() {
  return {
    saleNumber: this.saleNumber,
    saleDate: this.saleDate,
    subtotal: this.subtotal,
    taxAmount: this.taxAmount,
    discountAmount: this.discountAmount,
    totalAmount: this.totalAmount,
    paymentMethod: this.paymentMethod,
    paymentStatus: this.paymentStatus,
    notes: this.notes
  };
};

// Static methods
Sale.getTodaysSales = async function() {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const sales = await Sale.findAll({
    where: {
      saleDate: {
        [Op.between]: [startOfDay, endOfDay] // FIXED: Use Op.between
      }
    },
    order: [['saleDate', 'DESC']]
  });

  const stats = await Sale.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
      [sequelize.fn('AVG', sequelize.col('total_amount')), 'avgSaleValue'],
      [sequelize.fn('SUM', sequelize.col('tax_amount')), 'totalTax']
    ],
    where: {
      saleDate: {
        [Op.between]: [startOfDay, endOfDay] // FIXED: Use Op.between
      }
    },
    raw: true
  });

  return {
    sales,
    stats: stats[0] || {
      totalSales: 0,
      totalRevenue: 0,
      avgSaleValue: 0,
      totalTax: 0
    }
  };
};

Sale.getSalesReport = async function(startDate, endDate, groupBy = 'day') {
  let dateFormat;
  switch (groupBy) {
    case 'hour':
      dateFormat = '%Y-%m-%d %H:00:00';
      break;
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-%u';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }

  return await Sale.findAll({
    attributes: [
      [sequelize.fn('DATE_FORMAT', 
        sequelize.col('sale_date'), 
        dateFormat
      ), 'period'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
      [sequelize.fn('AVG', sequelize.col('total_amount')), 'avgSaleValue'],
      [sequelize.fn('SUM', sequelize.col('tax_amount')), 'totalTax']
    ],
    where: {
      saleDate: {
        [Op.between]: [startDate, endDate] // FIXED: Use Op.between
      }
    },
    group: [sequelize.fn('DATE_FORMAT', 
      sequelize.col('sale_date'), 
      dateFormat
    )],
    order: [[sequelize.fn('DATE_FORMAT', 
      sequelize.col('sale_date'), 
      dateFormat
    ), 'ASC']],
    raw: true
  });
};

Sale.getPaymentMethodStats = async function(startDate, endDate) {
  return await Sale.findAll({
    attributes: [
      'paymentMethod',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalAmount'],
      [sequelize.fn('AVG', sequelize.col('total_amount')), 'avgAmount']
    ],
    where: {
      saleDate: {
        [Op.between]: [startDate, endDate] // FIXED: Use Op.between
      }
    },
    group: ['paymentMethod'],
    order: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'DESC']],
    raw: true
  });
};

module.exports = Sale;
const { DataTypes, Op } = require('sequelize'); // ADD Op IMPORT HERE
const { sequelize } = require('../config/database');

const Medicine = sequelize.define('Medicine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: {
        args: [2, 200],
        msg: 'Medicine name must be between 2 and 200 characters'
      },
      notEmpty: {
        msg: 'Medicine name cannot be empty'
      }
    }
  },
  genericName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'generic_name',
    validate: {
      len: {
        args: [0, 200],
        msg: 'Generic name cannot exceed 200 characters'
      }
    }
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'Brand name cannot exceed 100 characters'
      }
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'category_id',
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'supplier_id',
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  batchNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'batch_number',
    validate: {
      len: {
        args: [0, 50],
        msg: 'Batch number cannot exceed 50 characters'
      }
    }
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: {
      name: 'barcode',
      msg: 'Barcode must be unique'
    },
    validate: {
      len: {
        args: [0, 100],
        msg: 'Barcode cannot exceed 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dosage: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'Dosage cannot exceed 100 characters'
      }
    }
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'piece',
    validate: {
      isIn: {
        args: [['piece', 'bottle', 'box', 'tube', 'vial', 'pack', 'strip', 'ml', 'mg', 'g']],
        msg: 'Unit must be a valid measurement unit'
      }
    }
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'purchase_price',
    validate: {
      min: {
        args: [0],
        msg: 'Purchase price must be positive'
      },
      isDecimal: {
        msg: 'Purchase price must be a valid decimal number'
      }
    }
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'selling_price',
    validate: {
      min: {
        args: [0],
        msg: 'Selling price must be positive'
      },
      isDecimal: {
        msg: 'Selling price must be a valid decimal number'
      }
    }
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'stock_quantity',
    validate: {
      min: {
        args: [0],
        msg: 'Stock quantity cannot be negative'
      }
    }
  },
  minStockLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    field: 'min_stock_level',
    validate: {
      min: {
        args: [0],
        msg: 'Minimum stock level cannot be negative'
      }
    }
  },
  maxStockLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1000,
    field: 'max_stock_level',
    validate: {
      min: {
        args: [1],
        msg: 'Maximum stock level must be at least 1'
      }
    }
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'expiry_date',
    validate: {
      isDate: {
        msg: 'Expiry date must be a valid date'
      },
      isAfter: {
        args: new Date().toISOString().split('T')[0],
        msg: 'Expiry date must be in the future'
      }
    }
  },
  manufactureDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'manufacture_date',
    validate: {
      isDate: {
        msg: 'Manufacture date must be a valid date'
      },
      isBefore: {
        args: new Date().toISOString().split('T')[0],
        msg: 'Manufacture date cannot be in the future'
      }
    }
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'Location cannot exceed 100 characters'
      }
    }
  },
  isPrescriptionRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_prescription_required'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'medicines',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['name']
    },
    {
      unique: true,
      fields: ['barcode'],
      where: {
        barcode: {
          [Op.ne]: null // FIXED: Use Op.ne instead of sequelize.Sequelize.Op.ne
        }
      }
    },
    {
      fields: ['expiry_date']
    },
    {
      fields: ['stock_quantity']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['supplier_id']
    }
  ]
});

// Instance methods (no changes needed)
Medicine.prototype.isLowStock = function() {
  return this.stockQuantity <= this.minStockLevel;
};

Medicine.prototype.isExpiringSoon = function(days = 30) {
  if (!this.expiryDate) return false;
  const today = new Date();
  const warningDate = new Date();
  warningDate.setDate(today.getDate() + days);
  return new Date(this.expiryDate) <= warningDate;
};

Medicine.prototype.isExpired = function() {
  if (!this.expiryDate) return false;
  return new Date(this.expiryDate) < new Date();
};

Medicine.prototype.calculateProfitMargin = function() {
  if (this.purchasePrice === 0) return 0;
  return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100;
};

Medicine.prototype.getTotalValue = function() {
  return this.stockQuantity * this.sellingPrice;
};

// FIXED Static methods
Medicine.findLowStock = async function() {
  return await Medicine.findAll({
    where: {
      [Op.and]: [ // FIXED: Use Op.and
        sequelize.literal('stock_quantity <= min_stock_level'),
        { isActive: true }
      ]
    },
    order: [['stockQuantity', 'ASC']]
  });
};

Medicine.findExpiring = async function(days = 30) {
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + days);
  
  return await Medicine.findAll({
    where: {
      expiryDate: {
        [Op.lte]: warningDate, // FIXED: Use Op.lte
        [Op.gte]: new Date()   // FIXED: Use Op.gte
      },
      isActive: true
    },
    order: [['expiryDate', 'ASC']]
  });
};

Medicine.findExpired = async function() {
  return await Medicine.findAll({
    where: {
      expiryDate: {
        [Op.lt]: new Date() // FIXED: Use Op.lt
      },
      isActive: true
    },
    order: [['expiryDate', 'ASC']]
  });
};

Medicine.searchByName = async function(searchTerm) {
  return await Medicine.findAll({
    where: {
      [Op.and]: [ // FIXED: Use Op.and
        {
          [Op.or]: [ // FIXED: Use Op.or
            {
              name: {
                [Op.like]: `%${searchTerm}%` // FIXED: Use Op.like
              }
            },
            {
              genericName: {
                [Op.like]: `%${searchTerm}%` // FIXED: Use Op.like
              }
            },
            {
              brand: {
                [Op.like]: `%${searchTerm}%` // FIXED: Use Op.like
              }
            }
          ]
        },
        { isActive: true }
      ]
    },
    order: [['name', 'ASC']]
  });
};

Medicine.getInventoryStats = async function() {
  const stats = await Medicine.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalMedicines'], // FIXED: Remove extra Sequelize
      [sequelize.fn('SUM', sequelize.col('stock_quantity')), 'totalStock'], // FIXED: Remove extra Sequelize
      [sequelize.fn('SUM', 
        sequelize.literal('stock_quantity * selling_price')
      ), 'totalValue'],
      [sequelize.fn('COUNT', 
        sequelize.literal('CASE WHEN stock_quantity <= min_stock_level THEN 1 END')
      ), 'lowStockCount'],
      [sequelize.fn('COUNT', 
        sequelize.literal(`CASE WHEN expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) AND expiry_date >= CURRENT_DATE THEN 1 END`)
      ), 'expiringSoonCount'],
      [sequelize.fn('COUNT', 
        sequelize.literal('CASE WHEN expiry_date < CURRENT_DATE THEN 1 END')
      ), 'expiredCount']
    ],
    where: { isActive: true },
    raw: true
  });

  return stats[0] || {
    totalMedicines: 0,
    totalStock: 0,
    totalValue: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0
  };
};

module.exports = Medicine;
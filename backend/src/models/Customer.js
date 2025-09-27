const { DataTypes, Op } = require('sequelize'); // ADD Op IMPORT HERE
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: {
      name: 'customer_code',
      msg: 'Customer code already exists'
    },
    field: 'customer_code'
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'first_name',
    validate: {
      len: {
        args: [2, 50],
        msg: 'First name must be between 2 and 50 characters'
      },
      notEmpty: {
        msg: 'First name cannot be empty'
      },
      isAlpha: {
        msg: 'First name can only contain letters'
      }
    }
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'last_name',
    validate: {
      len: {
        args: [2, 50],
        msg: 'Last name must be between 2 and 50 characters'
      },
      notEmpty: {
        msg: 'Last name cannot be empty'
      },
      isAlpha: {
        msg: 'Last name can only contain letters'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isValidPhone(value) {
        if (value && !/^\+?[1-9]\d{1,14}$|^\+216-?\d{8}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          throw new Error('Phone number format is invalid');
        }
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      }
    }
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth',
    validate: {
      isDate: {
        msg: 'Date of birth must be a valid date'
      },
      isBefore: {
        args: new Date().toISOString().split('T')[0],
        msg: 'Date of birth cannot be in the future'
      }
    }
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
    validate: {
      isIn: {
        args: [['male', 'female', 'other']],
        msg: 'Gender must be male, female, or other'
      }
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: {
        args: [0, 50],
        msg: 'City cannot exceed 50 characters'
      }
    }
  },
  emergencyContact: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'emergency_contact',
    validate: {
      len: {
        args: [0, 100],
        msg: 'Emergency contact cannot exceed 100 characters'
      }
    }
  },
  emergencyPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'emergency_phone',
    validate: {
      isValidPhone(value) {
        if (value && !/^\+?[1-9]\d{1,14}$|^\+216-?\d{8}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          throw new Error('Emergency phone number format is invalid');
        }
      }
    }
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  medicalConditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'medical_conditions'
  },
  loyaltyPoints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'loyalty_points',
    validate: {
      min: {
        args: [0],
        msg: 'Loyalty points cannot be negative'
      }
    }
  },
  totalPurchases: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'total_purchases',
    validate: {
      min: {
        args: [0],
        msg: 'Total purchases cannot be negative'
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'customers',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['customer_code'],
      where: {
        customer_code: {
          [Op.ne]: null // FIXED: Use Op.ne instead of sequelize.Sequelize.Op.ne
        }
      }
    },
    {
      fields: ['phone']
    },
    {
      fields: ['first_name', 'last_name']
    },
    {
      fields: ['email']
    }
  ],
  hooks: {
    beforeCreate: async (customer) => {
      // Generate customer code if not provided
      if (!customer.customerCode) {
        const count = await Customer.count();
        customer.customerCode = `CUST${String(count + 1).padStart(4, '0')}`;
      }
    }
  }
});

// Instance methods
Customer.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

Customer.prototype.getAge = function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

Customer.prototype.addLoyaltyPoints = async function(points) {
  this.loyaltyPoints += points;
  await this.save({ fields: ['loyaltyPoints'] });
  return this.loyaltyPoints;
};

Customer.prototype.redeemLoyaltyPoints = async function(points) {
  if (points > this.loyaltyPoints) {
    throw new Error('Insufficient loyalty points');
  }
  
  this.loyaltyPoints -= points;
  await this.save({ fields: ['loyaltyPoints'] });
  return this.loyaltyPoints;
};

Customer.prototype.updatePurchaseTotal = async function(amount) {
  this.totalPurchases = parseFloat(this.totalPurchases) + parseFloat(amount);
  
  // Award loyalty points (1 point per 10 TND spent)
  const pointsToAdd = Math.floor(amount / 10);
  if (pointsToAdd > 0) {
    this.loyaltyPoints += pointsToAdd;
  }
  
  await this.save({ fields: ['totalPurchases', 'loyaltyPoints'] });
};

// FIXED Static methods
Customer.searchByName = async function(searchTerm) {
  return await Customer.findAll({
    where: {
      [Op.and]: [ // FIXED: Use Op.and
        {
          [Op.or]: [ // FIXED: Use Op.or
            {
              firstName: {
                [Op.like]: `%${searchTerm}%` // FIXED: Use Op.like
              }
            },
            {
              lastName: {
                [Op.like]: `%${searchTerm}%` // FIXED: Use Op.like
              }
            },
            {
              customerCode: {
                [Op.like]: `%${searchTerm}%` // FIXED: Use Op.like
              }
            },
            {
              phone: {
                [Op.like]: `%${searchTerm}%` // FIXED: Use Op.like
              }
            },
            {
              email: {
                [Op.like]: `%${searchTerm}%` // FIXED: Use Op.like
              }
            }
          ]
        },
        { isActive: true }
      ]
    },
    order: [['firstName', 'ASC'], ['lastName', 'ASC']]
  });
};

Customer.getTopCustomers = async function(limit = 10) {
  return await Customer.findAll({
    where: { isActive: true },
    order: [['totalPurchases', 'DESC']],
    limit: limit
  });
};

Customer.getCustomerStats = async function() {
  const stats = await Customer.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalCustomers'], // FIXED: Remove extra Sequelize
      [sequelize.fn('SUM', sequelize.col('total_purchases')), 'totalRevenue'], // FIXED: Remove extra Sequelize
      [sequelize.fn('AVG', sequelize.col('total_purchases')), 'avgPurchasePerCustomer'], // FIXED: Remove extra Sequelize
      [sequelize.fn('SUM', sequelize.col('loyalty_points')), 'totalLoyaltyPoints'], // FIXED: Remove extra Sequelize
      [sequelize.fn('COUNT', 
        sequelize.literal('CASE WHEN total_purchases > 0 THEN 1 END')
      ), 'activeCustomers']
    ],
    where: { isActive: true },
    raw: true
  });

  return stats[0] || {
    totalCustomers: 0,
    totalRevenue: 0,
    avgPurchasePerCustomer: 0,
    totalLoyaltyPoints: 0,
    activeCustomers: 0
  };
};

Customer.getBirthdayCustomers = async function(days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + days);

  return await Customer.findAll({
    where: {
      [Op.and]: [ // FIXED: Use Op.and
        {
          dateOfBirth: {
            [Op.ne]: null // FIXED: Use Op.ne
          }
        },
        sequelize.where( // FIXED: Remove extra Sequelize
          sequelize.fn('DATE_FORMAT', 
            sequelize.col('date_of_birth'), 
            '%m-%d'
          ),
          {
            [Op.between]: [ // FIXED: Use Op.between
              startDate.toISOString().slice(5, 10),
              endDate.toISOString().slice(5, 10)
            ]
          }
        ),
        { isActive: true }
      ]
    },
    order: [
      [sequelize.fn('DATE_FORMAT', // FIXED: Remove extra Sequelize
        sequelize.col('date_of_birth'), 
        '%m-%d'
      ), 'ASC']
    ]
  });
};

module.exports = Customer;
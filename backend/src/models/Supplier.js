const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: {
        args: [2, 100],
        msg: 'Supplier name must be between 2 and 100 characters'
      },
      notEmpty: {
        msg: 'Supplier name cannot be empty'
      }
    }
  },
  contactPerson: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'contact_person',
    validate: {
      len: {
        args: [0, 100],
        msg: 'Contact person name cannot exceed 100 characters'
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
  country: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Tunisia',
    validate: {
      len: {
        args: [2, 50],
        msg: 'Country must be between 2 and 50 characters'
      }
    }
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Website must be a valid URL'
      }
    }
  },
  taxId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'tax_id',
    validate: {
      len: {
        args: [0, 50],
        msg: 'Tax ID cannot exceed 50 characters'
      }
    }
  },
  paymentTerms: {
    type: DataTypes.ENUM('immediate', 'net_15', 'net_30', 'net_60', 'net_90'),
    allowNull: false,
    defaultValue: 'net_30',
    field: 'payment_terms'
  },
  creditLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0,
    field: 'credit_limit',
    validate: {
      min: {
        args: [0],
        msg: 'Credit limit cannot be negative'
      }
    }
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Rating cannot be negative'
      },
      max: {
        args: [5],
        msg: 'Rating cannot exceed 5'
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'suppliers',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['email']
    },
    {
      fields: ['city']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['rating']
    }
  ]
});

// Instance methods
Supplier.prototype.getFullContact = function() {
  const contact = [];
  if (this.contactPerson) contact.push(this.contactPerson);
  if (this.phone) contact.push(this.phone);
  if (this.email) contact.push(this.email);
  return contact.join(' | ');
};

Supplier.prototype.getFullAddress = function() {
  const address = [];
  if (this.address) address.push(this.address);
  if (this.city) address.push(this.city);
  if (this.country && this.country !== 'Tunisia') address.push(this.country);
  return address.join(', ');
};

Supplier.prototype.updateRating = async function(newRating) {
  if (newRating < 0 || newRating > 5) {
    throw new Error('Rating must be between 0 and 5');
  }
  
  this.rating = newRating;
  await this.save({ fields: ['rating'] });
  return this.rating;
};

Supplier.prototype.getPaymentTermsInDays = function() {
  const terms = {
    immediate: 0,
    net_15: 15,
    net_30: 30,
    net_60: 60,
    net_90: 90
  };
  return terms[this.paymentTerms] || 30;
};

// Static methods
Supplier.findActiveSuppliers = async function() {
  return await Supplier.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']]
  });
};

Supplier.searchSuppliers = async function(searchTerm) {
  return await Supplier.findAll({
    where: {
      [sequelize.Sequelize.Op.and]: [
        {
          [sequelize.Sequelize.Op.or]: [
            {
              name: {
                [sequelize.Sequelize.Op.like]: `%${searchTerm}%`
              }
            },
            {
              contactPerson: {
                [sequelize.Sequelize.Op.like]: `%${searchTerm}%`
              }
            },
            {
              email: {
                [sequelize.Sequelize.Op.like]: `%${searchTerm}%`
              }
            },
            {
              city: {
                [sequelize.Sequelize.Op.like]: `%${searchTerm}%`
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

Supplier.getTopSuppliers = async function(limit = 10) {
  return await Supplier.findAll({
    where: { 
      isActive: true,
      rating: {
        [sequelize.Sequelize.Op.ne]: null
      }
    },
    order: [['rating', 'DESC']],
    limit: limit
  });
};

Supplier.getSupplierStats = async function() {
  const stats = await Supplier.findAll({
    attributes: [
      [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('id')), 'totalSuppliers'],
      [sequelize.Sequelize.fn('COUNT', 
        sequelize.Sequelize.literal('CASE WHEN is_active = 1 THEN 1 END')
      ), 'activeSuppliers'],
      [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('rating')), 'avgRating'],
      [sequelize.Sequelize.fn('COUNT', 
        sequelize.Sequelize.literal('CASE WHEN rating >= 4 THEN 1 END')
      ), 'topRatedSuppliers'],
      [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('credit_limit')), 'totalCreditLimit']
    ],
    raw: true
  });

  return stats[0] || {
    totalSuppliers: 0,
    activeSuppliers: 0,
    avgRating: 0,
    topRatedSuppliers: 0,
    totalCreditLimit: 0
  };
};

Supplier.getSuppliersByCountry = async function() {
  return await Supplier.findAll({
    attributes: [
      'country',
      [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('id')), 'supplierCount']
    ],
    where: { isActive: true },
    group: ['country'],
    order: [[sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('id')), 'DESC']],
    raw: true
  });
};

module.exports = Supplier;
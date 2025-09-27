const { DataTypes, Op } = require('sequelize'); // ADD Op IMPORT
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      name: 'name',
      msg: 'Category name already exists'
    },
    validate: {
      len: {
        args: [2, 100],
        msg: 'Category name must be between 2 and 100 characters'
      },
      notEmpty: {
        msg: 'Category name cannot be empty'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'display_order'
  }
}, {
  tableName: 'categories',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['display_order']
    }
  ]
});

// Instance methods
Category.prototype.getMedicineCount = async function() {
  const Medicine = require('./Medicine');
  const count = await Medicine.count({
    where: {
      categoryId: this.id,
      isActive: true
    }
  });
  return count;
};

Category.prototype.updateDisplayOrder = async function(newOrder) {
  this.displayOrder = newOrder;
  await this.save({ fields: ['displayOrder'] });
  return this.displayOrder;
};

// ENHANCED Static methods
Category.findActiveCategories = async function() {
  return await Category.findAll({
    where: { isActive: true },
    order: [['displayOrder', 'ASC'], ['name', 'ASC']]
  });
};

Category.searchCategories = async function(searchTerm) {
  return await Category.findAll({
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
              description: {
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

Category.getWithMedicineCount = async function() {
  const Medicine = require('./Medicine');
  
  return await Category.findAll({
    attributes: [
      'id',
      'name', 
      'description',
      'isActive',
      'displayOrder',
      'createdAt',
      'updatedAt',
      [sequelize.fn('COUNT', sequelize.col('Medicines.id')), 'medicineCount'] // FIXED: Remove extra Sequelize
    ],
    include: [{
      model: Medicine,
      attributes: [],
      required: false,
      where: { isActive: true }
    }],
    where: { isActive: true }, // ADD: Only active categories
    group: ['Category.id'],
    order: [['displayOrder', 'ASC'], ['name', 'ASC']] // ENHANCED: Better ordering
  });
};

Category.getCategoryStats = async function() {
  const Medicine = require('./Medicine');
  
  const stats = await Category.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalCategories'], // FIXED: Remove extra Sequelize
      [sequelize.fn('COUNT', 
        sequelize.literal('CASE WHEN is_active = 1 THEN 1 END')
      ), 'activeCategories'],
      [sequelize.fn('AVG', 
        sequelize.literal('(SELECT COUNT(*) FROM medicines WHERE category_id = Category.id AND is_active = 1)')
      ), 'avgMedicinesPerCategory']
    ],
    raw: true
  });

  return stats[0] || {
    totalCategories: 0,
    activeCategories: 0, 
    avgMedicinesPerCategory: 0
  };
};

Category.getPopularCategories = async function(limit = 5) {
  const Medicine = require('./Medicine');
  
  return await Category.findAll({
    attributes: [
      'id',
      'name',
      [sequelize.fn('COUNT', sequelize.col('Medicines.id')), 'medicineCount'] // FIXED: Remove extra Sequelize
    ],
    include: [{
      model: Medicine,
      attributes: [],
      required: false,
      where: { isActive: true }
    }],
    where: { isActive: true },
    group: ['Category.id'],
    order: [[sequelize.fn('COUNT', sequelize.col('Medicines.id')), 'DESC']], // FIXED: Remove extra Sequelize
    limit: limit,
    raw: true
  });
};

module.exports = Category;
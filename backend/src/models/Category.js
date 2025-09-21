const { DataTypes } = require('sequelize');
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
    }
  ]
});

// Static method to get category with medicine count
Category.getWithMedicineCount = async function() {
  const Medicine = require('./Medicine');
  
  return await Category.findAll({
    attributes: [
      'id',
      'name',
      'description',
      'createdAt',
      'updatedAt',
      [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('Medicines.id')), 'medicineCount']
    ],
    include: [{
      model: Medicine,
      attributes: [],
      required: false,
      where: { isActive: true }
    }],
    group: ['Category.id'],
    order: [['name', 'ASC']]
  });
};

module.exports = Category;
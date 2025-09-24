// Import all models first
const User = require('./User');
const Medicine = require('./Medicine');
const Category = require('./Category');
const Customer = require('./Customer');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const Supplier = require('./Supplier');

// Define associations after all models are loaded
const defineAssociations = () => {
  // Category - Medicine relationship
  Category.hasMany(Medicine, {
    foreignKey: 'categoryId',
    as: 'medicines'
  });

  Medicine.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category'
  });

  // Supplier - Medicine relationship
  Supplier.hasMany(Medicine, {
    foreignKey: 'supplierId',
    as: 'medicines'
  });

  Medicine.belongsTo(Supplier, {
    foreignKey: 'supplierId',
    as: 'supplier'
  });

  // Customer - Sales relationship
  Customer.hasMany(Sale, {
    foreignKey: 'customerId',
    as: 'sales'
  });

  Sale.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
  });

  // User - Sales relationship (who made the sale)
  User.hasMany(Sale, {
    foreignKey: 'userId',
    as: 'sales'
  });

  Sale.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // Sale - SaleItems relationship
  Sale.hasMany(SaleItem, {
    foreignKey: 'saleId',
    as: 'items'
  });

  SaleItem.belongsTo(Sale, {
    foreignKey: 'saleId',
    as: 'sale'
  });

  // Medicine - SaleItems relationship
  Medicine.hasMany(SaleItem, {
    foreignKey: 'medicineId',
    as: 'saleItems'
  });

  SaleItem.belongsTo(Medicine, {
    foreignKey: 'medicineId',
    as: 'medicine'
  });
};

// Call the function to define associations
defineAssociations();

module.exports = {
  User,
  Medicine,
  Category,
  Customer,
  Sale,
  SaleItem,
  Supplier
};
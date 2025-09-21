const { Customer, Sale, SaleItem } = require('../models/index');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Get all customers with pagination and filtering
const getAllCustomers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      city,
      gender,
      activeOnly = 'true',
      sortBy = 'firstName',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * parseInt(limit);
    const whereClause = {};

    // Active customers filter
    if (activeOnly === 'true') {
      whereClause.isActive = true;
    }

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { customerCode: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // City filter
    if (city) {
      whereClause.city = { [Op.like]: `%${city}%` };
    }

    // Gender filter
    if (gender && ['male', 'female', 'other'].includes(gender)) {
      whereClause.gender = gender;
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: {
        exclude: ['updatedAt'] // Exclude sensitive or unnecessary fields
      }
    });

    // Add computed fields
    const customersWithExtras = customers.map(customer => {
      const customerData = customer.toJSON();
      return {
        ...customerData,
        fullName: customer.getFullName(),
        age: customer.getAge(),
        loyaltyTier: customerData.totalPurchases >= 1000 ? 'Gold' : 
                     customerData.totalPurchases >= 500 ? 'Silver' : 'Bronze'
      };
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      message: 'Customers retrieved successfully',
      data: {
        customers: customersWithExtras,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get single customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({
      where: { id, isActive: true }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    const customerData = customer.toJSON();
    const customerWithExtras = {
      ...customerData,
      fullName: customer.getFullName(),
      age: customer.getAge(),
      loyaltyTier: customerData.totalPurchases >= 1000 ? 'Gold' : 
                   customerData.totalPurchases >= 500 ? 'Silver' : 'Bronze'
    };

    res.json({
      success: true,
      message: 'Customer retrieved successfully',
      data: { customer: customerWithExtras }
    });

  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const customerData = req.body;

    // Check if phone or email already exists (if provided)
    const whereConditions = [];
    if (customerData.phone) {
      whereConditions.push({ phone: customerData.phone });
    }
    if (customerData.email) {
      whereConditions.push({ email: customerData.email });
    }

    if (whereConditions.length > 0) {
      const existingCustomer = await Customer.findOne({
        where: {
          [Op.or]: whereConditions,
          isActive: true
        }
      });

      if (existingCustomer) {
        const duplicateField = existingCustomer.phone === customerData.phone ? 'phone' : 'email';
        return res.status(409).json({
          success: false,
          message: `Customer with this ${duplicateField} already exists`,
          code: 'CUSTOMER_EXISTS'
        });
      }
    }

    const newCustomer = await Customer.create(customerData);

    const customerWithExtras = {
      ...newCustomer.toJSON(),
      fullName: newCustomer.getFullName(),
      age: newCustomer.getAge(),
      loyaltyTier: 'Bronze'
    };

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer: customerWithExtras }
    });

  } catch (error) {
    console.error('Create customer error:', error);

    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Find existing customer
    const customer = await Customer.findOne({
      where: { id, isActive: true }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    // Check phone/email uniqueness (if being updated)
    const whereConditions = [];
    if (updateData.phone && updateData.phone !== customer.phone) {
      whereConditions.push({ phone: updateData.phone });
    }
    if (updateData.email && updateData.email !== customer.email) {
      whereConditions.push({ email: updateData.email });
    }

    if (whereConditions.length > 0) {
      const existingCustomer = await Customer.findOne({
        where: {
          [Op.or]: whereConditions,
          id: { [Op.ne]: id },
          isActive: true
        }
      });

      if (existingCustomer) {
        const duplicateField = existingCustomer.phone === updateData.phone ? 'phone' : 'email';
        return res.status(409).json({
          success: false,
          message: `Customer with this ${duplicateField} already exists`,
          code: 'CUSTOMER_EXISTS'
        });
      }
    }

    await customer.update(updateData);

    const updatedCustomerWithExtras = {
      ...customer.toJSON(),
      fullName: customer.getFullName(),
      age: customer.getAge(),
      loyaltyTier: customer.totalPurchases >= 1000 ? 'Gold' : 
                   customer.totalPurchases >= 500 ? 'Silver' : 'Bronze'
    };

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer: updatedCustomerWithExtras }
    });

  } catch (error) {
    console.error('Update customer error:', error);

    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Soft delete customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findOne({
      where: { id, isActive: true }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    await customer.update({ isActive: false });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get customer purchase history
const getCustomerHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * parseInt(limit);

    const customer = await Customer.findOne({
      where: { id, isActive: true }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    const { count, rows: sales } = await Sale.findAndCountAll({
      where: { customerId: id },
      include: [{
        model: SaleItem,
        as: 'items',
        attributes: ['medicineId', 'quantity', 'unitPrice', 'totalPrice']
      }],
      limit: parseInt(limit),
      offset: offset,
      order: [['saleDate', 'DESC']]
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      message: 'Customer purchase history retrieved successfully',
      data: {
        customer: {
          id: customer.id,
          fullName: customer.getFullName(),
          customerCode: customer.customerCode,
          totalPurchases: customer.totalPurchases,
          loyaltyPoints: customer.loyaltyPoints
        },
        sales,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get customer history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get customer statistics
const getCustomerStats = async (req, res) => {
  try {
    const stats = await Customer.getCustomerStats();

    // Get additional statistics
    const topCustomers = await Customer.getTopCustomers(5);
    const birthdayCustomers = await Customer.getBirthdayCustomers(7);

    res.json({
      success: true,
      message: 'Customer statistics retrieved successfully',
      data: {
        stats,
        topCustomers: topCustomers.map(customer => ({
          id: customer.id,
          fullName: customer.getFullName(),
          customerCode: customer.customerCode,
          totalPurchases: customer.totalPurchases,
          loyaltyPoints: customer.loyaltyPoints
        })),
        upcomingBirthdays: birthdayCustomers.map(customer => ({
          id: customer.id,
          fullName: customer.getFullName(),
          customerCode: customer.customerCode,
          dateOfBirth: customer.dateOfBirth,
          age: customer.getAge()
        }))
      }
    });

  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
  getCustomerStats
};
const CustomerService = require('../services/CustomerService');
const { validationResult } = require('express-validator');

class CustomerController {
  constructor() {
    this.customerService = new CustomerService();
  }

  // Get all customers
  getAllCustomers = async (req, res) => {
    try {
      const { page = 1, limit = 20, search, city, gender } = req.query;
      const offset = (page - 1) * limit;

      let customers;

      if (search) {
        customers = await this.customerService.searchCustomers(search);
      } else {
        const filters = { limit: parseInt(limit), offset: parseInt(offset) };
        if (city) filters.city = city;
        if (gender) filters.gender = gender;
        
        customers = await this.customerService.advancedSearch(filters);
      }

      res.json({
        success: true,
        data: customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: customers.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers',
        error: error.message
      });
    }
  };

  // Get customer by ID
  getCustomerById = async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await this.customerService.getCustomerById(id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer',
        error: error.message
      });
    }
  };

  // Create new customer
  createCustomer = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const customer = await this.customerService.createCustomer(req.body);

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer
      });
    } catch (error) {
      if (error.code === 'PHONE_EXISTS' || error.code === 'EMAIL_EXISTS') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error: error.message
      });
    }
  };

  // Update customer
  updateCustomer = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const customer = await this.customerService.updateCustomer(id, req.body);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
      });
    } catch (error) {
      if (error.code === 'PHONE_EXISTS' || error.code === 'EMAIL_EXISTS') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update customer',
        error: error.message
      });
    }
  };

  // Delete customer
  deleteCustomer = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.customerService.deleteCustomer(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete customer',
        error: error.message
      });
    }
  };

  // Get customer statistics
  getCustomerStats = async (req, res) => {
    try {
      const stats = await this.customerService.getCustomerStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer statistics',
        error: error.message
      });
    }
  };

  // Get customer with purchase history
  getCustomerHistory = async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await this.customerService.getCustomerWithHistory(id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer history',
        error: error.message
      });
    }
  };

  // Search customers
  searchCustomers = async (req, res) => {
    try {
      const { q: searchTerm } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      const customers = await this.customerService.searchCustomers(searchTerm);

      res.json({
        success: true,
        data: customers,
        count: customers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to search customers',
        error: error.message
      });
    }
  };

  // Get top customers
  getTopCustomers = async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const customers = await this.customerService.getTopCustomers(parseInt(limit));

      res.json({
        success: true,
        data: customers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top customers',
        error: error.message
      });
    }
  };

  // Get birthday customers
  getBirthdayCustomers = async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const customers = await this.customerService.getBirthdayCustomers(parseInt(days));

      res.json({
        success: true,
        data: customers,
        count: customers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch birthday customers',
        error: error.message
      });
    }
  };

  // Update loyalty points
  updateLoyaltyPoints = async (req, res) => {
    try {
      const { id } = req.params;
      const { points } = req.body;

      if (typeof points !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Points must be a number'
        });
      }

      const customer = await this.customerService.updateLoyaltyPoints(id, points);

      res.json({
        success: true,
        message: 'Loyalty points updated successfully',
        data: customer
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update loyalty points',
        error: error.message
      });
    }
  };
}

module.exports = new CustomerController();
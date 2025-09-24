const BaseRepository = require('./BaseRepository');
const { Customer, Sale } = require('../models');
const { Op, fn, col, literal, where } = require('sequelize');

class CustomerRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }

  /**
   * Find customer with purchase history
   * @param {number} customerId - Customer ID
   * @returns {Object|null} - Customer with sales data
   */
  async findWithPurchaseHistory(customerId) {
    return await this.model.findByPk(customerId, {
      include: [{
        model: Sale,
        as: 'purchases',
        order: [['createdAt', 'DESC']],
        limit: 20 // Latest 20 purchases
      }]
    });
  }

  /**
   * Find customer by phone number
   * @param {string} phone - Phone number
   * @returns {Object|null} - Customer object or null
   */
  async findByPhone(phone) {
    return await this.model.findOne({
      where: { 
        phone,
        isActive: true 
      }
    });
  }

  /**
   * Find customer by email
   * @param {string} email - Email address
   * @returns {Object|null} - Customer object or null
   */
  async findByEmail(email) {
    return await this.model.findOne({
      where: { 
        email,
        isActive: true 
      }
    });
  }

  /**
   * Find customer by customer code
   * @param {string} customerCode - Customer code
   * @returns {Object|null} - Customer object or null
   */
  async findByCustomerCode(customerCode) {
    return await this.model.findOne({
      where: { 
        customerCode,
        isActive: true 
      }
    });
  }

  /**
   * Search customers by name, phone, email, or customer code
   * @param {string} searchTerm - Search term
   * @returns {Array} - Array of matching customers
   */
  async searchCustomers(searchTerm) {
    return await Customer.searchByName(searchTerm);
  }

  /**
   * Get top customers by total purchases
   * @param {number} limit - Number of customers to return
   * @returns {Array} - Top customers
   */
  async getTopCustomers(limit = 10) {
    return await Customer.getTopCustomers(limit);
  }

  /**
   * Get customers with highest loyalty points
   * @param {number} limit - Number of customers to return
   * @returns {Array} - Customers with highest loyalty points
   */
  async getTopLoyaltyCustomers(limit = 10) {
    return await this.model.findAll({
      where: { 
        isActive: true,
        loyaltyPoints: { [Op.gt]: 0 }
      },
      order: [['loyaltyPoints', 'DESC']],
      limit
    });
  }

  /**
   * Get customers by age range
   * @param {number} minAge - Minimum age
   * @param {number} maxAge - Maximum age
   * @returns {Array} - Customers within age range
   */
  async findByAgeRange(minAge, maxAge) {
    const currentYear = new Date().getFullYear();
    const maxBirthYear = currentYear - minAge;
    const minBirthYear = currentYear - maxAge;

    return await this.model.findAll({
      where: {
        dateOfBirth: {
          [Op.between]: [
            `${minBirthYear}-01-01`,
            `${maxBirthYear}-12-31`
          ]
        },
        isActive: true
      },
      order: [['dateOfBirth', 'DESC']]
    });
  }

  /**
   * Get customers by city
   * @param {string} city - City name
   * @returns {Array} - Customers in specified city
   */
  async findByCity(city) {
    return await this.model.findAll({
      where: {
        city: { [Op.like]: `%${city}%` },
        isActive: true
      },
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });
  }

  /**
   * Get customers by gender
   * @param {string} gender - Gender (male/female/other)
   * @returns {Array} - Customers of specified gender
   */
  async findByGender(gender) {
    return await this.model.findAll({
      where: {
        gender,
        isActive: true
      },
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });
  }

  /**
   * Get customers with specific medical conditions
   * @param {string} condition - Medical condition to search for
   * @returns {Array} - Customers with specified condition
   */
  async findByMedicalCondition(condition) {
    return await this.model.findAll({
      where: {
        medicalConditions: { [Op.like]: `%${condition}%` },
        isActive: true
      },
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });
  }

  /**
   * Get customers with specific allergies
   * @param {string} allergy - Allergy to search for
   * @returns {Array} - Customers with specified allergy
   */
  async findByAllergy(allergy) {
    return await this.model.findAll({
      where: {
        allergies: { [Op.like]: `%${allergy}%` },
        isActive: true
      },
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });
  }

  /**
   * Get birthday customers (upcoming birthdays)
   * @param {number} days - Number of days to look ahead
   * @returns {Array} - Customers with upcoming birthdays
   */
  async getBirthdayCustomers(days = 7) {
    return await Customer.getBirthdayCustomers(days);
  }

  /**
   * Get customers by loyalty points range
   * @param {number} minPoints - Minimum loyalty points
   * @param {number} maxPoints - Maximum loyalty points
   * @returns {Array} - Customers within points range
   */
  async findByLoyaltyPointsRange(minPoints, maxPoints) {
    return await this.model.findAll({
      where: {
        loyaltyPoints: {
          [Op.between]: [minPoints, maxPoints]
        },
        isActive: true
      },
      order: [['loyaltyPoints', 'DESC']]
    });
  }

  /**
   * Get customers by purchase amount range
   * @param {number} minAmount - Minimum total purchases
   * @param {number} maxAmount - Maximum total purchases
   * @returns {Array} - Customers within purchase range
   */
  async findByPurchaseRange(minAmount, maxAmount) {
    return await this.model.findAll({
      where: {
        totalPurchases: {
          [Op.between]: [minAmount, maxAmount]
        },
        isActive: true
      },
      order: [['totalPurchases', 'DESC']]
    });
  }

  /**
   * Get new customers (registered within specified days)
   * @param {number} days - Number of days to look back
   * @returns {Array} - Recently registered customers
   */
  async getNewCustomers(days = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return await this.model.findAll({
      where: {
        createdAt: {
          [Op.gte]: dateThreshold
        },
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get inactive customers (no purchases in specified days)
   * @param {number} days - Number of days to consider inactive
   * @returns {Array} - Inactive customers
   */
  async getInactiveCustomers(days = 90) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // This would require a more complex query with Sales table
    // For now, returning customers with no recent updates
    return await this.model.findAll({
      where: {
        updatedAt: {
          [Op.lt]: dateThreshold
        },
        isActive: true
      },
      order: [['updatedAt', 'ASC']]
    });
  }

  /**
   * Advanced customer search with multiple filters
   * @param {Object} filters - Search filters
   * @returns {Array} - Filtered customers
   */
  async advancedSearch(filters = {}) {
    const {
      name,
      phone,
      email,
      city,
      gender,
      minAge,
      maxAge,
      minPoints,
      maxPoints,
      minPurchases,
      maxPurchases,
      hasAllergies,
      hasMedicalConditions,
      limit = 50,
      offset = 0
    } = filters;

    const whereClause = { isActive: true };

    // Name search
    if (name) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${name}%` } },
        { lastName: { [Op.like]: `%${name}%` } },
        { customerCode: { [Op.like]: `%${name}%` } }
      ];
    }

    // Contact info
    if (phone) whereClause.phone = { [Op.like]: `%${phone}%` };
    if (email) whereClause.email = { [Op.like]: `%${email}%` };
    if (city) whereClause.city = { [Op.like]: `%${city}%` };
    if (gender) whereClause.gender = gender;

    // Age range
    if (minAge || maxAge) {
      const currentYear = new Date().getFullYear();
      const dateRange = {};
      
      if (maxAge) {
        const minBirthYear = currentYear - maxAge;
        dateRange[Op.gte] = `${minBirthYear}-01-01`;
      }
      
      if (minAge) {
        const maxBirthYear = currentYear - minAge;
        dateRange[Op.lte] = `${maxBirthYear}-12-31`;
      }
      
      if (Object.keys(dateRange).length > 0) {
        whereClause.dateOfBirth = dateRange;
      }
    }

    // Loyalty points range
    if (minPoints || maxPoints) {
      whereClause.loyaltyPoints = {};
      if (minPoints) whereClause.loyaltyPoints[Op.gte] = minPoints;
      if (maxPoints) whereClause.loyaltyPoints[Op.lte] = maxPoints;
    }

    // Purchase amount range
    if (minPurchases || maxPurchases) {
      whereClause.totalPurchases = {};
      if (minPurchases) whereClause.totalPurchases[Op.gte] = minPurchases;
      if (maxPurchases) whereClause.totalPurchases[Op.lte] = maxPurchases;
    }

    // Medical info filters
    if (hasAllergies) {
      whereClause.allergies = { [Op.ne]: null, [Op.ne]: '' };
    }
    
    if (hasMedicalConditions) {
      whereClause.medicalConditions = { [Op.ne]: null, [Op.ne]: '' };
    }

    return await this.model.findAll({
      where: whereClause,
      limit,
      offset,
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });
  }

  /**
   * Update customer loyalty points
   * @param {number} customerId - Customer ID
   * @param {number} points - Points to add/subtract
   * @returns {Object} - Updated customer
   */
  async updateLoyaltyPoints(customerId, points) {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    await customer.addLoyaltyPoints(points);
    return await this.findById(customerId);
  }

  /**
   * Redeem customer loyalty points
   * @param {number} customerId - Customer ID
   * @param {number} points - Points to redeem
   * @returns {Object} - Updated customer
   */
  async redeemLoyaltyPoints(customerId, points) {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    await customer.redeemLoyaltyPoints(points);
    return await this.findById(customerId);
  }

  /**
   * Update customer purchase total
   * @param {number} customerId - Customer ID
   * @param {number} amount - Purchase amount to add
   * @returns {Object} - Updated customer
   */
  async updatePurchaseTotal(customerId, amount) {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    await customer.updatePurchaseTotal(amount);
    return await this.findById(customerId);
  }

  /**
   * Get comprehensive customer statistics
   * @returns {Object} - Customer statistics
   */
  async getCustomerStats() {
    return await Customer.getCustomerStats();
  }

  /**
   * Get customer demographics statistics
   * @returns {Object} - Demographics breakdown
   */
  async getDemographicsStats() {
    const genderStats = await this.model.findAll({
      attributes: [
        'gender',
        [fn('COUNT', col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['gender']
    });

    const cityStats = await this.model.findAll({
      attributes: [
        'city',
        [fn('COUNT', col('id')), 'count']
      ],
      where: { 
        isActive: true,
        city: { [Op.ne]: null }
      },
      group: ['city'],
      order: [[literal('count'), 'DESC']],
      limit: 10
    });

    const ageGroups = await this.model.findAll({
      attributes: [
        [literal(`CASE 
          WHEN YEAR(CURDATE()) - YEAR(date_of_birth) < 18 THEN 'Under 18'
          WHEN YEAR(CURDATE()) - YEAR(date_of_birth) BETWEEN 18 AND 30 THEN '18-30'
          WHEN YEAR(CURDATE()) - YEAR(date_of_birth) BETWEEN 31 AND 50 THEN '31-50'
          WHEN YEAR(CURDATE()) - YEAR(date_of_birth) BETWEEN 51 AND 65 THEN '51-65'
          ELSE 'Over 65'
        END`), 'ageGroup'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: { 
        isActive: true,
        dateOfBirth: { [Op.ne]: null }
      },
      group: [literal('ageGroup')]
    });

    return {
      genderDistribution: genderStats.reduce((acc, stat) => {
        acc[stat.dataValues.gender || 'unknown'] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
      topCities: cityStats.map(stat => ({
        city: stat.dataValues.city,
        count: parseInt(stat.dataValues.count)
      })),
      ageDistribution: ageGroups.reduce((acc, stat) => {
        acc[stat.dataValues.ageGroup] = parseInt(stat.dataValues.count);
        return acc;
      }, {})
    };
  }

  /**
   * Check if phone number is unique (excluding specific customer)
   * @param {string} phone - Phone number to check
   * @param {number} excludeId - Customer ID to exclude from check
   * @returns {boolean} - True if unique, false otherwise
   */
  async isPhoneUnique(phone, excludeId = null) {
    if (!phone) return true;
    
    const whereClause = { phone };
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const customer = await this.model.findOne({ where: whereClause });
    return !customer;
  }

  /**
   * Check if email is unique (excluding specific customer)
   * @param {string} email - Email to check
   * @param {number} excludeId - Customer ID to exclude from check
   * @returns {boolean} - True if unique, false otherwise
   */
  async isEmailUnique(email, excludeId = null) {
    if (!email) return true;
    
    const whereClause = { email };
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const customer = await this.model.findOne({ where: whereClause });
    return !customer;
  }

  /**
   * Bulk update customer status
   * @param {Array} customerIds - Array of customer IDs
   * @param {boolean} isActive - Active status
   * @returns {Array} - Update result
   */
  async bulkUpdateStatus(customerIds, isActive) {
    return await this.model.update(
      { isActive },
      {
        where: {
          id: { [Op.in]: customerIds }
        }
      }
    );
  }
}

module.exports = CustomerRepository;
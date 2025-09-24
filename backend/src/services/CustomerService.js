const CustomerRepository = require('../repositories/CustomerRepository');
const { ValidationError } = require('../exceptions/ValidationError');

class CustomerService {
  constructor() {
    this.customerRepository = new CustomerRepository();
  }

  async getAllCustomers(options = {}) {
    return await this.customerRepository.findAll(options);
  }

  async getCustomerById(id) {
    return await this.customerRepository.findById(id);
  }

  async createCustomer(customerData) {
    // Check phone uniqueness if provided
    if (customerData.phone) {
      const isPhoneUnique = await this.customerRepository.isPhoneUnique(customerData.phone);
      if (!isPhoneUnique) {
        throw new ValidationError('Phone number already exists', 'PHONE_EXISTS');
      }
    }

    // Check email uniqueness if provided
    if (customerData.email) {
      const isEmailUnique = await this.customerRepository.isEmailUnique(customerData.email);
      if (!isEmailUnique) {
        throw new ValidationError('Email already exists', 'EMAIL_EXISTS');
      }
    }

    return await this.customerRepository.create(customerData);
  }

  async updateCustomer(id, updateData) {
    // Check phone uniqueness if being updated
    if (updateData.phone) {
      const isPhoneUnique = await this.customerRepository.isPhoneUnique(updateData.phone, id);
      if (!isPhoneUnique) {
        throw new ValidationError('Phone number already exists', 'PHONE_EXISTS');
      }
    }

    // Check email uniqueness if being updated
    if (updateData.email) {
      const isEmailUnique = await this.customerRepository.isEmailUnique(updateData.email, id);
      if (!isEmailUnique) {
        throw new ValidationError('Email already exists', 'EMAIL_EXISTS');
      }
    }

    return await this.customerRepository.update(id, updateData);
  }

  async deleteCustomer(id) {
    return await this.customerRepository.delete(id);
  }

  async getCustomerWithHistory(id) {
    return await this.customerRepository.findWithPurchaseHistory(id);
  }

  async findCustomerByPhone(phone) {
    return await this.customerRepository.findByPhone(phone);
  }

  async searchCustomers(searchTerm) {
    return await this.customerRepository.searchCustomers(searchTerm);
  }

  async getTopCustomers(limit = 10) {
    return await this.customerRepository.getTopCustomers(limit);
  }

  async getBirthdayCustomers(days = 7) {
    return await this.customerRepository.getBirthdayCustomers(days);
  }

  async getCustomerStats() {
    return await this.customerRepository.getCustomerStats();
  }

  async getDemographics() {
    return await this.customerRepository.getDemographicsStats();
  }

  async updateLoyaltyPoints(customerId, points) {
    return await this.customerRepository.updateLoyaltyPoints(customerId, points);
  }

  async redeemLoyaltyPoints(customerId, points) {
    return await this.customerRepository.redeemLoyaltyPoints(customerId, points);
  }

  async recordPurchase(customerId, amount) {
    return await this.customerRepository.updatePurchaseTotal(customerId, amount);
  }

  async advancedSearch(filters) {
    return await this.customerRepository.advancedSearch(filters);
  }
}

module.exports = CustomerService;
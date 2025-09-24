const BaseRepository = require('./BaseRepository');
const { User } = require('../models');
const { Op } = require('sequelize');

class AuthRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find user by email or username
   * @param {string} identifier - Email or username
   * @returns {Object|null} - User object or null
   */
  async findByEmailOrUsername(identifier) {
    return await this.model.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} - User object or null
   */
  async findByEmail(email) {
    return await this.model.findOne({
      where: { email }
    });
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Object|null} - User object or null
   */
  async findByUsername(username) {
    return await this.model.findOne({
      where: { username }
    });
  }

  /**
   * Find active user by ID
   * @param {number} userId - User ID
   * @returns {Object|null} - Active user object or null
   */
  async findActiveById(userId) {
    return await this.model.findOne({
      where: { 
        id: userId,
        isActive: true 
      }
    });
  }

  /**
   * Check if email exists (excluding specific user ID)
   * @param {string} email - Email to check
   * @param {number} excludeId - User ID to exclude from check
   * @returns {boolean} - True if exists, false otherwise
   */
  async emailExists(email, excludeId = null) {
    const whereClause = { email };
    
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const user = await this.model.findOne({ where: whereClause });
    return !!user;
  }

  /**
   * Check if username exists (excluding specific user ID)
   * @param {string} username - Username to check
   * @param {number} excludeId - User ID to exclude from check
   * @returns {boolean} - True if exists, false otherwise
   */
  async usernameExists(username, excludeId = null) {
    const whereClause = { username };
    
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const user = await this.model.findOne({ where: whereClause });
    return !!user;
  }

  /**
   * Get all users with filtering
   * @param {Object} filters - Filter options
   * @returns {Array} - Array of users
   */
  async findAllWithFilters(filters = {}) {
    const { role, isActive, limit = 50, offset = 0 } = filters;
    
    const whereClause = {};
    if (role) whereClause.role = role;
    if (typeof isActive === 'boolean') whereClause.isActive = isActive;

    return await this.model.findAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] } // Exclude password from results
    });
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Array} - Array of users with specified role
   */
  async findByRole(role) {
    return await this.model.findAll({
      where: { role },
      attributes: { exclude: ['password'] }
    });
  }

  /**
   * Get active users count
   * @returns {number} - Number of active users
   */
  async countActiveUsers() {
    return await this.model.count({
      where: { isActive: true }
    });
  }

  /**
   * Get inactive users count
   * @returns {number} - Number of inactive users
   */
  async countInactiveUsers() {
    return await this.model.count({
      where: { isActive: false }
    });
  }

  /**
   * Get user statistics by role
   * @returns {Array} - Role statistics
   */
  async getRoleStatistics() {
    return await this.model.findAll({
      attributes: [
        'role',
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('role')), 'count']
      ],
      group: ['role']
    });
  }

  /**
   * Update user's last login timestamp
   * @param {number} userId - User ID
   * @returns {Array} - Update result
   */
  async updateLastLogin(userId) {
    return await this.model.update(
      { lastLoginAt: new Date() },
      { where: { id: userId } }
    );
  }

  /**
   * Activate user account
   * @param {number} userId - User ID
   * @returns {Array} - Update result
   */
  async activateUser(userId) {
    return await this.model.update(
      { isActive: true },
      { where: { id: userId } }
    );
  }

  /**
   * Deactivate user account
   * @param {number} userId - User ID
   * @returns {Array} - Update result
   */
  async deactivateUser(userId) {
    return await this.model.update(
      { isActive: false },
      { where: { id: userId } }
    );
  }

  /**
   * Update user role
   * @param {number} userId - User ID
   * @param {string} newRole - New role
   * @returns {Array} - Update result
   */
  async updateRole(userId, newRole) {
    return await this.model.update(
      { role: newRole },
      { where: { id: userId } }
    );
  }

  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} hashedPassword - Hashed password
   * @returns {Array} - Update result
   */
  async updatePassword(userId, hashedPassword) {
    return await this.model.update(
      { password: hashedPassword },
      { where: { id: userId } }
    );
  }

  /**
   * Find recently registered users
   * @param {number} days - Number of days to look back
   * @returns {Array} - Array of recent users
   */
  async findRecentUsers(days = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return await this.model.findAll({
      where: {
        createdAt: {
          [Op.gte]: dateThreshold
        }
      },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });
  }

  /**
   * Find users with specific permissions level
   * @param {Array} roles - Array of roles to include
   * @returns {Array} - Array of users with specified roles
   */
  async findByRoles(roles) {
    return await this.model.findAll({
      where: {
        role: {
          [Op.in]: roles
        }
      },
      attributes: { exclude: ['password'] }
    });
  }

  /**
   * Search users by name or email
   * @param {string} searchTerm - Search term
   * @returns {Array} - Array of matching users
   */
  async searchUsers(searchTerm) {
    return await this.model.findAll({
      where: {
        [Op.or]: [
          {
            fullName: {
              [Op.like]: `%${searchTerm}%`
            }
          },
          {
            email: {
              [Op.like]: `%${searchTerm}%`
            }
          },
          {
            username: {
              [Op.like]: `%${searchTerm}%`
            }
          }
        ]
      },
      attributes: { exclude: ['password'] }
    });
  }

  /**
   * Bulk update user status
   * @param {Array} userIds - Array of user IDs
   * @param {boolean} isActive - Active status
   * @returns {Array} - Update result
   */
  async bulkUpdateStatus(userIds, isActive) {
    return await this.model.update(
      { isActive },
      {
        where: {
          id: {
            [Op.in]: userIds
          }
        }
      }
    );
  }

  /**
   * Get user profile with safe attributes (exclude password)
   * @param {number} userId - User ID
   * @returns {Object|null} - User profile or null
   */
  async getProfileById(userId) {
    return await this.model.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
  }
}

module.exports = AuthRepository;
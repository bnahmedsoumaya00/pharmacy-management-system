const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { ValidationError } = require('../exceptions/ValidationError');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} - User data with token
   */
  async registerUser(userData) {
    const { username, email, password, fullName, phone, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Sequelize.Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      throw new ValidationError(`User with this ${field} already exists`, 'USER_EXISTS');
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password, // Will be hashed automatically by the model
      fullName,
      phone: phone || null,
      role: role || 'cashier'
    });

    // Generate token
    const token = generateToken(newUser.id, newUser.role);

    return {
      user: newUser.toJSON(),
      token,
      expiresIn: '24h'
    };
  }

  /**
   * Authenticate user login
   * @param {string} identifier - Email or username
   * @param {string} password - User password
   * @returns {Object} - User data with token
   */
  async loginUser(identifier, password) {
    // Find user by email or username
    const user = await User.findByEmailOrUsername(identifier);

    if (!user) {
      throw new ValidationError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ValidationError('Account is deactivated. Please contact administrator.', 'ACCOUNT_DEACTIVATED');
    }

    // Verify password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      throw new ValidationError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user.id, user.role);

    return {
      user: user.toJSON(),
      token,
      expiresIn: '24h'
    };
  }

  /**
   * Get user profile by ID
   * @param {number} userId - User ID
   * @returns {Object} - User profile data
   */
  async getUserProfile(userId) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ValidationError('User not found', 'USER_NOT_FOUND');
    }

    return user.toJSON();
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updateData - Profile update data
   * @param {string} currentUserEmail - Current user email for conflict check
   * @returns {Object} - Updated user data
   */
  async updateUserProfile(userId, updateData, currentUserEmail) {
    const { fullName, phone, email } = updateData;

    // Check if email is being changed and if it already exists
    if (email && email !== currentUserEmail) {
      const existingUser = await User.findOne({
        where: { 
          email,
          id: { [User.sequelize.Sequelize.Op.ne]: userId }
        }
      });

      if (existingUser) {
        throw new ValidationError('Email already exists', 'EMAIL_EXISTS');
      }
    }

    // Update user
    const [updatedRows] = await User.update(
      { 
        fullName,
        phone,
        email
      },
      { 
        where: { id: userId },
        returning: true
      }
    );

    if (updatedRows === 0) {
      throw new ValidationError('User not found', 'USER_NOT_FOUND');
    }

    // Get updated user
    const updatedUser = await User.findByPk(userId);
    return updatedUser.toJSON();
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} - Success status
   */
  async changeUserPassword(userId, currentPassword, newPassword) {
    // Get user with password
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ValidationError('User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.checkPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
    }

    // Update password (will be hashed automatically)
    await user.update({ password: newPassword });
    return true;
  }

  /**
   * Validate user token and get user data
   * @param {number} userId - User ID from token
   * @returns {Object} - User data
   */
  async validateTokenUser(userId) {
    const user = await User.findOne({
      where: { 
        id: userId,
        isActive: true 
      }
    });

    if (!user) {
      throw new ValidationError('User not found or inactive', 'USER_NOT_FOUND');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    };
  }

  /**
   * Deactivate user account
   * @param {number} userId - User ID to deactivate
   * @returns {boolean} - Success status
   */
  async deactivateUser(userId) {
    const [updatedRows] = await User.update(
      { isActive: false },
      { where: { id: userId } }
    );

    if (updatedRows === 0) {
      throw new ValidationError('User not found', 'USER_NOT_FOUND');
    }

    return true;
  }

  /**
   * Activate user account
   * @param {number} userId - User ID to activate
   * @returns {boolean} - Success status
   */
  async activateUser(userId) {
    const [updatedRows] = await User.update(
      { isActive: true },
      { where: { id: userId } }
    );

    if (updatedRows === 0) {
      throw new ValidationError('User not found', 'USER_NOT_FOUND');
    }

    return true;
  }

  /**
   * Get all users (admin only)
   * @param {Object} options - Query options
   * @returns {Array} - List of users
   */
  async getAllUsers(options = {}) {
    const { limit = 50, offset = 0, role, isActive } = options;
    
    const whereClause = {};
    if (role) whereClause.role = role;
    if (typeof isActive === 'boolean') whereClause.isActive = isActive;

    const users = await User.findAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return users.map(user => user.toJSON());
  }

  /**
   * Get user statistics
   * @returns {Object} - User statistics
   */
  async getUserStats() {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const inactiveUsers = totalUsers - activeUsers;
    
    const roleStats = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('role')), 'count']
      ],
      group: ['role']
    });

    const roleDistribution = roleStats.reduce((acc, stat) => {
      acc[stat.role] = parseInt(stat.dataValues.count);
      return acc;
    }, {});

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleDistribution
    };
  }

  /**
   * Update user role (admin only)
   * @param {number} userId - User ID
   * @param {string} newRole - New role
   * @returns {Object} - Updated user data
   */
  async updateUserRole(userId, newRole) {
    const validRoles = ['admin', 'pharmacist', 'cashier'];
    if (!validRoles.includes(newRole)) {
      throw new ValidationError('Invalid role specified', 'INVALID_ROLE');
    }

    const [updatedRows] = await User.update(
      { role: newRole },
      { where: { id: userId } }
    );

    if (updatedRows === 0) {
      throw new ValidationError('User not found', 'USER_NOT_FOUND');
    }

    const updatedUser = await User.findByPk(userId);
    return updatedUser.toJSON();
  }
}

module.exports = AuthService;
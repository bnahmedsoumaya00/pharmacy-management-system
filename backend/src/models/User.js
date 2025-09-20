const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      name: 'username',
      msg: 'Username already exists'
    },
    validate: {
      len: {
        args: [3, 50],
        msg: 'Username must be between 3 and 50 characters'
      },
      notEmpty: {
        msg: 'Username cannot be empty'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      name: 'email',
      msg: 'Email already exists'
    },
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      },
      notEmpty: {
        msg: 'Email cannot be empty'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [6, 255],
        msg: 'Password must be at least 6 characters long'
      },
      notEmpty: {
        msg: 'Password cannot be empty'
      }
    }
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'full_name',
    validate: {
      len: {
        args: [2, 100],
        msg: 'Full name must be between 2 and 100 characters'
      },
      notEmpty: {
        msg: 'Full name cannot be empty'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isValidPhone(value) {
        if (value && !/^\+?[1-9]\d{1,14}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          throw new Error('Phone number format is invalid');
        }
      }
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'pharmacist', 'cashier'),
    defaultValue: 'cashier',
    allowNull: false,
    validate: {
      isIn: {
        args: [['admin', 'pharmacist', 'cashier']],
        msg: 'Role must be admin, pharmacist, or cashier'
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Hash password before creating user
User.beforeCreate(async (user) => {
  if (user.password) {
    const saltRounds = 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
});

// Hash password before updating user (if password changed)
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const saltRounds = 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
});

// Instance method to check password
User.prototype.checkPassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Instance method to update last login
User.prototype.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save({ fields: ['lastLogin'] });
};

// Remove sensitive information from JSON output
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

// Static method to find user by email or username
User.findByEmailOrUsername = async function(identifier) {
  return await User.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { email: identifier },
        { username: identifier }
      ]
    }
  });
};

// Static method to get active users only
User.getActiveUsers = async function() {
  return await User.findAll({
    where: { isActive: true },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = User;
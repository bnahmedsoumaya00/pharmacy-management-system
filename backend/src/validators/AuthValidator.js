const { body } = require('express-validator');
const BaseValidator = require('./BaseValidator');

/**
 * Authentication Validator - All authentication-related validations
 */
class AuthValidator extends BaseValidator {
  /**
   * User registration validation
   */
  static validateRegister() {
    return [
      this.usernameValidation(),
      this.requiredEmailValidation(),
      this.passwordValidation(),
      this.passwordConfirmValidation(),
      this.nameValidation('fullName', 2, 100),
      this.phoneValidation(),
      this.enumValidation('role', ['admin', 'pharmacist', 'cashier'])
        .optional()
    ];
  }

  /**
   * User login validation
   */
  static validateLogin() {
    return [
      body('identifier')
        .trim()
        .notEmpty()
        .withMessage('Email or username is required'),
      
      body('password')
        .notEmpty()
        .withMessage('Password is required')
    ];
  }

  /**
   * Profile update validation
   */
  static validateProfileUpdate() {
    return [
      this.nameValidation('fullName', 2, 100)
        .optional(),
      this.phoneValidation(),
      this.emailValidation()
    ];
  }

  /**
   * Password change validation
   */
  static validatePasswordChange() {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
      
      this.passwordValidation('newPassword'),
      
      body('confirmNewPassword')
        .custom((value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error('New password confirmation does not match new password');
          }
          return true;
        })
    ];
  }

  /**
   * Admin user creation validation
   */
  static validateUserCreation() {
    return [
      this.usernameValidation(),
      this.requiredEmailValidation(),
      this.passwordValidation(),
      this.nameValidation('fullName', 2, 100),
      this.phoneValidation(),
      this.enumValidation('role', ['admin', 'pharmacist', 'cashier'])
    ];
  }
}

module.exports = AuthValidator;
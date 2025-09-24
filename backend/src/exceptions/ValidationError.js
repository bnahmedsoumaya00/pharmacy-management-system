/**
 * Generic Validation Error - For general business rule violations
 */
class ValidationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR', statusCode = 400, context = {}) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  toJSON() {
    return {
      success: false,
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        context: this.context,
        timestamp: this.timestamp
      }
    };
  }
}

module.exports = ValidationError;
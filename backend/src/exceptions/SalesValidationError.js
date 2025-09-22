/**
 * Sales Validation Error - Custom exception for sales-related validation errors
 * Extends native Error with additional context for business logic violations
 */
class SalesValidationError extends Error {
  constructor(message, code = 'SALES_VALIDATION_ERROR', statusCode = 400, context = {}) {
    super(message);
    this.name = 'SalesValidationError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SalesValidationError);
    }
  }

  /**
   * Convert error to JSON response format
   * @returns {object}
   */
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

  /**
   * Get HTTP status code for this error
   * @returns {number}
   */
  getStatusCode() {
    return this.statusCode;
  }
}

module.exports = SalesValidationError;
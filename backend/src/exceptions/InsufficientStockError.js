/**
 * Insufficient Stock Error - For inventory stock violations
 */
class InsufficientStockError extends Error {
  constructor(message, code = 'INSUFFICIENT_STOCK', statusCode = 400, context = {}) {
    super(message);
    this.name = 'InsufficientStockError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InsufficientStockError);
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

// Export as both default and named export to support different import styles
module.exports = InsufficientStockError;
module.exports.InsufficientStockError = InsufficientStockError;
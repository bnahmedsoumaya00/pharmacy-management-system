/**
 * Insufficient Stock Error - Specific exception for inventory shortage situations
 * Provides detailed context about stock availability vs demand
 */
class InsufficientStockError extends Error {
  constructor(message, medicineId, availableStock, requestedQuantity, code = 'INSUFFICIENT_STOCK') {
    super(message);
    this.name = 'InsufficientStockError';
    this.code = code;
    this.statusCode = 400;
    this.medicineId = medicineId;
    this.availableStock = availableStock;
    this.requestedQuantity = requestedQuantity;
    this.shortage = requestedQuantity - availableStock;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InsufficientStockError);
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
        details: {
          medicineId: this.medicineId,
          availableStock: this.availableStock,
          requestedQuantity: this.requestedQuantity,
          shortage: this.shortage
        },
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

  /**
   * Get suggested action message
   * @returns {string}
   */
  getSuggestion() {
    if (this.availableStock === 0) {
      return 'This medicine is out of stock. Please reorder from supplier.';
    }
    return `Only ${this.availableStock} units available. Consider partial fulfillment or reordering.`;
  }
}

module.exports = InsufficientStockError;
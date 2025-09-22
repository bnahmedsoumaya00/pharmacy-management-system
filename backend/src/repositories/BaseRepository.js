const { Op } = require('sequelize');

/**
 * Base Repository implementing common CRUD operations
 * Following Repository Pattern for data access abstraction
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find entity by primary key
   * @param {number} id - Primary key
   * @param {object} options - Query options
   * @returns {Promise<object|null>}
   */
  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  /**
   * Find single entity by criteria
   * @param {object} where - Where conditions
   * @param {object} options - Query options
   * @returns {Promise<object|null>}
   */
  async findOne(where, options = {}) {
    return await this.model.findOne({
      where,
      ...options
    });
  }

  /**
   * Find all entities with pagination
   * @param {object} criteria - Search criteria
   * @returns {Promise<{rows: Array, count: number}>}
   */
  async findAll(criteria = {}) {
    const {
      where = {},
      include = [],
      page = 1,
      limit = 20,
      order = [['createdAt', 'DESC']],
      attributes
    } = criteria;

    const offset = (page - 1) * parseInt(limit);

    return await this.model.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset,
      order,
      attributes,
      distinct: true
    });
  }

  /**
   * Create new entity
   * @param {object} data - Entity data
   * @param {object} options - Creation options
   * @returns {Promise<object>}
   */
  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  /**
   * Update entity by ID
   * @param {number} id - Entity ID
   * @param {object} data - Update data
   * @param {object} options - Update options
   * @returns {Promise<[number, Array]>}
   */
  async update(id, data, options = {}) {
    return await this.model.update(data, {
      where: { id },
      ...options
    });
  }

  /**
   * Soft delete entity (set isActive = false)
   * @param {number} id - Entity ID
   * @returns {Promise<[number, Array]>}
   */
  async softDelete(id) {
    return await this.model.update(
      { isActive: false },
      { where: { id } }
    );
  }

  /**
   * Hard delete entity
   * @param {number} id - Entity ID
   * @returns {Promise<number>}
   */
  async delete(id) {
    return await this.model.destroy({
      where: { id }
    });
  }

  /**
   * Count entities by criteria
   * @param {object} where - Where conditions
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    return await this.model.count({ where });
  }

  /**
   * Check if entity exists
   * @param {object} where - Where conditions
   * @returns {Promise<boolean>}
   */
  async exists(where) {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Bulk create entities
   * @param {Array} data - Array of entity data
   * @param {object} options - Bulk create options
   * @returns {Promise<Array>}
   */
  async bulkCreate(data, options = {}) {
    return await this.model.bulkCreate(data, options);
  }

  /**
   * Execute raw query
   * @param {string} query - SQL query
   * @param {object} options - Query options
   * @returns {Promise<Array>}
   */
  async rawQuery(query, options = {}) {
    return await this.model.sequelize.query(query, {
      model: this.model,
      mapToModel: true,
      ...options
    });
  }

  /**
   * Get model instance for advanced operations
   * @returns {object}
   */
  getModel() {
    return this.model;
  }
}

module.exports = BaseRepository;
const BaseRepository = require('./BaseRepository');
const { Category, Medicine, sequelize } = require('../models/index');
const { Op } = require('sequelize');

/**
 * Category Repository - Handles category-specific database operations
 */
class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  /**
   * Get categories with medicine count
   * @returns {Promise<Array>}
   */
  async getCategoriesWithMedicineCount() {
    return await this.model.findAll({
      attributes: [
        'id',
        'name', 
        'description',
        'createdAt',
        'updatedAt',
        [sequelize.fn('COUNT', sequelize.col('medicines.id')), 'medicineCount']
      ],
      include: [{
        model: Medicine,
        as: 'medicines',
        attributes: [],
        required: false,
        where: { isActive: true }
      }],
      group: ['Category.id'],
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get category with its medicines
   * @param {number} categoryId - Category ID
   * @returns {Promise<object|null>}
   */
  async getCategoryWithMedicines(categoryId) {
    return await this.findById(categoryId, {
      include: [{
        model: Medicine,
        as: 'medicines',
        where: { isActive: true },
        required: false,
        order: [['name', 'ASC']]
      }]
    });
  }

  /**
   * Search categories by name
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>}
   */
  async searchCategories(searchTerm) {
    return await this.model.findAll({
      where: {
        name: {
          [Op.like]: `%${searchTerm}%`
        }
      },
      order: [['name', 'ASC']]
    });
  }

  /**
   * Check if category can be deleted (no active medicines)
   * @param {number} categoryId - Category ID
   * @returns {Promise<boolean>}
   */
  async canBeDeleted(categoryId) {
    const medicineCount = await Medicine.count({
      where: {
        categoryId,
        isActive: true
      }
    });
    
    return medicineCount === 0;
  }

  /**
   * Get category statistics
   * @returns {Promise<object>}
   */
  async getCategoryStats() {
    const stats = await this.model.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Category.id')), 'totalCategories'],
        [sequelize.fn('COUNT', 
          sequelize.literal('CASE WHEN medicines.id IS NOT NULL THEN 1 END')
        ), 'categoriesWithMedicines'],
        [sequelize.fn('AVG', 
          sequelize.literal('(SELECT COUNT(*) FROM medicines WHERE category_id = Category.id AND is_active = 1)')
        ), 'avgMedicinesPerCategory']
      ],
      include: [{
        model: Medicine,
        as: 'medicines',
        attributes: [],
        required: false,
        where: { isActive: true }
      }],
      raw: true
    });

    return stats[0] || {
      totalCategories: 0,
      categoriesWithMedicines: 0,
      avgMedicinesPerCategory: 0
    };
  }
}

module.exports = CategoryRepository;
const CategoryRepository = require('../repositories/CategoryRepository');
const ValidationError = require('../exceptions/ValidationError');

/**
 * Category Service - Business logic for category operations
 */
class CategoryService {
  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * Get all categories with optional medicine count
   * @param {boolean} includeMedicineCount - Include medicine count
   * @returns {Promise<Array>}
   */
  async getAllCategories(includeMedicineCount = false) {
    if (includeMedicineCount) {
      return await this.categoryRepository.getCategoriesWithMedicineCount();
    }
    
    const result = await this.categoryRepository.findAll({
      order: [['name', 'ASC']]
    });
    
    return result.rows;
  }

  /**
   * Get category by ID with optional medicines
   * @param {number} categoryId - Category ID
   * @param {boolean} includeMedicines - Include medicines
   * @returns {Promise<object>}
   */
  async getCategoryById(categoryId, includeMedicines = false) {
    let category;
    
    if (includeMedicines) {
      category = await this.categoryRepository.getCategoryWithMedicines(categoryId);
    } else {
      category = await this.categoryRepository.findById(categoryId);
    }

    if (!category) {
      throw new ValidationError('Category not found', 'CATEGORY_NOT_FOUND', 404);
    }

    return category;
  }

  /**
   * Create new category
   * @param {object} categoryData - Category data
   * @returns {Promise<object>}
   */
  async createCategory(categoryData) {
    // Check if category name already exists
    const existingCategory = await this.categoryRepository.findOne({
      name: categoryData.name
    });

    if (existingCategory) {
      throw new ValidationError(
        'Category name already exists', 
        'CATEGORY_NAME_EXISTS', 
        409
      );
    }

    return await this.categoryRepository.create(categoryData);
  }

  /**
   * Update category
   * @param {number} categoryId - Category ID
   * @param {object} updateData - Update data
   * @returns {Promise<object>}
   */
  async updateCategory(categoryId, updateData) {
    const category = await this.categoryRepository.findById(categoryId);
    
    if (!category) {
      throw new ValidationError('Category not found', 'CATEGORY_NOT_FOUND', 404);
    }

    // Check name uniqueness if name is being updated
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        name: updateData.name
      });

      if (existingCategory) {
        throw new ValidationError(
          'Category name already exists', 
          'CATEGORY_NAME_EXISTS', 
          409
        );
      }
    }

    await this.categoryRepository.update(categoryId, updateData);
    return await this.categoryRepository.findById(categoryId);
  }

  /**
   * Delete category
   * @param {number} categoryId - Category ID
   * @returns {Promise<void>}
   */
  async deleteCategory(categoryId) {
    const category = await this.categoryRepository.findById(categoryId);
    
    if (!category) {
      throw new ValidationError('Category not found', 'CATEGORY_NOT_FOUND', 404);
    }

    // Check if category can be deleted
    const canDelete = await this.categoryRepository.canBeDeleted(categoryId);
    
    if (!canDelete) {
      throw new ValidationError(
        'Cannot delete category with active medicines. Move medicines to another category first.',
        'CATEGORY_HAS_MEDICINES',
        409
      );
    }

    await this.categoryRepository.delete(categoryId);
  }

  /**
   * Search categories
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>}
   */
  async searchCategories(searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new ValidationError(
        'Search term must be at least 2 characters', 
        'INVALID_SEARCH_TERM'
      );
    }

    return await this.categoryRepository.searchCategories(searchTerm.trim());
  }

  /**
   * Get category statistics
   * @returns {Promise<object>}
   */
  async getCategoryStatistics() {
    return await this.categoryRepository.getCategoryStats();
  }
}

module.exports = CategoryService;

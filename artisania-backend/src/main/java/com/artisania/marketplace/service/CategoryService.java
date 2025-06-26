package com.artisania.marketplace.service;

import com.artisania.marketplace.model.Category;
import com.artisania.marketplace.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Autowired
    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    // Get all categories (non-paginated - for backward compatibility)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // Get all categories with pagination
    public Page<Category> getAllCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable);
    }

    // Get category by ID
    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    // Get category by name
    public Optional<Category> getCategoryByName(String name) {
        return categoryRepository.findByName(name);
    }

    // Get category by slug
    public Optional<Category> getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug);
    }

    // Create new category
    public Category createCategory(Category category) {
        // Check if name already exists
        if (categoryRepository.existsByName(category.getName())) {
            throw new IllegalArgumentException("Category name already exists: " + category.getName());
        }

        // Check if slug already exists
        if (categoryRepository.existsBySlug(category.getSlug())) {
            throw new IllegalArgumentException("Category slug already exists: " + category.getSlug());
        }

        return categoryRepository.save(category);
    }

    // Update category
    public Category updateCategory(Long id, Category categoryDetails) {
        return categoryRepository.findById(id).map(category -> {
            if (categoryDetails.getName() != null && !categoryDetails.getName().equals(category.getName())) {
                // Check if new name already exists
                if (categoryRepository.existsByName(categoryDetails.getName())) {
                    throw new IllegalArgumentException("Category name already exists: " + categoryDetails.getName());
                }
                category.setName(categoryDetails.getName());
            }
            
            if (categoryDetails.getSlug() != null && !categoryDetails.getSlug().equals(category.getSlug())) {
                // Check if new slug already exists
                if (categoryRepository.existsBySlug(categoryDetails.getSlug())) {
                    throw new IllegalArgumentException("Category slug already exists: " + categoryDetails.getSlug());
                }
                category.setSlug(categoryDetails.getSlug());
            }
            
            return categoryRepository.save(category);
        }).orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }

    // Delete category
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        // Check if category has products
        Long productCount = categoryRepository.countProductsInCategory(category);
        if (productCount > 0) {
            throw new IllegalStateException("Cannot delete category with existing products. " +
                "Please move or delete all products in this category first.");
        }
        
        categoryRepository.deleteById(id);
    }

    // Get all categories ordered by name
    public List<Category> getAllCategoriesOrderedByName() {
        return categoryRepository.findAllOrderByName();
    }

    // Get categories with products
    public List<Category> getCategoriesWithProducts() {
        return categoryRepository.findCategoriesWithProducts();
    }

    // Search categories by name
    public List<Category> searchCategoriesByName(String name) {
        return categoryRepository.findByNameContainingIgnoreCase(name);
    }

    // Search categories by name with pagination
    public Page<Category> searchCategoriesByName(String name, Pageable pageable) {
        return categoryRepository.findByNameContainingIgnoreCase(name, pageable);
    }

    // Count products in category
    public Long countProductsInCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
        return categoryRepository.countProductsInCategory(category);
    }

    // Check if name exists
    public boolean nameExists(String name) {
        return categoryRepository.existsByName(name);
    }

    // Check if slug exists
    public boolean slugExists(String slug) {
        return categoryRepository.existsBySlug(slug);
    }

    // Generate unique slug from name
    public String generateSlug(String name) {
        String baseSlug = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "") // Remove special characters
                .replaceAll("\\s+", "-") // Replace spaces with hyphens
                .replaceAll("-+", "-") // Replace multiple hyphens with single
                .replaceAll("^-|-$", ""); // Remove leading/trailing hyphens
        
        String slug = baseSlug;
        int counter = 1;
        
        // Ensure slug is unique
        while (categoryRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        
        return slug;
    }

    // Create category with auto-generated slug
    public Category createCategoryWithSlug(String name) {
        String slug = generateSlug(name);
        Category category = new Category(name, slug);
        return createCategory(category);
    }
} 
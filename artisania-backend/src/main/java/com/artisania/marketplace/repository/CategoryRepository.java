package com.artisania.marketplace.repository;

import com.artisania.marketplace.model.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    // Find by name
    Optional<Category> findByName(String name);
    
    // Find by slug
    Optional<Category> findBySlug(String slug);
    
    // Check if name exists
    boolean existsByName(String name);
    
    // Check if slug exists
    boolean existsBySlug(String slug);
    
    // Find categories by name containing (case insensitive)
    List<Category> findByNameContainingIgnoreCase(String name);
    
    // Find categories by name containing with pagination
    Page<Category> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    // Get all categories ordered by name
    @Query("SELECT c FROM Category c ORDER BY c.name ASC")
    List<Category> findAllOrderByName();
    
    // Get categories with products count
    @Query("SELECT c FROM Category c WHERE SIZE(c.products) > 0")
    List<Category> findCategoriesWithProducts();
    
    // Count products in category
    @Query("SELECT COUNT(p) FROM Product p WHERE p.category = :category")
    Long countProductsInCategory(@Param("category") Category category);
} 
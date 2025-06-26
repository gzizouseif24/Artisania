package com.artisania.marketplace.repository;

import com.artisania.marketplace.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // Find products by artisan ID
    List<Product> findByArtisanId(Long artisanId);
    
    // Find products by category ID
    List<Product> findByCategoryId(Long categoryId);
    
    // Find featured products
    List<Product> findByIsFeaturedTrue();
    
    // Search products by name or description (case insensitive)
    List<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
    
    // Find products by artisan ID and featured status
    List<Product> findByArtisanIdAndIsFeaturedTrue(Long artisanId);
    
    // Find products by category ID and featured status
    List<Product> findByCategoryIdAndIsFeaturedTrue(Long categoryId);
    
    // Find products with stock greater than 0
    List<Product> findByStockQuantityGreaterThan(Integer quantity);
    
    // Find products by artisan ID with stock
    List<Product> findByArtisanIdAndStockQuantityGreaterThan(Long artisanId, Integer quantity);
} 
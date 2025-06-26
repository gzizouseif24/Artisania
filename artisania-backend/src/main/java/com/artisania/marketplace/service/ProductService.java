package com.artisania.marketplace.service;

import com.artisania.marketplace.model.Product;
import com.artisania.marketplace.model.User;
import com.artisania.marketplace.model.ArtisanProfile;
import com.artisania.marketplace.model.Category;
import com.artisania.marketplace.repository.ProductRepository;
import com.artisania.marketplace.repository.ArtisanProfileRepository;
import com.artisania.marketplace.repository.UserRepository;
import com.artisania.marketplace.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ArtisanProfileRepository artisanProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * Get the currently authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    /**
     * Create a new product and automatically associate it with the authenticated artisan
     */
    public Product createProduct(Product product) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("Authentication required to create product");
        }

        // Get the artisan profile for the current user
        Optional<ArtisanProfile> artisanProfile = artisanProfileRepository.findByUserId(currentUser.getId());
        if (artisanProfile.isEmpty()) {
            throw new RuntimeException("User must have an artisan profile to create products");
        }

        // Validate that category is provided
        if (product.getCategory() == null) {
            throw new RuntimeException("Product category is required");
        }

        // If category only has ID, fetch the full category object
        if (product.getCategory().getId() != null && product.getCategory().getName() == null) {
            Optional<Category> fullCategory = categoryRepository.findById(product.getCategory().getId());
            if (fullCategory.isEmpty()) {
                throw new RuntimeException("Category not found with id: " + product.getCategory().getId());
            }
            product.setCategory(fullCategory.get());
        }

        // Associate product with the artisan
        product.setArtisan(artisanProfile.get());
        
        return productRepository.save(product);
    }

    // Get all products
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // Get product by ID
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    // Save product (create or update)
    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    // Delete product
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    // Get products by artisan ID
    public List<Product> getProductsByArtisanId(Long artisanId) {
        return productRepository.findByArtisanId(artisanId);
    }

    // Get products by category ID
    public List<Product> getProductsByCategoryId(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    // Get featured products
    public List<Product> getFeaturedProducts() {
        return productRepository.findByIsFeaturedTrue();
    }

    // Search products by name or description
    public List<Product> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(keyword, keyword);
    }

    // Get products with stock
    public List<Product> getProductsInStock() {
        return productRepository.findByStockQuantityGreaterThan(0);
    }

    // Get products by artisan ID with stock
    public List<Product> getProductsByArtisanIdInStock(Long artisanId) {
        return productRepository.findByArtisanIdAndStockQuantityGreaterThan(artisanId, 0);
    }

    // Check if product exists
    public boolean existsById(Long id) {
        return productRepository.existsById(id);
    }

    // Update product stock
    public Product updateProductStock(Long id, Integer newStock) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            product.setStockQuantity(newStock);
            return productRepository.save(product);
        }
        throw new RuntimeException("Product not found with id: " + id);
    }
} 
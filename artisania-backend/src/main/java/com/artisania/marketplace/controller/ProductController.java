package com.artisania.marketplace.controller;

import com.artisania.marketplace.model.Product;
import com.artisania.marketplace.model.User;
import com.artisania.marketplace.model.Category;
import com.artisania.marketplace.service.ProductService;
import com.artisania.marketplace.service.SecurityService;
import com.artisania.marketplace.repository.CategoryRepository;
import com.artisania.marketplace.repository.ArtisanProfileRepository;
import com.artisania.marketplace.dto.CreateProductRequest;
import com.artisania.marketplace.model.ArtisanProfile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private SecurityService securityService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ArtisanProfileRepository artisanProfileRepository;

    // Get all products - Public access
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    // Get product by ID - Public access
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Optional<Product> product = productService.getProductById(id);
        return product.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    // Create new product - Only ARTISAN can create products
    @PostMapping
    @PreAuthorize("hasRole('ARTISAN')")
    public ResponseEntity<Product> createProduct(@Valid @RequestBody CreateProductRequest createRequest) {
        // Get current user (artisan)
        User currentUser = securityService.getCurrentUser();
        
        // Get artisan profile
        Optional<ArtisanProfile> artisanProfileOpt = artisanProfileRepository.findByUserId(currentUser.getId());
        if (artisanProfileOpt.isEmpty()) {
            throw new RuntimeException("User must have an artisan profile to create products");
        }
        
        // Get the category
        Category category = categoryRepository.findById(createRequest.getCategoryId())
            .orElseThrow(() -> new RuntimeException("Category not found"));
        
        // Create product entity from DTO
        Product product = new Product();
        product.setName(createRequest.getName());
        product.setDescription(createRequest.getDescription());
        product.setPrice(createRequest.getPrice());
        product.setStockQuantity(createRequest.getStockQuantity());
        product.setCategory(category);
        product.setArtisan(artisanProfileOpt.get());
        product.setIsFeatured(createRequest.getIsFeatured() != null ? createRequest.getIsFeatured() : false);
        
        Product savedProduct = productService.saveProduct(product);
        return ResponseEntity.ok(savedProduct);
    }

    // Update product - Only product owner (ARTISAN) or ADMIN can update
    @PutMapping("/{id}")
    @PreAuthorize("@securityService.canEditProduct(#id)")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        Optional<Product> existingProduct = productService.getProductById(id);
        if (existingProduct.isPresent()) {
            product.setId(id);
            Product updatedProduct = productService.saveProduct(product);
            return ResponseEntity.ok(updatedProduct);
        }
        return ResponseEntity.notFound().build();
    }

    // Delete product - Only product owner (ARTISAN) or ADMIN can delete
    @DeleteMapping("/{id}")
    @PreAuthorize("@securityService.canEditProduct(#id)")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        Optional<Product> product = productService.getProductById(id);
        if (product.isPresent()) {
            productService.deleteProduct(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Get products by artisan - Public access
    @GetMapping("/artisan/{artisanId}")
    public ResponseEntity<List<Product>> getProductsByArtisan(@PathVariable Long artisanId) {
        List<Product> products = productService.getProductsByArtisanId(artisanId);
        return ResponseEntity.ok(products);
    }

    // Get products by category - Public access
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable Long categoryId) {
        List<Product> products = productService.getProductsByCategoryId(categoryId);
        return ResponseEntity.ok(products);
    }

    // Get featured products - Public access
    @GetMapping("/featured")
    public ResponseEntity<List<Product>> getFeaturedProducts() {
        List<Product> products = productService.getFeaturedProducts();
        return ResponseEntity.ok(products);
    }

    // Search products by name - Public access
    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProductsByName(@RequestParam String name) {
        List<Product> products = productService.searchProducts(name);
        return ResponseEntity.ok(products);
    }

    // Toggle featured status - Only ADMIN can toggle featured status
    @PutMapping("/{id}/featured")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> toggleFeaturedStatus(@PathVariable Long id) {
        Optional<Product> productOpt = productService.getProductById(id);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            product.setIsFeatured(!product.getIsFeatured());
            Product updatedProduct = productService.saveProduct(product);
            return ResponseEntity.ok(updatedProduct);
        }
        return ResponseEntity.notFound().build();
    }
} 
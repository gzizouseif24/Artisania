package com.artisania.marketplace.service;

import com.artisania.marketplace.model.ArtisanProfile;
import com.artisania.marketplace.model.Order;
import com.artisania.marketplace.model.Product;
import com.artisania.marketplace.model.ProductImage;
import com.artisania.marketplace.model.User;
import com.artisania.marketplace.repository.ArtisanProfileRepository;
import com.artisania.marketplace.repository.OrderRepository;
import com.artisania.marketplace.repository.ProductImageRepository;
import com.artisania.marketplace.repository.ProductRepository;
import com.artisania.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class SecurityService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private ArtisanProfileRepository artisanProfileRepository;
    
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    /**
     * Get the currently authenticated user
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    /**
     * Check if current user is the owner of a product or is an admin
     */
    public boolean canEditProduct(Long productId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        
        // Admin can edit any product
        if (hasRole("ADMIN")) {
            return true;
        }
        
        // Artisan can edit their own products
        if (hasRole("ARTISAN")) {
            Optional<Product> product = productRepository.findById(productId);
            if (product.isPresent()) {
                return product.get().getArtisan().getUser().getId().equals(currentUser.getId());
            }
        }
        
        return false;
    }

    /**
     * Check if current user can edit an artisan profile
     */
    public boolean canEditArtisanProfile(Long artisanProfileId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        
        // Admin can edit any profile
        if (hasRole("ADMIN")) {
            return true;
        }
        
        // Artisan can edit their own profile
        Optional<ArtisanProfile> profile = artisanProfileRepository.findById(artisanProfileId);
        if (profile.isPresent()) {
            return profile.get().getUser().getId().equals(currentUser.getId());
        }
        
        return false;
    }

    /**
     * Check if current user can view orders for a specific customer
     */
    public boolean canViewCustomerOrders(Long customerId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        
        // Admin can view any orders
        if (hasRole("ADMIN")) {
            return true;
        }
        
        // User can view their own orders
        return currentUser.getId().equals(customerId);
    }

    /**
     * Check if current user can view a specific order
     */
    public boolean canViewOrder(Long orderId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        
        // Admin can view any order
        if (hasRole("ADMIN")) {
            return true;
        }
        
        Optional<Order> order = orderRepository.findById(orderId);
        if (order.isPresent()) {
            Order orderEntity = order.get();
            
            // Customer can view their own orders
            if (orderEntity.getCustomer() != null && 
                orderEntity.getCustomer().getId().equals(currentUser.getId())) {
                return true;
            }
            
            // Artisan can view orders containing their products
            if (hasRole("ARTISAN")) {
                return orderEntity.getOrderItems().stream()
                    .anyMatch(item -> item.getProduct().getArtisan().getUser().getId().equals(currentUser.getId()));
            }
        }
        
        return false;
    }

    /**
     * Check if current user can update order status
     */
    public boolean canUpdateOrderStatus(Long orderId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        
        // Admin can update any order status
        if (hasRole("ADMIN")) {
            return true;
        }
        
        // Artisan can update status of orders containing their products
        if (hasRole("ARTISAN")) {
            Optional<Order> order = orderRepository.findById(orderId);
            if (order.isPresent()) {
                return order.get().getOrderItems().stream()
                    .anyMatch(item -> item.getProduct().getArtisan().getUser().getId().equals(currentUser.getId()));
            }
        }
        
        return false;
    }

    /**
     * Check if current user can create product images for a product
     */
    public boolean canCreateProductImage(Long productId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        
        // Admin can create images for any product
        if (hasRole("ADMIN")) {
            return true;
        }
        
        // Artisan can create images for their own products
        if (hasRole("ARTISAN")) {
            Optional<Product> product = productRepository.findById(productId);
            if (product.isPresent()) {
                return product.get().getArtisan().getUser().getId().equals(currentUser.getId());
            }
        }
        
        return false;
    }

    /**
     * Check if current user is accessing their own user data
     */
    public boolean isCurrentUser(Long userId) {
        User currentUser = getCurrentUser();
        return currentUser != null && currentUser.getId().equals(userId);
    }

    /**
     * Check if current user has a specific role
     */
    public boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }

    public boolean canEditProductImage(Long imageId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }

        // Admin can edit any product image
        if (hasRole("ADMIN")) {
            return true;
        }

        // Artisan can edit images for their own products
        if (hasRole("ARTISAN")) {
            Optional<ProductImage> image = productImageRepository.findById(imageId);
            if (image.isPresent()) {
                return image.get().getProduct().getArtisan().getUser().getId().equals(currentUser.getId());
            }
        }

        return false;
    }

    /**
     * Check if current artisan has products in a specific order
     */
    public boolean artisanHasProductsInOrder(Long orderId) {
        User currentUser = getCurrentUser();
        if (currentUser == null || !hasRole("ARTISAN")) {
            return false;
        }

        Optional<Order> order = orderRepository.findById(orderId);
        if (order.isPresent()) {
            return order.get().getOrderItems().stream()
                .anyMatch(item -> item.getProduct().getArtisan().getUser().getId().equals(currentUser.getId()));
        }

        return false;
    }

    /**
     * Check if current artisan owns a specific order item
     */
    public boolean artisanOwnsOrderItem(Long itemId) {
        User currentUser = getCurrentUser();
        if (currentUser == null || !hasRole("ARTISAN")) {
            return false;
        }

        Optional<com.artisania.marketplace.model.OrderItem> item = orderRepository.findOrderItemById(itemId);
        if (item.isPresent()) {
            return item.get().getProduct().getArtisan().getUser().getId().equals(currentUser.getId());
        }

        return false;
    }
} 
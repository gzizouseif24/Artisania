package com.artisania.marketplace.repository;

import com.artisania.marketplace.model.CartItem;
import com.artisania.marketplace.model.User;
import com.artisania.marketplace.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    // Find all cart items for a specific user
    List<CartItem> findByUser(User user);
    
    // Find all cart items for a user by user ID
    List<CartItem> findByUserId(Long userId);
    
    // Find a specific cart item by user and product
    Optional<CartItem> findByUserAndProduct(User user, Product product);
    
    // Find a cart item by user ID and product ID
    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);
    
    // Delete all cart items for a user
    void deleteByUser(User user);
    
    // Delete all cart items for a user by user ID
    void deleteByUserId(Long userId);
    
    // Count cart items for a user
    long countByUserId(Long userId);
    
    // Calculate total cart value for a user
    @Query("SELECT COALESCE(SUM(ci.priceAtTime * ci.quantity), 0) FROM CartItem ci WHERE ci.user.id = :userId")
    BigDecimal calculateCartTotal(@Param("userId") Long userId);
    
    // Get cart items with product details for a user
    @Query("SELECT ci FROM CartItem ci JOIN FETCH ci.product p LEFT JOIN FETCH p.productImages WHERE ci.user.id = :userId ORDER BY ci.createdAt DESC")
    List<CartItem> findByUserIdWithProductDetails(@Param("userId") Long userId);
    
    // Check if product exists in user's cart
    boolean existsByUserIdAndProductId(Long userId, Long productId);
} 
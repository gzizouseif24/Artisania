package com.artisania.marketplace.repository;

import com.artisania.marketplace.model.Order;
import com.artisania.marketplace.model.OrderItem;
import com.artisania.marketplace.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Find orders by customer
    List<Order> findByCustomer(User customer);
    
    // Find orders by customer ordered by creation date
    List<Order> findByCustomerOrderByCreatedAtDesc(User customer);
    
    // Find orders by status
    List<Order> findByStatus(Order.OrderStatus status);
    
    // Find orders by guest email
    List<Order> findByGuestEmail(String guestEmail);
    
    // Find orders by date range
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate")
    List<Order> findOrdersByDateRange(@Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);
    
    // Find orders by total price range
    @Query("SELECT o FROM Order o WHERE o.totalPrice BETWEEN :minPrice AND :maxPrice")
    List<Order> findOrdersByPriceRange(@Param("minPrice") BigDecimal minPrice, 
                                      @Param("maxPrice") BigDecimal maxPrice);
    
    // Get recent orders (last 30 days)
    @Query("SELECT o FROM Order o WHERE o.createdAt >= :date ORDER BY o.createdAt DESC")
    List<Order> findRecentOrders(@Param("date") LocalDateTime date);
    
    // Count orders by status
    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status")
    Long countOrdersByStatus(@Param("status") Order.OrderStatus status);
    
    // Get total revenue
    @Query("SELECT SUM(o.totalPrice) FROM Order o WHERE o.status IN ('DELIVERED', 'SHIPPED')")
    BigDecimal getTotalRevenue();
    
    // Get total revenue by date range
    @Query("SELECT SUM(o.totalPrice) FROM Order o WHERE o.status IN ('DELIVERED', 'SHIPPED') " +
           "AND o.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal getTotalRevenueByDateRange(@Param("startDate") LocalDateTime startDate, 
                                         @Param("endDate") LocalDateTime endDate);
    
    // Find orders containing specific product
    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderItems oi WHERE oi.product.id = :productId")
    List<Order> findOrdersContainingProduct(@Param("productId") Long productId);
    
    // Find orders containing products from a specific artisan user
    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderItems oi WHERE oi.product.artisan.user.id = :artisanUserId")
    List<Order> findOrdersContainingArtisanProducts(@Param("artisanUserId") Long artisanUserId);
    
    // DEBUG: Get all orders with their order items for debugging
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.product p LEFT JOIN FETCH p.artisan a LEFT JOIN FETCH a.user u")
    List<Order> findAllOrdersWithDetails();
    
    // Find order item by ID
    @Query("SELECT oi FROM OrderItem oi WHERE oi.id = :itemId")
    java.util.Optional<OrderItem> findOrderItemById(@Param("itemId") Long itemId);
} 
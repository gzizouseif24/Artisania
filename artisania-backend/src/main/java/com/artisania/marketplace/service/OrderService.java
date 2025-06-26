package com.artisania.marketplace.service;

import com.artisania.marketplace.model.Order;
import com.artisania.marketplace.model.OrderItem;
import com.artisania.marketplace.model.Product;
import com.artisania.marketplace.model.User;
import com.artisania.marketplace.repository.OrderRepository;
import com.artisania.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductService productService;

    @Autowired
    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

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
     * Create order for the currently authenticated user (customer)
     */
    public Order createOrderForCurrentUser(Order order) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("Authentication required to create order");
        }

        // Associate order with the current user (customer)
        order.setCustomer(currentUser);
        
        // Clear guest email if set (shouldn't be for authenticated users)
        order.setGuestEmail(null);
        
        return createOrder(order);
    }

    // Get all orders
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // Get order by ID
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    // Get orders by customer
    public List<Order> getOrdersByCustomer(User customer) {
        return orderRepository.findByCustomerOrderByCreatedAtDesc(customer);
    }

    // Get orders by customer ID
    public List<Order> getOrdersByCustomerId(Long customerId) {
        User customer = new User();
        customer.setId(customerId);
        return orderRepository.findByCustomer(customer);
    }

    // Get orders for the currently authenticated user
    public List<Order> getOrdersForCurrentUser() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("Authentication required to get user orders");
        }
        return orderRepository.findByCustomerOrderByCreatedAtDesc(currentUser);
    }

    // Get orders by status
    public List<Order> getOrdersByStatus(Order.OrderStatus status) {
        return orderRepository.findByStatus(status);
    }

    // Get orders by guest email
    public List<Order> getOrdersByGuestEmail(String guestEmail) {
        return orderRepository.findByGuestEmail(guestEmail);
    }

    // Create new order
    public Order createOrder(Order order) {
        // Validate order
        validateOrder(order);
        
        // Set initial status if not set
        if (order.getStatus() == null) {
            order.setStatus(Order.OrderStatus.PENDING);
        }
        
        // Handle order items - set the order reference for each item
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            for (OrderItem item : order.getOrderItems()) {
                item.setOrder(order);
            }
        }
        
        return orderRepository.save(order);
    }

    // Update order
    public Order updateOrder(Long id, Order orderDetails) {
        return orderRepository.findById(id).map(order -> {
            if (orderDetails.getStatus() != null) {
                order.setStatus(orderDetails.getStatus());
            }
            
            if (orderDetails.getTotalPrice() != null) {
                order.setTotalPrice(orderDetails.getTotalPrice());
            }
            
            // Update shipping information
            if (orderDetails.getShippingName() != null) {
                order.setShippingName(orderDetails.getShippingName());
            }
            if (orderDetails.getShippingAddressLine1() != null) {
                order.setShippingAddressLine1(orderDetails.getShippingAddressLine1());
            }
            if (orderDetails.getShippingAddressLine2() != null) {
                order.setShippingAddressLine2(orderDetails.getShippingAddressLine2());
            }
            if (orderDetails.getShippingCity() != null) {
                order.setShippingCity(orderDetails.getShippingCity());
            }
            if (orderDetails.getShippingPostalCode() != null) {
                order.setShippingPostalCode(orderDetails.getShippingPostalCode());
            }
            if (orderDetails.getShippingCountry() != null) {
                order.setShippingCountry(orderDetails.getShippingCountry());
            }
            if (orderDetails.getShippingPhone() != null) {
                order.setShippingPhone(orderDetails.getShippingPhone());
            }
            
            return orderRepository.save(order);
        }).orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    // Update order status
    public Order updateOrderStatus(Long id, Order.OrderStatus status) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(status);
            return orderRepository.save(order);
        }).orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    // Delete order
    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new RuntimeException("Order not found with id: " + id);
        }
        orderRepository.deleteById(id);
    }

    // Get orders by date range
    public List<Order> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.findOrdersByDateRange(startDate, endDate);
    }

    // Get orders by price range
    public List<Order> getOrdersByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        return orderRepository.findOrdersByPriceRange(minPrice, maxPrice);
    }

    // Get recent orders (last 30 days)
    public List<Order> getRecentOrders() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return orderRepository.findRecentOrders(thirtyDaysAgo);
    }

    // Get recent orders with custom days
    public List<Order> getRecentOrders(int days) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
        return orderRepository.findRecentOrders(cutoffDate);
    }

    // Count orders by status
    public Long countOrdersByStatus(Order.OrderStatus status) {
        return orderRepository.countOrdersByStatus(status);
    }

    // Get total revenue
    public BigDecimal getTotalRevenue() {
        BigDecimal revenue = orderRepository.getTotalRevenue();
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    // Get total revenue by date range
    public BigDecimal getTotalRevenueByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        BigDecimal revenue = orderRepository.getTotalRevenueByDateRange(startDate, endDate);
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    // Get orders containing specific product
    public List<Order> getOrdersContainingProduct(Long productId) {
        return orderRepository.findOrdersContainingProduct(productId);
    }

    // Mark order as processing
    public Order markAsProcessing(Long id) {
        return updateOrderStatus(id, Order.OrderStatus.PROCESSING);
    }

    // Mark order as shipped
    public Order markAsShipped(Long id) {
        return updateOrderStatus(id, Order.OrderStatus.SHIPPED);
    }

    // Mark order as delivered
    public Order markAsDelivered(Long id) {
        return updateOrderStatus(id, Order.OrderStatus.DELIVERED);
    }

    // Cancel order
    public Order cancelOrder(Long id) {
        return orderRepository.findById(id).map(order -> {
            // Can only cancel pending or processing orders
            if (order.getStatus() == Order.OrderStatus.SHIPPED || 
                order.getStatus() == Order.OrderStatus.DELIVERED) {
                throw new IllegalStateException("Cannot cancel order that has been shipped or delivered");
            }
            
            order.setStatus(Order.OrderStatus.CANCELLED);
            return orderRepository.save(order);
        }).orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    // Get pending orders
    public List<Order> getPendingOrders() {
        return orderRepository.findByStatus(Order.OrderStatus.PENDING);
    }

    // Get processing orders
    public List<Order> getProcessingOrders() {
        return orderRepository.findByStatus(Order.OrderStatus.PROCESSING);
    }

    // Get shipped orders
    public List<Order> getShippedOrders() {
        return orderRepository.findByStatus(Order.OrderStatus.SHIPPED);
    }

    // Get delivered orders
    public List<Order> getDeliveredOrders() {
        return orderRepository.findByStatus(Order.OrderStatus.DELIVERED);
    }

    // Get cancelled orders
    public List<Order> getCancelledOrders() {
        return orderRepository.findByStatus(Order.OrderStatus.CANCELLED);
    }

    // =============================================
    // ARTISAN-SPECIFIC METHODS
    // =============================================

    /**
     * Get orders containing products from the current artisan
     */
    public List<Order> getOrdersForCurrentArtisan() {
        User currentArtisan = getCurrentUser();
        if (currentArtisan == null || !currentArtisan.getRole().equals(User.UserRole.ARTISAN)) {
            throw new RuntimeException("Only artisans can access their orders");
        }
        
        System.out.println("DEBUG: Current artisan user ID: " + currentArtisan.getId());
        System.out.println("DEBUG: Current artisan email: " + currentArtisan.getEmail());
        System.out.println("DEBUG: Current artisan role: " + currentArtisan.getRole());
        
        List<Order> orders = orderRepository.findOrdersContainingArtisanProducts(currentArtisan.getId());
        System.out.println("DEBUG: Found " + orders.size() + " orders for artisan");
        
        return orders;
    }

    /**
     * Get order details with only the current artisan's items
     */
    public Order getOrderWithArtisanItems(Long orderId) {
        User currentArtisan = getCurrentUser();
        if (currentArtisan == null || !currentArtisan.getRole().equals(User.UserRole.ARTISAN)) {
            throw new RuntimeException("Only artisans can access order details");
        }

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));

        // Filter order items to only include the current artisan's products
        List<OrderItem> artisanItems = order.getOrderItems().stream()
            .filter(item -> item.getProduct().getArtisan().getUser().getId().equals(currentArtisan.getId()))
            .toList();

        if (artisanItems.isEmpty()) {
            throw new RuntimeException("This order does not contain any of your products");
        }

        // Create a new order with only artisan's items for the response
        Order filteredOrder = new Order();
        filteredOrder.setId(order.getId());
        filteredOrder.setCustomer(order.getCustomer());
        filteredOrder.setGuestEmail(order.getGuestEmail());
        filteredOrder.setTotalPrice(order.getTotalPrice());
        filteredOrder.setStatus(order.getStatus());
        filteredOrder.setShippingName(order.getShippingName());
        filteredOrder.setShippingAddressLine1(order.getShippingAddressLine1());
        filteredOrder.setShippingAddressLine2(order.getShippingAddressLine2());
        filteredOrder.setShippingCity(order.getShippingCity());
        filteredOrder.setShippingPostalCode(order.getShippingPostalCode());
        filteredOrder.setShippingCountry(order.getShippingCountry());
        filteredOrder.setShippingPhone(order.getShippingPhone());
        filteredOrder.setCreatedAt(order.getCreatedAt());
        filteredOrder.setUpdatedAt(order.getUpdatedAt());
        filteredOrder.setOrderItems(artisanItems);

        return filteredOrder;
    }

    /**
     * Update status of a specific order item
     * For now, this updates the entire order status (MVP approach)
     * Automatically reduces stock when order is marked as DELIVERED
     */
    public void updateOrderItemStatus(Long itemId, Order.OrderStatus status) {
        // For MVP, we'll update the entire order status when any item status changes
        // In a full implementation, you might want to track individual item statuses
        
        OrderItem item = orderRepository.findOrderItemById(itemId)
            .orElseThrow(() -> new RuntimeException("Order item not found"));
        
        Order order = item.getOrder();
        Order.OrderStatus previousStatus = order.getStatus();
        
        // Update order status
        order.setStatus(status);
        orderRepository.save(order);
        
        // If status changed to DELIVERED, reduce stock for all items in the order
        if (status == Order.OrderStatus.DELIVERED && previousStatus != Order.OrderStatus.DELIVERED) {
            for (OrderItem orderItem : order.getOrderItems()) {
                try {
                    Product product = orderItem.getProduct();
                    int currentStock = product.getStockQuantity();
                    int orderedQuantity = orderItem.getQuantity();
                    int newStock = Math.max(0, currentStock - orderedQuantity); // Ensure stock doesn't go negative
                    
                    // Update product stock
                    productService.updateProductStock(product.getId(), newStock);
                    
                    System.out.println("Stock updated for product '" + product.getName() + 
                        "': " + currentStock + " -> " + newStock + " (reduced by " + orderedQuantity + ")");
                        
                } catch (Exception e) {
                    System.err.println("Failed to update stock for order item " + orderItem.getId() + ": " + e.getMessage());
                    // Log error but don't fail the status update
                }
            }
        }
    }

    /**
     * DEBUG: Get all orders with full details for debugging
     */
    public List<Order> getAllOrdersWithDetails() {
        return orderRepository.findAllOrdersWithDetails();
    }

    // Private helper methods
    private void validateOrder(Order order) {
        if (order.getTotalPrice() == null || order.getTotalPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Order total price must be greater than zero");
        }

        if (order.getShippingName() == null || order.getShippingName().trim().isEmpty()) {
            throw new IllegalArgumentException("Shipping name is required");
        }

        if (order.getShippingAddressLine1() == null || order.getShippingAddressLine1().trim().isEmpty()) {
            throw new IllegalArgumentException("Shipping address is required");
        }

        if (order.getShippingCity() == null || order.getShippingCity().trim().isEmpty()) {
            throw new IllegalArgumentException("Shipping city is required");
        }

        if (order.getShippingPostalCode() == null || order.getShippingPostalCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Shipping postal code is required");
        }

        if (order.getShippingCountry() == null || order.getShippingCountry().trim().isEmpty()) {
            throw new IllegalArgumentException("Shipping country is required");
        }

        // Validate that either customer or guest email is provided
        if (order.getCustomer() == null && (order.getGuestEmail() == null || order.getGuestEmail().trim().isEmpty())) {
            throw new IllegalArgumentException("Either customer or guest email must be provided");
        }

        // Validate that both customer and guest email are not provided
        if (order.getCustomer() != null && order.getGuestEmail() != null && !order.getGuestEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Cannot have both customer and guest email");
        }
    }
} 
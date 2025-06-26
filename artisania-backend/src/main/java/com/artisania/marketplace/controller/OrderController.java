package com.artisania.marketplace.controller;

import com.artisania.marketplace.model.Order;
import com.artisania.marketplace.model.OrderItem;
import com.artisania.marketplace.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // Get all orders - Only ADMIN
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getAllOrders() {
        List<Order> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    // Get order by ID - Owner or ADMIN
    @GetMapping("/{id}")
    @PreAuthorize("@securityService.canViewOrder(#id)")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        Optional<Order> order = orderService.getOrderById(id);
        return order.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

    // Get orders by customer ID - Owner or ADMIN
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("@securityService.canViewCustomerOrders(#customerId)")
    public ResponseEntity<List<Order>> getOrdersByCustomer(@PathVariable Long customerId) {
        List<Order> orders = orderService.getOrdersByCustomerId(customerId);
        return ResponseEntity.ok(orders);
    }

    // Get orders for current authenticated customer
    @GetMapping("/customer/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<Order>> getCurrentCustomerOrders() {
        try {
            List<Order> orders = orderService.getOrdersForCurrentUser();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get orders by status - Only ADMIN
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getOrdersByStatus(@PathVariable String status) {
        List<Order> orders = orderService.getOrdersByStatus(Order.OrderStatus.valueOf(status.toUpperCase()));
        return ResponseEntity.ok(orders);
    }

    // Get orders by guest email - Public access (guests need to access their orders)
    @GetMapping("/guest/{email}")
    public ResponseEntity<List<Order>> getOrdersByGuestEmail(@PathVariable String email) {
        List<Order> orders = orderService.getOrdersByGuestEmail(email);
        return ResponseEntity.ok(orders);
    }

    // Create new order - Authenticated users (CUSTOMER/ARTISAN) or anonymous (guests)
    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        try {
            Order savedOrder;
            
            // Check if user is authenticated
            if (SecurityContextHolder.getContext().getAuthentication() != null && 
                SecurityContextHolder.getContext().getAuthentication().isAuthenticated() &&
                !SecurityContextHolder.getContext().getAuthentication().getName().equals("anonymousUser")) {
                // User is authenticated - create order for current user
                savedOrder = orderService.createOrderForCurrentUser(order);
            } else {
                // Guest order - use the provided order as-is
                savedOrder = orderService.createOrder(order);
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Update order - Only ADMIN
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Order> updateOrder(@PathVariable Long id, @RequestBody Order order) {
        try {
            Order updatedOrder = orderService.updateOrder(id, order);
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Update order status - ARTISAN (for their products) or ADMIN
    @PutMapping("/{id}/status")
    @PreAuthorize("@securityService.canUpdateOrderStatus(#id)")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Order updatedOrder = orderService.updateOrderStatus(id, Order.OrderStatus.valueOf(status.toUpperCase()));
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete order - Only ADMIN
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        try {
            orderService.deleteOrder(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get order items for a specific order - Owner or ADMIN
    @GetMapping("/{orderId}/items")
    @PreAuthorize("@securityService.canViewOrder(#orderId)")
    public ResponseEntity<List<OrderItem>> getOrderItems(@PathVariable Long orderId) {
        Order order = orderService.getOrderById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        return ResponseEntity.ok(order.getOrderItems());
    }

    // Mark order as processing - ARTISAN (for their products) or ADMIN
    @PutMapping("/{id}/processing")
    @PreAuthorize("@securityService.canUpdateOrderStatus(#id)")
    public ResponseEntity<Order> markAsProcessing(@PathVariable Long id) {
        try {
            Order updatedOrder = orderService.markAsProcessing(id);
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Mark order as shipped - ARTISAN (for their products) or ADMIN
    @PutMapping("/{id}/shipped")
    @PreAuthorize("@securityService.canUpdateOrderStatus(#id)")
    public ResponseEntity<Order> markAsShipped(@PathVariable Long id) {
        try {
            Order updatedOrder = orderService.markAsShipped(id);
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Mark order as delivered - ARTISAN (for their products) or ADMIN
    @PutMapping("/{id}/delivered")
    @PreAuthorize("@securityService.canUpdateOrderStatus(#id)")
    public ResponseEntity<Order> markAsDelivered(@PathVariable Long id) {
        try {
            Order updatedOrder = orderService.markAsDelivered(id);
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Cancel order - Owner or ADMIN
    @PutMapping("/{id}/cancel")
    @PreAuthorize("@securityService.canViewOrder(#id)")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id) {
        try {
            Order cancelledOrder = orderService.cancelOrder(id);
            return ResponseEntity.ok(cancelledOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Get pending orders - Only ADMIN
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getPendingOrders() {
        List<Order> orders = orderService.getPendingOrders();
        return ResponseEntity.ok(orders);
    }

    // Get processing orders - Only ADMIN
    @GetMapping("/processing")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getProcessingOrders() {
        List<Order> orders = orderService.getProcessingOrders();
        return ResponseEntity.ok(orders);
    }

    // Get shipped orders - Only ADMIN
    @GetMapping("/shipped")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getShippedOrders() {
        List<Order> orders = orderService.getShippedOrders();
        return ResponseEntity.ok(orders);
    }

    // Get delivered orders - Only ADMIN
    @GetMapping("/delivered")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getDeliveredOrders() {
        List<Order> orders = orderService.getDeliveredOrders();
        return ResponseEntity.ok(orders);
    }

    // Get cancelled orders - Only ADMIN
    @GetMapping("/cancelled")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getCancelledOrders() {
        List<Order> orders = orderService.getCancelledOrders();
        return ResponseEntity.ok(orders);
    }

    // =============================================
    // ARTISAN-SPECIFIC ENDPOINTS
    // =============================================

    /**
     * Get orders containing the current artisan's products
     * Only ARTISAN can access this
     */
    @GetMapping("/artisan")
    @PreAuthorize("hasRole('ARTISAN')")
    public ResponseEntity<List<Order>> getArtisanOrders() {
        try {
            List<Order> orders = orderService.getOrdersForCurrentArtisan();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get order details with only the current artisan's items
     * Only ARTISAN can access this, and only if they have products in this order
     */
    @GetMapping("/{orderId}/artisan")
    @PreAuthorize("hasRole('ARTISAN') and @securityService.artisanHasProductsInOrder(#orderId)")
    public ResponseEntity<Order> getArtisanOrderDetails(@PathVariable Long orderId) {
        try {
            Order order = orderService.getOrderWithArtisanItems(orderId);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Update the status of a specific order item (artisan's product)
     * Only ARTISAN can access this, and only for their own products
     */
    @PutMapping("/{orderId}/items/{itemId}/status")
    @PreAuthorize("hasRole('ARTISAN') and @securityService.artisanOwnsOrderItem(#itemId)")
    public ResponseEntity<?> updateOrderItemStatus(
            @PathVariable Long orderId,
            @PathVariable Long itemId,
            @RequestBody Map<String, String> statusUpdate) {
        try {
            String status = statusUpdate.get("status");
            if (status == null || status.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            
            orderService.updateOrderItemStatus(itemId, Order.OrderStatus.valueOf(status.toUpperCase()));
            return ResponseEntity.ok(Map.of("success", true, "message", "Status updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + statusUpdate.get("status")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // =============================================
    // DEBUG ENDPOINTS (Remove in production)
    // =============================================

    /**
     * DEBUG: Get all orders with details to help troubleshoot
     */
    @GetMapping("/debug/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ARTISAN')")
    public ResponseEntity<?> debugGetAllOrders() {
        try {
            List<Order> orders = orderService.getAllOrdersWithDetails();
            
            // Create a debug response with simplified data
            List<Map<String, Object>> debugData = orders.stream().map(order -> {
                Map<String, Object> orderDebug = Map.of(
                    "orderId", order.getId(),
                    "customerEmail", order.getCustomer() != null ? order.getCustomer().getEmail() : "Guest",
                    "totalPrice", order.getTotalPrice(),
                    "status", order.getStatus(),
                    "itemCount", order.getOrderItems().size(),
                    "items", order.getOrderItems().stream().map(item -> Map.of(
                        "itemId", item.getId(),
                        "productId", item.getProduct().getId(),
                        "productName", item.getProduct().getName(),
                        "artisanUserId", item.getProduct().getArtisan().getUser().getId(),
                        "artisanEmail", item.getProduct().getArtisan().getUser().getEmail(),
                        "quantity", item.getQuantity()
                    )).toList()
                );
                return orderDebug;
            }).toList();
            
            return ResponseEntity.ok(Map.of(
                "totalOrders", orders.size(),
                "orders", debugData
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
} 
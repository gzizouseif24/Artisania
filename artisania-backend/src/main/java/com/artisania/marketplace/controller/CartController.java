package com.artisania.marketplace.controller;

import com.artisania.marketplace.model.CartItem;
import com.artisania.marketplace.service.CartItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    @Autowired
    private CartItemService cartItemService;

    // Add item to cart
    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            Long productId = Long.valueOf(request.get("productId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());

            CartItem cartItem = cartItemService.addToCart(userId, productId, quantity);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Item added to cart successfully");
            response.put("cartItem", cartItem);
            response.put("cartCount", cartItemService.getCartItemCount(userId));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    // Get cart items for a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getCartItems(@PathVariable Long userId) {
        try {
            List<CartItem> cartItems = cartItemService.getCartItems(userId);
            BigDecimal total = cartItemService.calculateCartTotal(userId);
            long itemCount = cartItemService.getCartItemCount(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("cartItems", cartItems);
            response.put("total", total);
            response.put("itemCount", itemCount);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    // Update cart item quantity
    @PutMapping("/update-quantity")
    public ResponseEntity<?> updateQuantity(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            Long productId = Long.valueOf(request.get("productId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());

            CartItem updatedItem = cartItemService.updateQuantityByUserAndProduct(userId, productId, quantity);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Quantity updated successfully");
            response.put("cartItem", updatedItem);
            response.put("cartTotal", cartItemService.calculateCartTotal(userId));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    // Remove item from cart
    @DeleteMapping("/remove")
    public ResponseEntity<?> removeFromCart(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            Long productId = Long.valueOf(request.get("productId").toString());

            cartItemService.removeFromCartByUserAndProduct(userId, productId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Item removed from cart successfully");
            response.put("cartCount", cartItemService.getCartItemCount(userId));
            response.put("cartTotal", cartItemService.calculateCartTotal(userId));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    // Clear entire cart
    @DeleteMapping("/clear/{userId}")
    public ResponseEntity<?> clearCart(@PathVariable Long userId) {
        try {
            cartItemService.clearCart(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Cart cleared successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    // Get cart count for a user
    @GetMapping("/count/{userId}")
    public ResponseEntity<?> getCartCount(@PathVariable Long userId) {
        try {
            long count = cartItemService.getCartItemCount(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", count);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    // Check if product is in cart
    @GetMapping("/check/{userId}/{productId}")
    public ResponseEntity<?> checkProductInCart(@PathVariable Long userId, @PathVariable Long productId) {
        try {
            boolean inCart = cartItemService.isProductInCart(userId, productId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("inCart", inCart);
            
            if (inCart) {
                CartItem cartItem = cartItemService.getCartItem(userId, productId).orElse(null);
                response.put("cartItem", cartItem);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    // Sync cart prices with current product prices
    @PostMapping("/sync-prices/{userId}")
    public ResponseEntity<?> syncCartPrices(@PathVariable Long userId) {
        try {
            List<CartItem> updatedItems = cartItemService.syncAllCartItemPrices(userId);
            BigDecimal newTotal = cartItemService.calculateCartTotal(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Cart prices synchronized successfully");
            response.put("cartItems", updatedItems);
            response.put("total", newTotal);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
} 
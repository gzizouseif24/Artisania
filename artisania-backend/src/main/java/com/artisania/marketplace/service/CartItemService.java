package com.artisania.marketplace.service;

import com.artisania.marketplace.model.CartItem;
import com.artisania.marketplace.model.User;
import com.artisania.marketplace.model.Product;
import com.artisania.marketplace.repository.CartItemRepository;
import com.artisania.marketplace.repository.UserRepository;
import com.artisania.marketplace.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartItemService {

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    // Add item to cart
    public CartItem addToCart(Long userId, Long productId, Integer quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Check if item already exists in cart
        Optional<CartItem> existingItem = cartItemRepository.findByUserIdAndProductId(userId, productId);
        
        if (existingItem.isPresent()) {
            // Update quantity if item already exists
            CartItem cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
            return cartItemRepository.save(cartItem);
        } else {
            // Create new cart item
            CartItem cartItem = new CartItem(user, product, quantity, product.getPrice());
            return cartItemRepository.save(cartItem);
        }
    }

    // Update cart item quantity
    public CartItem updateQuantity(Long cartItemId, Integer quantity) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        
        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }
        
        cartItem.setQuantity(quantity);
        return cartItemRepository.save(cartItem);
    }

    // Update cart item quantity by user and product
    public CartItem updateQuantityByUserAndProduct(Long userId, Long productId, Integer quantity) {
        CartItem cartItem = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        
        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }
        
        cartItem.setQuantity(quantity);
        return cartItemRepository.save(cartItem);
    }

    // Remove item from cart
    public void removeFromCart(Long cartItemId) {
        if (!cartItemRepository.existsById(cartItemId)) {
            throw new RuntimeException("Cart item not found");
        }
        cartItemRepository.deleteById(cartItemId);
    }

    // Remove item from cart by user and product
    public void removeFromCartByUserAndProduct(Long userId, Long productId) {
        CartItem cartItem = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        cartItemRepository.delete(cartItem);
    }

    // Get all cart items for a user
    public List<CartItem> getCartItems(Long userId) {
        return cartItemRepository.findByUserIdWithProductDetails(userId);
    }

    // Get cart item count for a user
    public long getCartItemCount(Long userId) {
        return cartItemRepository.countByUserId(userId);
    }

    // Calculate cart total for a user
    public BigDecimal calculateCartTotal(Long userId) {
        return cartItemRepository.calculateCartTotal(userId);
    }

    // Clear entire cart for a user
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    // Check if product is in cart
    public boolean isProductInCart(Long userId, Long productId) {
        return cartItemRepository.existsByUserIdAndProductId(userId, productId);
    }

    // Get specific cart item
    public Optional<CartItem> getCartItem(Long userId, Long productId) {
        return cartItemRepository.findByUserIdAndProductId(userId, productId);
    }

    // Sync cart item price with current product price
    public CartItem syncCartItemPrice(Long cartItemId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        
        cartItem.setPriceAtTime(cartItem.getProduct().getPrice());
        return cartItemRepository.save(cartItem);
    }

    // Sync all cart item prices for a user
    public List<CartItem> syncAllCartItemPrices(Long userId) {
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        
        for (CartItem cartItem : cartItems) {
            cartItem.setPriceAtTime(cartItem.getProduct().getPrice());
        }
        
        return cartItemRepository.saveAll(cartItems);
    }
} 
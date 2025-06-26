import React, { useState } from 'react';
import './ShoppingCart.css';
import ImageWithFallback from '../common/ImageWithFallback';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../stores/AuthContext';
import OrderTracking from './OrderTracking';

interface ShoppingCartProps {
  onBackToHome?: () => void;
  onCheckoutClick?: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ 
  onBackToHome,
  onCheckoutClick
}) => {
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  
  try {
    const cartContext = useCart();
    const { isAuthenticated, user, loading } = useAuth();
    
    // Debug logging
    console.log('ShoppingCart - Authentication Debug:', {
      isAuthenticated,
      user,
      userRole: user?.role,
      loading,
      shouldShowButton: !loading && isAuthenticated && user?.role === 'CUSTOMER'
    });
    
    // Check if cart context is available
    if (!cartContext) {
      console.error('Cart context is not available');
      return (
        <div className="shopping-cart">
          <div className="cart-container">
            <div className="cart-header">
              <h1 className="cart-title">Your Cart</h1>
            </div>
            <div className="empty-cart">
              <p>Unable to load cart. Please try again.</p>
              <button className="continue-shopping-btn" onClick={onBackToHome}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      );
    }

    const { state: cartState, updateQuantity, removeFromCart } = cartContext;

    // Error handling for cart state
    if (!cartState) {
      console.error('Cart state is undefined');
      return (
        <div className="shopping-cart">
          <div className="cart-container">
            <div className="cart-header">
              <h1 className="cart-title">Your Cart</h1>
            </div>
            <div className="empty-cart">
              <p>Unable to load cart. Please try again.</p>
              <button className="continue-shopping-btn" onClick={onBackToHome}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Ensure items is an array
    const cartItems = Array.isArray(cartState.items) ? cartState.items : [];

    // Calculate totals
    const subtotal = cartState.total || 0;
    const shipping = 0; // Free shipping or calculated at checkout
    const total = subtotal + shipping;

    const handleQuantityChange = async (productId: number, change: number) => {
      const item = cartItems.find(item => item.product?.id === productId);
      if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity > 0) {
          await updateQuantity(productId, newQuantity);
        }
      }
    };

    const handleRemoveItem = async (productId: number) => {
      await removeFromCart(productId);
    };

    const handleProceedToCheckout = () => {
      if (onCheckoutClick) {
        onCheckoutClick();
      } else {
        console.log('Proceed to checkout');
      }
    };

    const handleTrackOrdersClick = () => {
      setIsOrderTrackingOpen(true);
    };

    const handleCloseOrderTracking = () => {
      setIsOrderTrackingOpen(false);
    };

    // Show empty cart message if no items
    if (cartItems.length === 0) {
      return (
        <div className="shopping-cart">
          <div className="cart-container">
            <div className="cart-header">
              <h1 className="cart-title">Your Cart</h1>
              {!loading && isAuthenticated && user?.role === 'CUSTOMER' && (
                <button 
                  className="track-orders-btn"
                  onClick={handleTrackOrdersClick}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M240,136a8,8,0,0,1-8,8H204v20a12,12,0,0,1-12,12H64a12,12,0,0,1-12-12V164H32a8,8,0,0,1,0-16H52V128a12,12,0,0,1,12-12H192a12,12,0,0,1,12,12v20h28A8,8,0,0,1,240,136ZM68,148v12H188V148Zm120-20H68v12H188Z"></path>
                  </svg>
                  Track My Orders
                </button>
              )}
            </div>
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <button className="continue-shopping-btn" onClick={onBackToHome}>
                Continue Shopping
              </button>
            </div>
          </div>
          
          {/* Order Tracking Modal */}
          <OrderTracking 
            isOpen={isOrderTrackingOpen}
            onClose={handleCloseOrderTracking}
          />
        </div>
      );
    }

    return (
      <div className="shopping-cart">
        <div className="cart-container">
          {/* Cart Header */}
          <div className="cart-header">
            <h1 className="cart-title">Your Cart</h1>
            {/* Show Track Orders button for authenticated customers */}
            {!loading && isAuthenticated && user?.role === 'CUSTOMER' && (
              <button 
                className="track-orders-btn"
                onClick={handleTrackOrdersClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M240,136a8,8,0,0,1-8,8H204v20a12,12,0,0,1-12,12H64a12,12,0,0,1-12-12V164H32a8,8,0,0,1,0-16H52V128a12,12,0,0,1,12-12H192a12,12,0,0,1,12,12v20h28A8,8,0,0,1,240,136ZM68,148v12H188V148Zm120-20H68v12H188Z"></path>
                </svg>
                Track My Orders
              </button>
            )}
          </div>

          {/* Cart Table */}
          <div className="cart-table-container">
            <table className="cart-table">
              <thead>
                <tr>
                  <th className="table-header product-col">Product</th>
                  <th className="table-header artisan-col">Artisan</th>
                  <th className="table-header price-col">Price</th>
                  <th className="table-header quantity-col">Quantity</th>
                  <th className="table-header subtotal-col">Subtotal</th>
                  <th className="table-header remove-col"></th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} className="cart-row">
                    <td className="table-cell product-cell">
                      <div className="product-image-container">
                        <ImageWithFallback
                          src={item.product?.images?.main || ''}
                          alt={item.product?.images?.alt?.main || `${item.product?.name || 'Product'} by artisan`}
                          className="product-image"
                          aspectRatio="1:1"
                        />
                      </div>
                      <span className="product-name">{item.product?.name || 'Unknown Product'}</span>
                    </td>
                    <td className="table-cell artisan-cell">
                      {item.product?.artisan || 'Handcrafted by Artisan'}
                    </td>
                    <td className="table-cell price-cell">
                      ${(item.priceAtTime || 0).toFixed(2)}
                    </td>
                    <td className="table-cell quantity-cell">
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.product?.id || 0, -1)}
                        >
                          -
                        </button>
                        <span className="quantity-value">{item.quantity || 0}</span>
                        <button 
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.product?.id || 0, 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="table-cell subtotal-cell">
                      ${((item.priceAtTime || 0) * (item.quantity || 0)).toFixed(2)}
                    </td>
                    <td className="table-cell remove-cell">
                      <button 
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item.product?.id || 0)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          <div className="cart-summary">
            <h3 className="summary-title">Summary</h3>
            <div className="summary-content">
              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Shipping</span>
                <span className="summary-value">Calculated at checkout</span>
              </div>
              <div className="summary-row total-row">
                <span className="summary-label">Total</span>
                <span className="summary-value">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="checkout-section">
            <button 
              className="checkout-btn"
              onClick={handleProceedToCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
        
        {/* Order Tracking Modal */}
        <OrderTracking 
          isOpen={isOrderTrackingOpen}
          onClose={handleCloseOrderTracking}
        />
      </div>
    );
  } catch (error) {
    console.error('Error in ShoppingCart component:', error);
    return (
      <div className="shopping-cart">
        <div className="cart-container">
          <div className="cart-header">
            <h1 className="cart-title">Your Cart</h1>
          </div>
          <div className="empty-cart">
            <p>Unable to load cart. Please try again.</p>
            <button className="continue-shopping-btn" onClick={onBackToHome}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default ShoppingCart; 
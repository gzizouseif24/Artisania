import React, { useState } from 'react';
import './Checkout.css';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../stores/AuthContext';
import orderService from '../../services/orderService';
import type { FrontendCartItem } from '../../utils/apiTransformers';

interface CheckoutProps {
  onBackToCart?: () => void;
  onPlaceOrder?: (orderData: any) => void;
}

interface ShippingInfo {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

const Checkout: React.FC<CheckoutProps> = ({ 
  onBackToCart, 
  onPlaceOrder 
}) => {
  try {
    const cartContext = useCart();
    const { user } = useAuth();
    
    // Check if cart context is available
    if (!cartContext) {
      console.error('Cart context is not available');
      return (
        <div className="checkout-container">
          <div className="checkout-content">
            <div className="checkout-form-section">
              <div className="checkout-header">
                <h1 className="checkout-title">Checkout</h1>
              </div>
              <p>Unable to load cart data. Please try again.</p>
              <button className="place-order-btn" onClick={onBackToCart}>
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      );
    }

    const { state: cartState, clearCart } = cartContext;

    // Error handling for cart state
    if (!cartState) {
      console.error('Cart state is undefined');
      return (
        <div className="checkout-container">
          <div className="checkout-content">
            <div className="checkout-form-section">
              <div className="checkout-header">
                <h1 className="checkout-title">Checkout</h1>
              </div>
              <p>Unable to load cart data. Please try again.</p>
              <button className="place-order-btn" onClick={onBackToCart}>
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Ensure items is an array
    const cartItems = Array.isArray(cartState.items) ? cartState.items : [];

    // Check if cart is empty
    if (cartItems.length === 0) {
      return (
        <div className="checkout-container">
          <div className="checkout-content">
            <div className="checkout-form-section">
              <div className="checkout-header">
                <h1 className="checkout-title">Checkout</h1>
              </div>
              <p>Your cart is empty. Please add items to your cart before checkout.</p>
              <button className="place-order-btn" onClick={onBackToCart}>
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      );
    }

    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      country: '',
      phone: '',
      email: ''
    });

    const [sameAsShipping, setSameAsShipping] = useState(true);
    const [paymentMethod] = useState('cash-on-delivery'); // Only one option
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const shippingCost = 10.00;
    const subtotal = cartState.total;
    const total = subtotal + shippingCost;

    const handleInputChange = (field: keyof ShippingInfo, value: string) => {
      setShippingInfo(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handlePlaceOrder = async () => {
      // Basic validation - addressLine2 is optional
      const requiredFields: (keyof ShippingInfo)[] = ['fullName', 'addressLine1', 'city', 'postalCode', 'country', 'phone'];
      
      // For guest users, email is also required
      if (!user) {
        requiredFields.push('email');
      }
      
      const missingFields = requiredFields.filter(field => !shippingInfo[field].trim());
      
      if (missingFields.length > 0) {
        alert('Please fill in all required fields');
        return;
      }

      setIsPlacingOrder(true);

      try {
        // Prepare shipping information for the order service
        const orderShippingInfo = {
          fullName: shippingInfo.fullName,
          addressLine1: shippingInfo.addressLine1,
          addressLine2: shippingInfo.addressLine2,
          city: shippingInfo.city,
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country,
          phone: shippingInfo.phone,
          email: user ? undefined : shippingInfo.email // Only include email for guest orders
        };

        // Create the order using the order service
        const response = await orderService.createOrderFromCart(
          cartItems as FrontendCartItem[],
          orderShippingInfo,
          total
        );

        if (response.success && response.order) {
          // Clear cart after successful order
          await clearCart();

          // Create order data for backward compatibility with onPlaceOrder callback
          const orderData = {
            id: response.orderId,
            total,
            subtotal,
            shippingCost,
            shippingInfo,
            cartItems,
            paymentMethod,
            ...(user ? { customerId: user.id } : { guestEmail: shippingInfo.email }),
            status: 'pending'
          };

          if (onPlaceOrder) {
            onPlaceOrder(orderData);
          } else {
            alert(`Order #${response.orderId} placed successfully! Total: $${total.toFixed(2)}`);
            // Navigate to home or order confirmation page
            if (onBackToCart) {
              onBackToCart(); // This will navigate back, App.tsx will handle navigation to home
            }
          }
        } else {
          console.error('Order creation failed:', response.error);
          alert(`Failed to place order: ${response.error || 'Unknown error occurred'}`);
        }
      } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
      } finally {
        setIsPlacingOrder(false);
      }
    };

    return (
      <div className="checkout-container">
        <div className="checkout-content">
          {/* Left Column - Checkout Form */}
          <div className="checkout-form-section">
            <div className="checkout-header">
              <h1 className="checkout-title">Checkout</h1>
            </div>

            {/* Shipping Information */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Full Name</span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="form-input"
                  value={shippingInfo.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Address Line 1</span>
                <input
                  type="text"
                  placeholder="Enter your address line 1"
                  className="form-input"
                  value={shippingInfo.addressLine1}
                  onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                />
              </label>
            </div>

            <div className="form-group optional">
              <label className="form-label">
                <span className="label-text">Address Line 2</span>
                <input
                  type="text"
                  placeholder="Enter your address line 2"
                  className="form-input"
                  value={shippingInfo.addressLine2}
                  onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">City</span>
                <input
                  type="text"
                  placeholder="Enter your city"
                  className="form-input"
                  value={shippingInfo.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Postal Code</span>
                <input
                  type="text"
                  placeholder="Enter your postal code"
                  className="form-input"
                  value={shippingInfo.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Country</span>
                <input
                  type="text"
                  placeholder="Enter your country"
                  className="form-input"
                  value={shippingInfo.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Phone Number</span>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  className="form-input"
                  value={shippingInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Email</span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="form-input"
                  value={shippingInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </label>
            </div>

            {/* Billing Address */}
            <h3 className="section-title">Billing Address</h3>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                />
                <span className="checkbox-text">Same as shipping address</span>
              </label>
            </div>

            {/* Place Order Button */}
            <div className="place-order-section">
              <button 
                className="place-order-btn" 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="order-summary-section">
            <h3 className="section-title">Order Summary</h3>
            
            {/* Cart Items */}
            <div className="order-items">
              {cartItems.map((item) => (
                <div key={item.id} className="order-item">
                  <div 
                    className="order-item-image"
                    style={{ 
                      backgroundImage: `url(${item.product?.images?.main || ''})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <div className="order-item-details">
                    <h4 className="order-item-name">{item.product?.name || 'Unknown Product'}</h4>
                    <p className="order-item-artisan">{item.product?.artisan ? `By ${item.product.artisan}` : 'By Artisan'}</p>
                    <div className="order-item-quantity-price">
                      <span className="quantity">Qty: {item.quantity || 0}</span>
                      <span className="price">${(item.priceAtTime || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="price-breakdown">
              <div className="price-row">
                <span className="price-label">Subtotal</span>
                <span className="price-value">${subtotal.toFixed(2)}</span>
              </div>
              <div className="price-row">
                <span className="price-label">Shipping</span>
                <span className="price-value">${shippingCost.toFixed(2)}</span>
              </div>
              <div className="price-row total-row">
                <span className="price-label">Total</span>
                <span className="price-value">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <h3 className="section-title">Payment Method</h3>
            <div className="payment-methods">
              <label className="payment-option">
                <input
                  type="radio"
                  className="radio-input"
                  name="payment"
                  value="cash-on-delivery"
                  checked={paymentMethod === 'cash-on-delivery'}
                  readOnly
                />
                <div className="payment-label">
                  <p className="payment-text">Cash on Delivery</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in Checkout component:', error);
    return (
      <div className="checkout-container">
        <div className="checkout-content">
          <div className="checkout-form-section">
            <div className="checkout-header">
              <h1 className="checkout-title">Checkout</h1>
            </div>
            <p>An error occurred. Please try again later.</p>
            <button className="place-order-btn" onClick={onBackToCart}>
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default Checkout; 
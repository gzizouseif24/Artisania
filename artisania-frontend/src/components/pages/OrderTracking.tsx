import React, { useState, useEffect } from 'react';
import { orderService } from '../../services';
import type { FrontendOrder } from '../../services/orderService';
import ImageWithFallback from '../common/ImageWithFallback';
import './OrderTracking.css';

interface OrderTrackingProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<FrontendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUserOrders();
    }
  }, [isOpen]);

  const loadUserOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await orderService.getUserOrders();
      
      if (result.success && result.orders) {
        // Sort orders by creation date (newest first)
        const sortedOrders = result.orders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
      } else {
        setError(result.error || 'Failed to load orders');
      }
    } catch (err: any) {
      console.error('Failed to load user orders:', err);
      setError(err.message || 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'PROCESSING': return 'status-processing';
      case 'SHIPPED': return 'status-shipped';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Order Pending';
      case 'PROCESSING': return 'Being Prepared';
      case 'SHIPPED': return 'Shipped';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Your order has been received and is being reviewed';
      case 'PROCESSING': return 'Artisans are preparing your items';
      case 'SHIPPED': return 'Your order is on its way to you';
      case 'DELIVERED': return 'Your order has been delivered';
      case 'CANCELLED': return 'This order has been cancelled';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleOrderDetails = (orderId: number) => {
    setSelectedOrderId(selectedOrderId === orderId ? null : orderId);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="order-tracking-overlay" onClick={handleOverlayClick}>
      <div className="order-tracking-modal">
        <div className="order-tracking-header">
          <h2>My Orders</h2>
          <button className="close-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
            </svg>
          </button>
        </div>

        <div className="order-tracking-content">
          {loading ? (
            <div className="order-tracking-loading">
              <div className="loading-spinner"></div>
              <p>Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="order-tracking-error">
              <h3>Unable to Load Orders</h3>
              <p>{error}</p>
              <button onClick={loadUserOrders} className="retry-button">
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="order-tracking-empty">
              <div className="empty-state">
                <h3>No Orders Yet</h3>
                <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
                <button onClick={onClose} className="continue-shopping-button">
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  {/* Order Header */}
                  <div className="order-header" onClick={() => toggleOrderDetails(order.id)}>
                    <div className="order-info">
                      <div className="order-id-date">
                        <span className="order-id">Order #{order.id}</span>
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="order-status-total">
                        <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        <span className="order-total">${order.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="expand-icon">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="20" 
                        height="20" 
                        fill="currentColor" 
                        viewBox="0 0 256 256"
                        className={selectedOrderId === order.id ? 'rotated' : ''}
                      >
                        <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                      </svg>
                    </div>
                  </div>

                  {/* Status Description */}
                  <div className="order-status-description">
                    <p>{getStatusDescription(order.status)}</p>
                  </div>

                  {/* Order Details (Expandable) */}
                  {selectedOrderId === order.id && (
                    <div className="order-details">
                      {/* Shipping Information */}
                      <div className="shipping-info">
                        <h4>Shipping Information</h4>
                        <div className="shipping-details">
                          <p><strong>Name:</strong> {order.shippingInfo.name}</p>
                          <p><strong>Address:</strong></p>
                          <div className="address">
                            <p>{order.shippingInfo.addressLine1}</p>
                            {order.shippingInfo.addressLine2 && <p>{order.shippingInfo.addressLine2}</p>}
                            <p>{order.shippingInfo.city}, {order.shippingInfo.postalCode}</p>
                            <p>{order.shippingInfo.country}</p>
                          </div>
                          {order.shippingInfo.phone && (
                            <p><strong>Phone:</strong> {order.shippingInfo.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="order-items">
                        <h4>Items Ordered</h4>
                        <div className="items-list">
                          {order.orderItems.map(item => (
                            <div key={item.id} className="order-item">
                              <div className="item-image">
                                <ImageWithFallback
                                  src={item.product.images.thumbnail}
                                  alt={item.product.images.alt.main}
                                  className="product-thumbnail"
                                />
                              </div>
                              <div className="item-details">
                                <h5 className="item-name">{item.product.name}</h5>
                                <p className="item-artisan">by {item.product.artisan}</p>
                                <p className="item-category">{item.product.category}</p>
                              </div>
                              <div className="item-quantity-price">
                                <span className="item-quantity">Qty: {item.quantity}</span>
                                <span className="item-price">${item.priceAtPurchase.toFixed(2)} each</span>
                                <span className="item-total">${item.totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="order-summary">
                        <div className="summary-row">
                          <span>Subtotal:</span>
                          <span>${order.totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                          <span>Shipping:</span>
                          <span>Calculated at checkout</span>
                        </div>
                        <div className="summary-row total-row">
                          <span>Total:</span>
                          <span>${order.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="order-tracking-footer">
          <button className="close-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking; 
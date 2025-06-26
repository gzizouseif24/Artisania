import React, { useState, useEffect } from 'react';
import { orderService } from '../../services';
import type { FrontendOrder, FrontendOrderItem } from '../../services/orderService';
import ImageWithFallback from '../common/ImageWithFallback';
import './OrderDetails.css';

interface OrderDetailsProps {
  orderId: number;
  onClose: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<FrontendOrder | null>(null);
  const [artisanItems, setArtisanItems] = useState<FrontendOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await orderService.getArtisanOrderDetails(orderId);
      
      if (result.success && result.order && result.artisanItems) {
        setOrder(result.order);
        setArtisanItems(result.artisanItems);
      } else {
        setError(result.error || 'Failed to load order details');
      }
    } catch (err: any) {
      console.error('Failed to load order details:', err);
      setError(err.message || 'Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (itemId: number, newStatus: string) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [itemId]: true }));
      
      const result = await orderService.updateOrderItemStatus(
        orderId, 
        itemId, 
        newStatus as 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
      );
      
      if (result.success) {
        // Refresh order details to get updated status
        await loadOrderDetails();
      } else {
        alert(`Failed to update status: ${result.error}`);
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const getStatusOptions = () => {
    return [
      { value: 'PENDING', label: 'Pending' },
      { value: 'PROCESSING', label: 'Processing' },
      { value: 'SHIPPED', label: 'Shipped' },
      { value: 'DELIVERED', label: 'Delivered' },
      { value: 'CANCELLED', label: 'Cancelled' }
    ];
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="order-details-overlay" onClick={handleOverlayClick}>
        <div className="order-details-modal">
          <div className="order-details-loading">
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-overlay" onClick={handleOverlayClick}>
        <div className="order-details-modal">
          <div className="order-details-error">
            <h3>Error Loading Order</h3>
            <p>{error || 'Order not found'}</p>
            <div className="error-actions">
              <button onClick={loadOrderDetails} className="retry-button">
                Try Again
              </button>
              <button onClick={onClose} className="close-button">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-overlay" onClick={handleOverlayClick}>
      <div className="order-details-modal">
        <div className="order-details-header">
          <h2>Order #{order.id}</h2>
          <button className="close-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
            </svg>
          </button>
        </div>

        <div className="order-details-content">
          {/* Order Information */}
          <div className="order-info-section">
            <h3>Order Information</h3>
            <div className="order-info-grid">
              <div className="order-info-item">
                <span className="label">Order Date:</span>
                <span className="value">{formatDate(order.createdAt)}</span>
              </div>
              <div className="order-info-item">
                <span className="label">Order Status:</span>
                <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                  {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="order-info-item">
                <span className="label">Total Amount:</span>
                <span className="value">${order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="customer-info-section">
            <h3>Customer Information</h3>
            <div className="customer-info-grid">
              <div className="customer-info-item">
                <span className="label">Name:</span>
                <span className="value">{order.shippingInfo.name}</span>
              </div>
              <div className="customer-info-item">
                <span className="label">Phone:</span>
                <span className="value">{order.shippingInfo.phone || 'Not provided'}</span>
              </div>
              <div className="customer-info-item full-width">
                <span className="label">Shipping Address:</span>
                <div className="address-value">
                  <div>{order.shippingInfo.addressLine1}</div>
                  {order.shippingInfo.addressLine2 && <div>{order.shippingInfo.addressLine2}</div>}
                  <div>{order.shippingInfo.city}, {order.shippingInfo.postalCode}</div>
                  <div>{order.shippingInfo.country}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Your Products */}
          <div className="order-items-section">
            <h3>Your Products in this Order</h3>
            <div className="order-items-list">
              {artisanItems.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-image">
                    <ImageWithFallback
                      src={item.product.images.thumbnail}
                      alt={item.product.images.alt.main}
                      className="product-thumbnail"
                    />
                  </div>
                  
                  <div className="item-details">
                    <h4 className="item-name">{item.product.name}</h4>
                    <p className="item-category">{item.product.category}</p>
                    <div className="item-price-qty">
                      <span>Qty: {item.quantity}</span>
                      <span>Price: ${item.priceAtPurchase.toFixed(2)} each</span>
                      <span className="item-total">Total: ${item.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="item-status-controls">
                    <label htmlFor={`status-${item.id}`} className="status-label">
                      Update Status:
                    </label>
                    <select 
                      id={`status-${item.id}`}
                      className="status-select"
                      value={order.status} // For MVP, we use order status for simplicity
                      onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                      disabled={updatingStatus[item.id]}
                    >
                      {getStatusOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {updatingStatus[item.id] && (
                      <span className="updating-indicator">Updating...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-details-footer">
          <button className="close-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 
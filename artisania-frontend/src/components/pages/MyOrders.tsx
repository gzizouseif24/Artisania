import React, { useState, useEffect } from 'react';
import { orderService } from '../../services';
import type { FrontendOrder } from '../../services/orderService';
import OrderDetails from './OrderDetails';
import './MyOrders.css';

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<FrontendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await orderService.getArtisanOrders();
      
      if (result.success && result.orders) {
        setOrders(result.orders);
      } else {
        setError(result.error || 'Failed to load orders');
      }
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
  };

  const handleCloseDetails = () => {
    setSelectedOrderId(null);
    // Refresh orders after closing details (in case status was updated)
    loadOrders();
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getProductsPreview = (order: FrontendOrder) => {
    const productNames = order.orderItems.map(item => item.product.name);
    if (productNames.length === 1) {
      return productNames[0];
    } else if (productNames.length === 2) {
      return `${productNames[0]} & ${productNames[1]}`;
    } else {
      return `${productNames[0]} & ${productNames.length - 1} more`;
    }
  };

  if (loading) {
    return (
      <div className="my-orders-container">
        <div className="my-orders-loading">
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-orders-container">
        <div className="my-orders-error">
          <h3>Error Loading Orders</h3>
          <p>{error}</p>
          <button onClick={loadOrders} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders-container">
      <div className="my-orders-header">
        <p className="my-orders-subtitle">
          Manage orders containing your products. You have {orders.length} order{orders.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="my-orders-empty">
          <div className="empty-state">
            <h3>No Orders Yet</h3>
            <p>You don't have any orders containing your products yet.</p>
          </div>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="order-row">
                  <td className="order-id">#{order.id}</td>
                  <td className="order-date">{formatDate(order.createdAt)}</td>
                  <td className="order-status">
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="order-total">${order.totalPrice.toFixed(2)}</td>
                  <td className="order-products">{getProductsPreview(order)}</td>
                  <td className="order-actions">
                    <button 
                      className="view-details-button"
                      onClick={() => handleViewDetails(order.id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetails 
          orderId={selectedOrderId}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default MyOrders; 
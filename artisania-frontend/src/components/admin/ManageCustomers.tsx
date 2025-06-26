import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminTabs.css';

// Types
interface Customer {
  id: number;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  orderCount?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderItems: Array<{
    id: number;
    quantity: number;
    priceAtPurchase: number;
    product: {
      id: number;
      name: string;
    };
  }>;
}

interface OrdersModal {
  isOpen: boolean;
  customer: Customer | null;
  orders: Order[];
  loading: boolean;
}

const ManageCustomers: React.FC = () => {
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordersModal, setOrdersModal] = useState<OrdersModal>({
    isOpen: false,
    customer: null,
    orders: [],
    loading: false
  });

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getAllCustomers();
      
      if (response.success) {
        setCustomers(response.customers);
      } else {
        setError(response.error || 'Failed to fetch customers');
        setCustomers([]);
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to fetch customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer orders
  const fetchCustomerOrders = async (customer: Customer) => {
    try {
      setOrdersModal(prev => ({ ...prev, loading: true }));
      
      const response = await adminService.getCustomerOrders(customer.id);
      
      if (response.success) {
        setOrdersModal(prev => ({ 
          ...prev, 
          orders: response.orders,
          loading: false 
        }));
      } else {
        setError(response.error || 'Failed to fetch customer orders');
        setOrdersModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err: any) {
      console.error('Error fetching customer orders:', err);
      setError(err.message || 'Failed to fetch customer orders');
      setOrdersModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle view orders
  const handleViewOrders = async (customer: Customer) => {
    setOrdersModal({
      isOpen: true,
      customer,
      orders: [],
      loading: true
    });
    
    await fetchCustomerOrders(customer);
  };

  // Close orders modal
  const closeOrdersModal = () => {
    setOrdersModal({
      isOpen: false,
      customer: null,
      orders: [],
      loading: false
    });
  };

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="admin-tab-container">
        <div className="admin-loading">
          <div className="admin-loading-spinner"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-tab-container">
      {/* Header */}
      <div className="admin-tab-header">
        <div className="admin-tab-title">
          <h3>Customer Management</h3>
          <p>View customers and their order history</p>
        </div>
        
        <button
          onClick={fetchCustomers}
          className="admin-btn admin-btn--secondary"
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="admin-error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="admin-error-close">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">{customers.length}</span>
            <span className="admin-stat-label">Total Customers</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">✅</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">
              {customers.filter(c => c.isActive).length}
            </span>
            <span className="admin-stat-label">Active</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">🛒</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">
              {customers.reduce((sum, c) => sum + (c.orderCount || 0), 0)}
            </span>
            <span className="admin-stat-label">Total Orders</span>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="admin-table-container">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Status</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="admin-table-row">
                    <td>
                      <div className="admin-customer-info">
                        <span className="admin-customer-email">{customer.email}</span>
                        <span className="admin-customer-id">ID: {customer.id}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${customer.isActive ? 'admin-status-active' : 'admin-status-inactive'}`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className="admin-order-count">
                        {customer.orderCount || 0} orders
                      </span>
                    </td>
                    <td>
                      <span className="admin-total-spent">
                        {customer.totalSpent ? formatPrice(customer.totalSpent) : '$0.00'}
                      </span>
                    </td>
                    <td>
                      <span className="admin-last-order">
                        {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Never'}
                      </span>
                    </td>
                    <td>
                      <span className="admin-date">
                        {customer.createdAt ? formatDate(customer.createdAt) : 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          onClick={() => handleViewOrders(customer)}
                          className="admin-btn admin-btn--sm admin-btn--primary"
                          title="View customer orders"
                        >
                          📋 View Orders
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Modal */}
      {ordersModal.isOpen && ordersModal.customer && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal--large">
            <div className="admin-modal-header">
              <h3>🛒 Orders for {ordersModal.customer.email}</h3>
              <button
                onClick={closeOrdersModal}
                className="admin-modal-close"
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              {ordersModal.loading ? (
                <div className="admin-loading">
                  <div className="admin-loading-spinner"></div>
                  <p>Loading orders...</p>
                </div>
              ) : ordersModal.orders.length === 0 ? (
                <div className="admin-empty-state">
                  <p>This customer has no orders yet.</p>
                </div>
              ) : (
                <div className="admin-orders-list">
                  {ordersModal.orders.map((order) => (
                    <div key={order.id} className="admin-order-card">
                      <div className="admin-order-header">
                        <div className="admin-order-info">
                          <span className="admin-order-id">Order #{order.id}</span>
                          <span className="admin-order-date">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="admin-order-meta">
                          <span className={`admin-order-status admin-order-status--${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                          <span className="admin-order-total">{formatPrice(order.totalAmount)}</span>
                        </div>
                      </div>
                      <div className="admin-order-items">
                        <h4>Order Items:</h4>
                        <ul>
                          {order.orderItems.map((item) => (
                            <li key={item.id} className="admin-order-item">
                              <span className="admin-item-name">{item.product.name}</span>
                              <span className="admin-item-details">
                                Qty: {item.quantity} × {formatPrice(item.priceAtPurchase)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                onClick={closeOrdersModal}
                className="admin-btn admin-btn--secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCustomers; 
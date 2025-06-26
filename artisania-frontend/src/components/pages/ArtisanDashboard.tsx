import React, { useState } from 'react';
import { useAuth } from '../../stores/AuthContext';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import ArtisanProfile from './ArtisanProfile';
import AddProduct from './AddProduct';
import MyProducts from './MyProducts';
import MyOrders from './MyOrders';
import './ArtisanDashboard.css';

type DashboardTab = 'products' | 'add-product' | 'profile' | 'orders';

interface ArtisanDashboardProps {
  onNavigateToHome?: () => void;
  onNavigateToLogin?: () => void;
}

const ArtisanDashboard: React.FC<ArtisanDashboardProps> = ({
  onNavigateToHome,
  onNavigateToLogin,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('products');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return <MyProducts />;
      case 'add-product':
        return (
          <AddProduct 
            onSuccess={() => {
              // Switch to products tab after successful creation
              setActiveTab('products');
              // Could also show a success message here
            }}
            onCancel={() => {
              // Switch back to products tab on cancel
              setActiveTab('products');
            }}
          />
        );
      case 'profile':
        return <ArtisanProfile />;
      case 'orders':
        return <MyOrders />;
      default:
        return <MyProducts />;
    }
  };

  return (
    <div className="artisan-dashboard-page">
      <Header 
        onLogoClick={onNavigateToHome}
        onLoginRegisterClick={onNavigateToLogin}
        // Don't pass onCartClick for artisans - they shouldn't access cart
        cartItemCount={0}
        cartTotal={0}
      />
      
      <div className="dashboard-main">
        <div className="dashboard-layout-container">
          <div className="dashboard-content-wrapper">
            <div className="dashboard-content-container">
              {/* Welcome Header */}
              <div className="dashboard-header">
                <p className="dashboard-welcome-title">
                  Welcome, {user?.email?.split('@')[0] || 'Artisan'}
                </p>
              </div>
              
              {/* Navigation Tabs */}
              <div className="dashboard-tabs-container">
                <button
                  className={`dashboard-tab ${activeTab === 'products' ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
                  onClick={() => setActiveTab('products')}
                >
                  <p className="dashboard-tab-text">My Products</p>
                </button>
                <button
                  className={`dashboard-tab ${activeTab === 'add-product' ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
                  onClick={() => setActiveTab('add-product')}
                >
                  <p className="dashboard-tab-text">Add New Product</p>
                </button>
                <button
                  className={`dashboard-tab ${activeTab === 'profile' ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <p className="dashboard-tab-text">My Profile</p>
                </button>
                <button
                  className={`dashboard-tab ${activeTab === 'orders' ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
                  onClick={() => setActiveTab('orders')}
                >
                  <p className="dashboard-tab-text">My Orders</p>
                </button>
              </div>
              
              {/* Tab Content */}
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ArtisanDashboard; 
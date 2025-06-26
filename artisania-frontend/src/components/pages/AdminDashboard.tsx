import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/AuthContext';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import ManageSite from '../admin/ManageSite';
import ManageArtisans from '../admin/ManageArtisans';
import ManageCustomers from '../admin/ManageCustomers';
import ManageCategories from '../admin/ManageCategories';
import './ArtisanDashboard.css'; // Reusing the same simple styles

type AdminDashboardTab = 'manage-site' | 'manage-artisans' | 'manage-customers' | 'manage-categories';

interface AdminDashboardProps {
  onNavigateToHome?: () => void;
  onNavigateToLogin?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToHome,
  onNavigateToLogin
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>('manage-site');

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      console.log('Admin Dashboard: Unauthorized access attempt');
      onNavigateToLogin?.();
    }
  }, [isAuthenticated, user, onNavigateToLogin]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'manage-site':
        return <ManageSite />;
      case 'manage-artisans':
        return <ManageArtisans />;
      case 'manage-customers':
        return <ManageCustomers />;
      case 'manage-categories':
        return <ManageCategories />;
      default:
        return <ManageSite />;
    }
  };

  return (
    <div className="artisan-dashboard-page">
      <Header 
        onLogoClick={onNavigateToHome}
        onLoginRegisterClick={onNavigateToLogin}
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
                  Admin Dashboard - Welcome, {user?.email?.split('@')[0] || 'Administrator'}
                </p>
              </div>
              
              {/* Navigation Tabs */}
              <div className="dashboard-tabs-container">
                <button
                  className={`dashboard-tab ${activeTab === 'manage-site' ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
                  onClick={() => setActiveTab('manage-site')}
                >
                  <p className="dashboard-tab-text">Manage Site</p>
                </button>
                <button
                  className={`dashboard-tab ${activeTab === 'manage-artisans' ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
                  onClick={() => setActiveTab('manage-artisans')}
                >
                  <p className="dashboard-tab-text">Manage Artisans</p>
                </button>
                <button
                  className={`dashboard-tab ${activeTab === 'manage-customers' ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
                  onClick={() => setActiveTab('manage-customers')}
                >
                  <p className="dashboard-tab-text">Manage Customers</p>
                </button>
                <button
                  className={`dashboard-tab ${activeTab === 'manage-categories' ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
                  onClick={() => setActiveTab('manage-categories')}
                >
                  <p className="dashboard-tab-text">Manage Categories</p>
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

export default AdminDashboard; 
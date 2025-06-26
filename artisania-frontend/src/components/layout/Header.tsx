import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/AuthContext';
import categoryService from '../../services/categoryService';
import type { BackendCategory } from '../../types/api';
import Logo from '../../assets/logo and brand/Artisania Logo.png';
import './Header.css';

interface HeaderProps {
  onBackToHome?: () => void;
  showBackButton?: boolean;
  onCategoryClick?: (categoryId: number, categoryName?: string) => void;
  onLogoClick?: () => void;
  onLoginRegisterClick?: () => void;
  onCartClick?: () => void;
  cartItemCount?: number;
  cartTotal?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  onBackToHome, 
  showBackButton = false, 
  onCategoryClick, 
  onLogoClick, 
  onLoginRegisterClick,
  onCartClick,
  cartItemCount = 0,
  cartTotal = 0
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const fetchedCategories = await categoryService.fetchAllCategories();
        
        // Ensure we always have an array, even if the API returns null/undefined
        const categoriesArray = Array.isArray(fetchedCategories) ? fetchedCategories : [];
        setCategories(categoriesArray);
      } catch (error) {
        console.error('Error fetching categories in Header:', error);
        // Set empty array as fallback to prevent map errors
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <header className="header">
      {/* Top Row */}
      <div className="header-top-row">
        <div className="header-container">
          {/* Left spacer or back button */}
          <div>
            {showBackButton && onBackToHome && (
              <button onClick={onBackToHome} className="header-back-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                </svg>
                Back
              </button>
            )}
          </div>
          
          {/* Centered Artisania Logo */}
          <div className="header-logo-container">
            <button className="header-logo-button" onClick={onLogoClick}>
              <img src={Logo} alt="Artisania" className="header-logo" />
            </button>
          </div>
          
          {/* Right-aligned User Actions */}
          <div className="header-user-actions">
            {isAuthenticated ? (
              <div className="header-user-info">
                <span className="header-welcome">Welcome, {user?.email}</span>
                <span className="header-role-badge">{user?.role}</span>
                <button 
                  className="header-logout-button" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                className="header-login-link" 
                onClick={() => {
                  console.log('Header login button clicked, calling onLoginRegisterClick');
                  onLoginRegisterClick?.();
                }}
              >
                Login / Register
              </button>
            )}
            {/* Search Icon - Commented out for future implementation */}
            {/* <button className="header-icon-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </button> */}
            
            {/* Wishlist/Heart Icon - Commented out for future implementation */}
            {/* <button className="header-icon-button header-heart-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.69,146.26,196.16,128,206.8Z"></path>
              </svg>
              <span className="header-notification-badge">0</span>
            </button> */}
            <button className="header-cart-container" onClick={onCartClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M222.14,58.87A8,8,0,0,0,216,56H54.68L49.79,29.14A16,16,0,0,0,34.05,16H16a8,8,0,0,0,0,16h18L59.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,152,204a28,28,0,1,0,28-28H83.17a8,8,0,0,1-7.87-6.57L72.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,222.14,58.87ZM96,204a12,12,0,1,1-12-12A12,12,0,0,1,96,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,192,204Zm4-74.57A8,8,0,0,1,188.1,136H69.22L57.59,72H206.41Z"></path>
              </svg>
              <span className="header-cart-text">{cartItemCount} / ${cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom Row */}
      <div className="header-bottom-row">
        <div className="header-nav-container">
          <nav className="header-nav">
            <div className="header-nav-links">
              {isLoadingCategories ? (
                <div className="header-nav-loading">Loading categories...</div>
              ) : (
                (() => {
                  const categoryButtons = (categories || []).map((category) => {
                    return (
                      <button 
                        key={category.id}
                        className="header-nav-link" 
                        onClick={() => onCategoryClick?.(category.id, category.name)}
                      >
                        {category.name}
                      </button>
                    );
                  });
                  
                  return categoryButtons;
                })()
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 
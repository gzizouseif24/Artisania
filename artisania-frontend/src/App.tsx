import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './stores/AuthContext'
import { CartProvider, useCart } from './contexts/CartContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Hero from './components/home/Hero'
import OurStory from './components/home/OurStory'
import ImageGrid from './components/home/ImageGrid'
import FeaturedCrafts from './components/home/FeaturedCrafts'
import ArtistPage from './components/pages/ArtistPage'
import BrowseArtists from './components/pages/BrowseArtists'
import CategoryPage from './components/pages/CategoryPage'
import ProductDetails from './components/pages/ProductDetails'
import ShoppingCart from './components/pages/ShoppingCart'
import Checkout from './components/pages/Checkout'
import LoginRegisterModal from './components/auth/LoginRegisterModal'
import ArtistRegistration from './components/auth/ArtistRegistration'
import ArtisanDashboard from './components/pages/ArtisanDashboard'
import AdminDashboard from './components/pages/AdminDashboard'
import './App.css';

type PageType = 'home' | 'browse-artists' | 'artist' | 'category' | 'product' | 'cart' | 'checkout' | 'artistRegistration' | 'artisan-dashboard' | 'admin-dashboard';

// HomePage component with Explore Artists functionality
const HomePage: React.FC<{ onExploreArtists: () => void; onProductClick: (productId: number) => void }> = ({ onExploreArtists, onProductClick }) => {
  return (
    <>
      <Hero onExploreArtists={onExploreArtists} />
      <OurStory />
      <ImageGrid />
      <FeaturedCrafts onProductClick={onProductClick} />
    </>
  );
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [navigationHistory, setNavigationHistory] = useState<PageType[]>(['home']);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Use auth context for automatic routing
  const { user, isAuthenticated } = useAuth();

  // Use cart context
  const { state: cartState, clearCart } = useCart();

  // Handle authentication-based routing
  useEffect(() => {
    // Case 1: Admin logs in from any page -> redirect to admin dashboard
    if (isAuthenticated && user?.role === 'ADMIN' && currentPage !== 'admin-dashboard') {
      console.log('Admin authenticated, redirecting to admin dashboard');
      setCurrentPage('admin-dashboard');
      setNavigationHistory(['admin-dashboard']);
    }
    // Case 2: Artisan logs in from any page -> redirect to artisan dashboard
    else if (isAuthenticated && user?.role === 'ARTISAN' && currentPage !== 'artisan-dashboard') {
      console.log('Artisan authenticated, redirecting to artisan dashboard');
      setCurrentPage('artisan-dashboard');
      setNavigationHistory(['artisan-dashboard']);
    }
    
    // Case 3: User logs out while on admin dashboard -> redirect to home
    // Case 4: Non-admin user somehow ends up on admin dashboard -> redirect to home
    if (currentPage === 'admin-dashboard' && (!isAuthenticated || user?.role !== 'ADMIN')) {
      console.log('Unauthorized access to admin dashboard, redirecting to home');
      setCurrentPage('home');
      setNavigationHistory(['home']);
    }
    
    // Case 5: User logs out while on artisan dashboard -> redirect to home
    // Case 6: Non-artisan user somehow ends up on artisan dashboard -> redirect to home
    if (currentPage === 'artisan-dashboard' && (!isAuthenticated || user?.role !== 'ARTISAN')) {
      console.log('Unauthorized access to artisan dashboard, redirecting to home');
      setCurrentPage('home');
      setNavigationHistory(['home']);
    }
  }, [user, isAuthenticated, currentPage]);

  // Helper function to navigate to a new page and update history
  const navigateToPage = (page: PageType) => {
    setNavigationHistory(prev => [...prev, page]);
    setCurrentPage(page);
  };

  // Helper function to go back to previous page
  const goBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = navigationHistory.slice(0, -1);
      const previousPage = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentPage(previousPage);
    } else {
      setCurrentPage('home');
    }
  };

  const handleExploreArtists = () => {
    navigateToPage('browse-artists');
  };

  const handleArtistClick = (artistId: number) => {
    // Store the selected artist ID and navigate to artist page
    setSelectedArtistId(artistId);
    navigateToPage('artist');
  };

  const handleBackToHome = () => {
    // If user is admin, go to admin dashboard instead of home
    if (isAuthenticated && user?.role === 'ADMIN') {
      setNavigationHistory(['admin-dashboard']);
      setCurrentPage('admin-dashboard');
    }
    // If user is artisan, go to artisan dashboard instead of home
    else if (isAuthenticated && user?.role === 'ARTISAN') {
      setNavigationHistory(['artisan-dashboard']);
      setCurrentPage('artisan-dashboard');
    } else {
      setNavigationHistory(['home']);
      setCurrentPage('home');
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    navigateToPage('category');
  };

  const handleProductClick = (productId: number) => {
    setSelectedProductId(productId);
    navigateToPage('product');
    window.scrollTo(0, 0);
  };

  const handleArtistFromProduct = (artisanId: number) => {
    setSelectedArtistId(artisanId);
    navigateToPage('artist');
  };

  const handleLoginRegisterClick = () => {
    console.log('Login/Register button clicked!');
    console.log('Current isLoginModalOpen state:', isLoginModalOpen);
    setIsLoginModalOpen(true);
    console.log('Set isLoginModalOpen to true');
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleBecomeArtisan = () => {
    setIsLoginModalOpen(false);
    navigateToPage('artistRegistration');
  };

  const handleCartClick = () => {
    navigateToPage('cart');
  };

  const handleCheckoutClick = () => {
    navigateToPage('checkout');
  };

  const handlePlaceOrder = async (orderData: any) => {
    try {
      // The orderData now contains the order ID and success information
      if (orderData.id) {
        // Order was successfully created
        alert(`Order #${orderData.id} placed successfully! Total: $${orderData.total.toFixed(2)}`);
        
        // Clear cart is already handled in Checkout component
        // Navigate to home
        setNavigationHistory(['home']);
        setCurrentPage('home');
      } else {
        // Fallback for the old format or if there's an issue
        alert(`Order placed successfully! Total: $${orderData.total?.toFixed(2) || 'N/A'}`);
        
        // Clear cart and go back to home
        clearCart();
        setNavigationHistory(['home']);
        setCurrentPage('home');
      }
    } catch (error) {
      console.error('Error handling order placement:', error);
      alert('Order was placed but there was an issue with navigation. Please check your order status.');
      
      // Still navigate home as a fallback
      setNavigationHistory(['home']);
      setCurrentPage('home');
    }
  };

  const handleArtistRegistrationSuccess = () => {
    setCurrentPage('home');
    // Could also show a success message or redirect to artist dashboard
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'browse-artists':
        return <BrowseArtists onArtistClick={handleArtistClick} />;
      case 'artist':
        return (
          <ArtistPage 
            artistId={selectedArtistId || 1}
            onProductClick={handleProductClick}
          />
        );
      case 'category':
        return (
          <CategoryPage 
            categoryId={selectedCategoryId || 1}
            onProductClick={handleProductClick}
          />
        );
      case 'product':
        return (
          <ProductDetails 
            productId={selectedProductId || 1}
            onBackToHome={goBack} 
            onArtistClick={handleArtistFromProduct}
            onCartNavigation={handleCartClick}
          />
        );
      case 'cart':
        return (
          <ShoppingCart 
            onBackToHome={goBack}
            onCheckoutClick={handleCheckoutClick}
          />
        );
      case 'checkout':
        return (
          <Checkout 
            onBackToCart={goBack}
            onPlaceOrder={handlePlaceOrder}
          />
        );
      case 'artistRegistration':
        return (
          <ArtistRegistration 
            onBackToHome={handleBackToHome}
            onRegistrationSuccess={handleArtistRegistrationSuccess}
          />
        );
      case 'artisan-dashboard':
        return (
          <ArtisanDashboard 
            onNavigateToHome={handleBackToHome}
            onNavigateToLogin={handleLoginRegisterClick}
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboard 
            onNavigateToHome={handleBackToHome}
            onNavigateToLogin={handleLoginRegisterClick}
          />
        );
      default:
        return <HomePage onExploreArtists={handleExploreArtists} onProductClick={handleProductClick} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Only show header if not in artist registration, artisan dashboard, or admin dashboard (dashboards have their own headers) */}
      {currentPage !== 'artistRegistration' && currentPage !== 'artisan-dashboard' && currentPage !== 'admin-dashboard' && (
        <Header 
          onBackToHome={goBack}
          onLogoClick={handleBackToHome}
          showBackButton={currentPage !== 'home'}
          onCategoryClick={handleCategoryClick}
          onLoginRegisterClick={handleLoginRegisterClick}
          onCartClick={handleCartClick}
          cartItemCount={cartState.itemCount}
          cartTotal={cartState.total}
        />
      )}
      <main className={currentPage === 'artistRegistration' || currentPage === 'artisan-dashboard' || currentPage === 'admin-dashboard' ? 'full-page' : 'flex-1'}>
        {renderCurrentPage()}
      </main>
      {/* Only show footer if not in artist registration, artisan dashboard, or admin dashboard (dashboards have their own footers) */}
      {currentPage !== 'artistRegistration' && currentPage !== 'artisan-dashboard' && currentPage !== 'admin-dashboard' && <Footer />}
      
      <LoginRegisterModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        onBecomeArtisan={handleBecomeArtisan}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  )
}

export default App

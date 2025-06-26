import React, { useState, useEffect } from 'react';
import './ProductDetails.css';
import ImageWithFallback from '../common/ImageWithFallback';
import { fetchProductById } from '../../services/productService';
import { fetchArtisanWithProducts } from '../../services/artisanService';
import type { FrontendProduct, FrontendArtisan } from '../../types/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../stores/AuthContext';

interface ProductDetailsProps {
  onBackToHome?: () => void;
  onArtistClick?: (artisanId: number) => void;
  onCartNavigation?: () => void;
  productId?: number;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ 
  onBackToHome, 
  onArtistClick, 
  onCartNavigation,
  productId = 1
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [product, setProduct] = useState<FrontendProduct | null>(null);
  const [artisan, setArtisan] = useState<FrontendArtisan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingArtisan, setLoadingArtisan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const productData = await fetchProductById(productId);
        setProduct(productData);
        
        // Fetch artisan profile data separately
        if (productData.artisanId) {
          await loadArtisanProfile(productData.artisanId);
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    const loadArtisanProfile = async (artisanId: number) => {
      try {
        setLoadingArtisan(true);
        const response = await fetchArtisanWithProducts(artisanId, { page: 0, size: 1 });
        setArtisan(response.artisan);
      } catch (err) {
        console.error('Error loading artisan profile:', err);
        // Don't set main error for artisan loading failure - just log it
      } finally {
        setLoadingArtisan(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="product-details-container">
        <div className="product-details-content">
          <div className="loading-state">
            <h2>Loading Product Details...</h2>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-container">
        <div className="product-details-content">
          <div className="empty-state">
            <h2>Product Not Found</h2>
            <p>{error || 'The requested product could not be found.'}</p>
            {onBackToHome && (
              <button className="back-to-home-btn" onClick={onBackToHome}>
                Back to Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleArtistClick = () => {
    window.scrollTo(0, 0);
    if (onArtistClick && product) {
      onArtistClick(product.artisanId);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        if (onCartNavigation) {
          onCartNavigation();
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  // Get current image to display
  const currentImage = selectedImageIndex === 0 ? product.images.main : product.images.gallery[selectedImageIndex - 1];
  const currentAlt = selectedImageIndex === 0 ? product.images.alt.main : 
    (selectedImageIndex === 1 ? product.images.alt.view1 : 
     selectedImageIndex === 2 ? product.images.alt.view2 : 
     product.images.alt.view3) || product.images.alt.main;

  return (
    <div className="product-details-container">
      <div className="product-details-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <span className="breadcrumb-link">Home</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-link">{product.category}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </div>

        {/* Product Details Title */}
        <h3 className="product-details-title">Product Details</h3>

        <div className="product-main-content">
          {/* Left Side - Images */}
          <div className="product-images-section">
            {/* Main Product Image */}
            <div className="main-image-container">
              <ImageWithFallback
                src={currentImage}
                alt={currentAlt}
                className="main-product-image"
                aspectRatio="4:3"
              />
            </div>

            {/* Image Gallery */}
            <div className="image-gallery">
              {/* Main image thumbnail */}
              <div 
                className={`gallery-image-container ${selectedImageIndex === 0 ? 'active' : ''}`}
                onClick={() => handleImageSelect(0)}
              >
                <ImageWithFallback
                  src={product.images.main}
                  alt={product.images.alt.main}
                  className="gallery-image"
                  aspectRatio="1:1"
                />
              </div>
              
              {/* Gallery images */}
              {product.images.gallery.map((image: string, index: number) => (
                <div 
                  key={index}
                  className={`gallery-image-container ${selectedImageIndex === index + 1 ? 'active' : ''}`}
                  onClick={() => handleImageSelect(index + 1)}
                >
                  <ImageWithFallback
                    src={image}
                    alt={`${product.name} view ${index + 2}`}
                    className="gallery-image"
                    aspectRatio="1:1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Product Info */}
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>
            <p className="product-artist">By {product.artisan}</p>
            <p className="product-description">{product.description}</p>
            
            <h2 className="product-price">{product.priceFormatted}</h2>
            
            {/* Quantity Selector */}
            <div className="quantity-section">
              <label className="quantity-label">
                <select 
                  className="quantity-select"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </label>
            </div>

            {/* Add to Cart Button */}
            <div className="add-to-cart-section">
              <button 
                className="add-to-cart-btn" 
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? 'Adding...' : showSuccessMessage ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              {showSuccessMessage && (
                <p className="success-message" style={{ color: 'green', marginTop: '10px' }}>
                  Item successfully added to cart! Redirecting...
                </p>
              )}
            </div>

            {/* Artisan Highlight */}
            <h3 className="artisan-highlight-title">Artisan Highlight</h3>
            <div className="artisan-highlight-section">
              <div className="artisan-info" onClick={handleArtistClick}>
                {loadingArtisan ? (
                  <div 
                    className="artisan-avatar loading"
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#f1efe9',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#8e7d57',
                      fontSize: '12px',
                      fontWeight: '400'
                    }}
                  >
                    Loading...
                  </div>
                ) : artisan ? (
                  <div className="artisan-avatar-container">
                    {artisan.profileImage === 'USE_PLACEHOLDER' ? (
                      <div 
                        className="artisan-avatar placeholder"
                        style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: '#f1efe9',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#8e7d57',
                          fontSize: '24px'
                        }}
                      >
                        👨‍🎨
                      </div>
                    ) : (
                      <ImageWithFallback
                        src={artisan.profileImage}
                        alt={`${artisan.displayName} profile picture`}
                        className="artisan-avatar"
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div 
                    className="artisan-avatar placeholder"
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#f1efe9',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#8e7d57',
                      fontSize: '24px'
                    }}
                  >
                    👨‍🎨
                  </div>
                )}
                <div className="artisan-details">
                  <p className="artisan-name">{product.artisan}</p>
                  <p className="artisan-bio">
                    {artisan && artisan.bio ? artisan.bio : 
                      'This artisan is dedicated to preserving traditional craftsmanship while bringing their own unique style and innovation to each piece. Their work reflects a deep passion for their craft and attention to detail that sets their creations apart.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails; 
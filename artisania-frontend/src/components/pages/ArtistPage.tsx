import './ArtistPage.css';
import React, { useState, useEffect } from 'react';
import ImageWithFallback from '../common/ImageWithFallback';
import { fetchArtisanWithProducts } from '../../services/artisanService';
import type { FrontendArtisan, FrontendProduct } from '../../types/api';

interface ArtistPageProps {
  artistId: number;
  onProductClick?: (productId: number) => void;
}

const ArtistPage: React.FC<ArtistPageProps> = ({ artistId, onProductClick }) => {
  const [activeTab, setActiveTab] = useState<'creations' | 'story'>('creations');
  const [artisan, setArtisan] = useState<FrontendArtisan | null>(null);
  const [products, setProducts] = useState<FrontendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the provided artisanId or fallback to 1 for backward compatibility
  const resolvedArtisanId = artistId || 1;

  // Fetch artisan and their products from the API
  useEffect(() => {
    const loadArtisanData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchArtisanWithProducts(resolvedArtisanId, {
          page: 0,
          size: 6 // Load first 6 products
        });
        
        setArtisan(response.artisan);
        setProducts(response.products.content);
      } catch (err: any) {
        console.error('Failed to load artisan data:', err);
        setError('Failed to load artisan information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadArtisanData();
  }, [resolvedArtisanId]);

  const handleProductClick = (productId: number) => {
    if (onProductClick) {
      onProductClick(productId);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="artist-page-container">
        <div className="artist-page-content">
          <div className="loading-message">
            <p>Loading artisan profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !artisan) {
    return (
      <div className="artist-page-container">
        <div className="artist-page-content">
          <div className="error-message">
            <p>{error || 'Artisan not found'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="artist-page-container">
      <div className="artist-page-content">
        {/* Hero Section */}
        <div className="artist-hero-section">
          <div className="artist-hero-content">
            <div
              className="artist-hero-banner"
              style={{
                backgroundImage: artisan.coverImage === 'USE_PLACEHOLDER' 
                  ? 'none' 
                  : `linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 25%), url("${artisan.coverImage}")`,
                backgroundColor: artisan.coverImage === 'USE_PLACEHOLDER' 
                  ? '#fcfaf8' 
                  : 'transparent'
              }}
            >
              <div className="artist-hero-text-container">
                <p className="artist-hero-title">
                  Artisan Profile
                </p>
                {artisan.coverImage === 'USE_PLACEHOLDER' && (
                  <p style={{
                    color: '#8e7d57',
                    fontSize: '14px',
                    fontWeight: '400',
                    margin: '0.5rem 0 0 0'
                  }}>
                    Background image coming soon
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="artist-profile-section">
          <div className="artist-profile-content">
            <div className="artist-profile-info">
              <div
                className="artist-avatar"
                style={{
                  backgroundImage: artisan.profileImage === 'USE_PLACEHOLDER' 
                    ? 'none' 
                    : `url("${artisan.profileImage}")`,
                  backgroundColor: artisan.profileImage === 'USE_PLACEHOLDER' 
                    ? '#f1efe9' 
                    : 'transparent'
                }}
              >
                {artisan.profileImage === 'USE_PLACEHOLDER' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#8e7d57',
                    fontSize: '12px',
                    fontWeight: '400',
                    textAlign: 'center'
                  }}>
                    Profile<br />Image<br />Coming<br />Soon
                  </div>
                )}
              </div>
              <div className="artist-details">
                <p className="artist-name">{artisan.displayName}</p>
                <p className="artist-specialty">{artisan.bio}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="artist-nav-section">
          <div className="artist-nav-container">
            <button 
              className={`artist-nav-link ${activeTab === 'creations' ? 'active' : ''}`}
              onClick={() => setActiveTab('creations')}
            >
              <p className="artist-nav-text">Creations</p>
            </button>
            <button 
              className={`artist-nav-link ${activeTab === 'story' ? 'active' : ''}`}
              onClick={() => setActiveTab('story')}
            >
              <p className="artist-nav-text">Our Story</p>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'creations' && (
          <>
            {/* Featured Creations */}
            <h3 className="featured-creations-title">Featured Creations</h3>
            {products.length > 0 ? (
              <div className="featured-creations-grid">
                {products.map((product: FrontendProduct) => (
                  <div 
                    key={product.id} 
                    className="creation-card"
                    onClick={() => handleProductClick(product.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="creation-image-container">
                      <ImageWithFallback
                        src={product.images.main}
                        alt={`${product.name} by ${artisan.displayName}`}
                        className="creation-image"
                        aspectRatio="1:1"
                      />
                    </div>
                    <div className="creation-info">
                      <p className="creation-name">{product.name}</p>
                      <p className="creation-price">${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-artist-products">
                <p>This artist hasn't listed any products yet. Check back soon for beautiful handcrafted items!</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'story' && (
          <>
            {/* About Section */}
            <h3 className="about-section-title">About {artisan.displayName}</h3>
            <p className="about-text">
              {artisan.bio}
            </p>
            {artisan.bio.length < 200 && (
              <>
                <p className="about-text">
                  {artisan.displayName} is a dedicated artisan committed to preserving traditional crafts while bringing their own unique style and innovation to each piece. Their work reflects a deep passion for their craft and attention to detail that sets their creations apart.
                </p>
                <p className="about-text">
                  Each piece is carefully handcrafted with traditional techniques passed down through generations, ensuring authenticity while incorporating contemporary design elements that appeal to modern sensibilities.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ArtistPage; 
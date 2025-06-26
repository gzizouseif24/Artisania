import React, { useEffect, useState } from 'react';
import './FeaturedCrafts.css';
import ImageWithFallback from '../common/ImageWithFallback';
import { fetchFeaturedProducts } from '../../services/productService';
import type { FrontendProduct } from '../../types/api';

interface FeaturedCraftsProps {
  onProductClick?: (productId: number) => void;
}

const FeaturedCrafts: React.FC<FeaturedCraftsProps> = ({ onProductClick }) => {
  const [featuredProducts, setFeaturedProducts] = useState<FrontendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoading(true);
        const response = await fetchFeaturedProducts();
        setFeaturedProducts(response.content.slice(0, 4)); // Show only first 4 products
      } catch (err) {
        console.error('Error loading featured products:', err);
        setError('Unable to load featured products');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  const handleProductClick = (productId: number) => {
    if (onProductClick) {
      onProductClick(productId);
    }
  };

  if (loading) {
    return (
      <section className="featured-crafts">
        <div className="featured-crafts-container">
          <h2>Featured Crafts</h2>
          <div className="featured-crafts-grid">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="product-card loading">
                <div className="product-image-placeholder"></div>
                <div className="product-info">
                  <div className="product-name-placeholder"></div>
                  <div className="product-price-placeholder"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="featured-crafts">
        <div className="featured-crafts-container">
          <h2>Featured Crafts</h2>
          <p className="error-message">{error}</p>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return (
      <section className="featured-crafts">
        <div className="featured-crafts-container">
          <h2>Featured Crafts</h2>
          <p>No featured products available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="featured-crafts">
      <div className="featured-crafts-container">
        <div className="featured-crafts-content">
          <h2 className="featured-crafts-title">Featured Crafts</h2>
          <div className="featured-crafts-grid">
            {featuredProducts.map((product) => (
              <div 
                key={product.id} 
                className="craft-card clickable"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="craft-image-container">
                  <ImageWithFallback
                    src={product.images.main}
                    alt={product.images.alt.main}
                    className="craft-image"
                    aspectRatio="1:1"
                  />
                </div>
                <div className="craft-info">
                  <h3 className="craft-name">{product.name}</h3>
                  <p className="craft-price">{product.priceFormatted}</p>
                  <p className="craft-artist">by {product.artisan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCrafts; 
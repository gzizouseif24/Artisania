import React, { useState, useEffect } from 'react';
import { fetchCurrentUserProducts, deleteProduct } from '../../services/productService';
import type { FrontendProduct } from '../../types/api';
import ImageWithFallback from '../common/ImageWithFallback';
import './MyProducts.css';

interface MyProductsProps {
  onProductDeleted?: () => void;
}

const MyProducts: React.FC<MyProductsProps> = ({ onProductDeleted }) => {
  const [products, setProducts] = useState<FrontendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchCurrentUserProducts();
      setProducts(response.content);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Failed to load your products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingIds(prev => new Set(prev).add(productId));
      
      await deleteProduct(productId);
      
      // Remove the product from the local state
      setProducts(prev => prev.filter(product => product.id !== productId));
      
      // Notify parent component if callback provided
      if (onProductDeleted) {
        onProductDeleted();
      }

    } catch (err: any) {
      console.error('Failed to delete product:', err);
      alert(`Failed to delete product: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="my-products-container">
        <div className="my-products-loading">
          <p>Loading your products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-products-container">
        <div className="my-products-error">
          <h3>Error Loading Products</h3>
          <p>{error}</p>
          <button onClick={loadProducts} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-products-container">

      {products.length === 0 ? (
        <div className="my-products-empty">
          <div className="empty-state">
            <h3>No Products Yet</h3>
            <p>You haven't created any products yet. Start by adding your first product!</p>
          </div>
        </div>
      ) : (
        <div className="my-products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-container">
                <ImageWithFallback
                  src={product.images.main}
                  alt={product.images.alt.main}
                  className="product-image"
                />
                {!product.inStock && (
                  <div className="out-of-stock-badge">Out of Stock</div>
                )}
              </div>
              
              <div className="product-content">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-category">{product.category}</p>
                
                <div className="product-details">
                  <div className="product-price">{product.priceFormatted}</div>
                  <div className={`product-stock ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                    Stock: {product.stockCount}
                  </div>
                </div>
                
                {product.description && (
                  <p className="product-description">
                    {product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description
                    }
                  </p>
                )}
                
                <div className="product-meta">
                  <span className="product-date">
                    Created: {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                  {product.featured && (
                    <span className="featured-badge">Featured</span>
                  )}
                </div>
              </div>
              
              <div className="product-actions">
                <button
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                  disabled={deletingIds.has(product.id)}
                  className="delete-button"
                >
                  {deletingIds.has(product.id) ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProducts; 
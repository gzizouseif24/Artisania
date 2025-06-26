import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminTabs.css';

// Types
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  artisan: {
    id: number;
    displayName: string;
    email: string;
  };
  category: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface ProductsResponse {
  success: boolean;
  products: Product[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  error?: string;
}

const ManageSite: React.FC = () => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [actionLoading, setActionLoading] = useState<{[key: number]: boolean}>({});

  // Fetch products
  const fetchProducts = async (page: number = 0, search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getAllProducts({
        page,
        size: 20,
        search: search.trim() || undefined
      });

      if (response.success) {
        setProducts(response.products);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        setCurrentPage(response.currentPage);
      } else {
        setError(response.error || 'Failed to fetch products');
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts(0, searchTerm);
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchProducts(0, searchTerm);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchProducts(newPage, searchTerm);
  };

  // Toggle product feature status
  const toggleFeature = async (productId: number, currentStatus: boolean) => {
    try {
      setActionLoading(prev => ({ ...prev, [productId]: true }));
      
      const response = await adminService.toggleProductFeature(productId, !currentStatus);
      
      if (response.success) {
        // Update the product in the list
        setProducts(prev => prev.map(product => 
          product.id === productId 
            ? { ...product, isFeatured: !currentStatus }
            : product
        ));
        
        // Show success message (you could use a toast here)
        console.log(response.message);
      } else {
        setError(response.error || 'Failed to update product feature status');
      }
    } catch (err: any) {
      console.error('Error toggling feature:', err);
      setError(err.message || 'Failed to update product feature status');
    } finally {
      setActionLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

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
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-tab-container">
      {/* Header */}
      <div className="admin-tab-header">
        <div className="admin-tab-title">
          <h3>Product Management</h3>
          <p>Manage site products and featured items</p>
        </div>
        
        {/* Search */}
        <form onSubmit={handleSearch} className="admin-search-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="admin-search-input"
          />
          <button type="submit" className="admin-btn admin-btn--primary">
            🔍 Search
          </button>
        </form>
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
          <div className="admin-stat-icon">📦</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">{totalElements}</span>
            <span className="admin-stat-label">Total Products</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">⭐</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">
              {products.filter(p => p.isFeatured).length}
            </span>
            <span className="admin-stat-label">Featured</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">✅</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">
              {products.filter(p => p.isActive).length}
            </span>
            <span className="admin-stat-label">Active</span>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-table-container">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Artisan</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="admin-table-row">
                    <td className="admin-product-cell">
                      <div className="admin-product-info">
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="admin-product-image"
                          />
                        )}
                        <div className="admin-product-details">
                          <span className="admin-product-name">{product.name}</span>
                          <span className="admin-product-desc">
                            {product.description.length > 60 
                              ? `${product.description.substring(0, 60)}...`
                              : product.description
                            }
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-artisan-info">
                        <span className="admin-artisan-name">{product.artisan.displayName}</span>
                        <span className="admin-artisan-email">{product.artisan.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="admin-category-tag">{product.category.name}</span>
                    </td>
                    <td>
                      <span className="admin-price">{formatPrice(product.price)}</span>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${product.isActive ? 'admin-status-active' : 'admin-status-inactive'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-featured-badge ${product.isFeatured ? 'admin-featured-yes' : 'admin-featured-no'}`}>
                        {product.isFeatured ? '⭐ Featured' : 'Not Featured'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          onClick={() => toggleFeature(product.id, product.isFeatured)}
                          disabled={actionLoading[product.id]}
                          className={`admin-btn admin-btn--sm ${
                            product.isFeatured 
                              ? 'admin-btn--warning' 
                              : 'admin-btn--success'
                          }`}
                          title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
                        >
                          {actionLoading[product.id] ? (
                            <span className="admin-btn-spinner"></span>
                          ) : (
                            <>
                              {product.isFeatured ? '⭐' : '☆'}
                              {product.isFeatured ? 'Unfeature' : 'Feature'}
                            </>
                          )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="admin-btn admin-btn--secondary admin-btn--sm"
          >
            ← Previous
          </button>
          
          <div className="admin-pagination-info">
            <span>
              Page {currentPage + 1} of {totalPages} 
              ({totalElements} total products)
            </span>
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="admin-btn admin-btn--secondary admin-btn--sm"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageSite; 
import React, { useState, useEffect } from 'react';
import './CategoryPage.css';
import ImageWithFallback from '../common/ImageWithFallback';
import { fetchProductsByCategory } from '../../services/productService';
import categoryService from '../../services/categoryService';
import type { BackendCategory, FrontendProduct } from '../../types/api';

interface CategoryPageProps {
  categoryId: number;
  onProductClick?: (productId: number) => void;
}

const CategoryPage: React.FC<CategoryPageProps> = ({ categoryId, onProductClick }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('Sort by');
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [products, setProducts] = useState<FrontendProduct[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const fetchedCategories = await categoryService.fetchAllCategories();
        setCategories(fetchedCategories);
        
        // Handle initial category selection logic
        if (categoryId) {
          const foundCategory = fetchedCategories.find(cat => cat.id === categoryId);
          if (foundCategory) {
            setSelectedCategory(foundCategory.name);
            setSelectedCategoryId(foundCategory.id);
          }
        } else if (fetchedCategories.length > 0) {
          setSelectedCategory(fetchedCategories[0].name);
          setSelectedCategoryId(fetchedCategories[0].id);
        }
      } catch (error) {
        console.error('Error fetching categories in CategoryPage:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [categoryId]);

  // Fetch products when category changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedCategoryId) return;
      
      try {
        setIsLoadingProducts(true);
        const response = await fetchProductsByCategory(selectedCategoryId);
        setProducts(response.content);
      } catch (error) {
        console.error('Error fetching products for category:', error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    if (selectedCategoryId) {
      fetchProducts();
    }
  }, [selectedCategoryId]);

  const handleCategoryChange = (category: BackendCategory) => {
    setSelectedCategory(category.name);
    setSelectedCategoryId(category.id);
  };

  const handleProductClick = (productId: number) => {
    if (onProductClick) {
      onProductClick(productId);
    }
  };

  return (
    <div className="category-page">
      <div className="category-content">
        {/* Left Sidebar */}
        <div className="category-sidebar">
          <h3 className="category-sidebar-title">Categories</h3>
          <div className="category-list">
            {isLoadingCategories ? (
              <div className="category-loading">Loading categories...</div>
            ) : (
              categories.map((category) => (
                <button
                  key={category.id}
                  className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="category-main">
          {/* Breadcrumb */}
          <div className="category-breadcrumb">
            <span className="breadcrumb-link">Home</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{selectedCategory}</span>
          </div>

          {/* Category Header */}
          <div className="category-header">
            <h1 className="category-title">{selectedCategory}</h1>
          </div>

          {/* Sort Controls */}
          <div className="category-controls">
            <select 
              className="category-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="Sort by">Sort by</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
              <option value="artist">Artist A-Z</option>
            </select>
          </div>

          {/* Products Grid */}
          {isLoadingProducts ? (
            <div className="category-products-grid">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="product-card loading">
                  <div className="product-image-placeholder"></div>
                  <div className="product-info">
                    <div className="product-name-placeholder"></div>
                    <div className="product-price-placeholder"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="category-products-grid">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="product-card"
                  onClick={() => handleProductClick(product.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-image-container">
                    <ImageWithFallback
                      src={product.images.main}
                      alt={product.images.alt.main}
                      className="product-image"
                      aspectRatio="1:1"
                    />
                  </div>
                  <div className="product-info">
                    <p className="product-name">{product.name}</p>
                    <p className="product-price">{product.priceFormatted}</p>
                    <p className="product-artist">by {product.artisan}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-products-message">
              <p>No products available in this category yet. Check back soon for new arrivals!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage; 
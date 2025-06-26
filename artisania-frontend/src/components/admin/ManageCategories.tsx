import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminTabs.css';

// Types
interface Category {
  id: number;
  name: string;
  description?: string;
  slug?: string;
  productCount?: number;
  isActive?: boolean;
  createdAt?: string;
}

interface AddCategoryModal {
  isOpen: boolean;
  loading: boolean;
}

interface DeleteConfirmation {
  isOpen: boolean;
  category: Category | null;
}

interface AddCategoryForm {
  name: string;
  description: string;
}

const ManageCategories: React.FC = () => {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModal, setAddModal] = useState<AddCategoryModal>({
    isOpen: false,
    loading: false
  });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation>({
    isOpen: false,
    category: null
  });
  const [formData, setFormData] = useState<AddCategoryForm>({
    name: '',
    description: ''
  });
  const [actionLoading, setActionLoading] = useState<{[key: number]: boolean}>({});

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getAllCategories();
      
      if (response.success) {
        setCategories(response.categories);
      } else {
        setError(response.error || 'Failed to fetch categories');
        setCategories([]);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle add category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setAddModal(prev => ({ ...prev, loading: true }));
      
      const response = await adminService.createCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
      
      if (response.success && response.category) {
        // Add new category to list
        setCategories(prev => [...prev, response.category as Category]);
        
        // Reset form and close modal
        setFormData({ name: '', description: '' });
        setAddModal({ isOpen: false, loading: false });
        
        console.log(response.message);
      } else {
        setError(response.error || 'Failed to create category');
        setAddModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err: any) {
      console.error('Error creating category:', err);
      setError(err.message || 'Failed to create category');
      setAddModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (category: Category) => {
    try {
      setActionLoading(prev => ({ ...prev, [category.id]: true }));
      
      const response = await adminService.deleteCategory(category.id);
      
      if (response.success) {
        // Remove category from list
        setCategories(prev => prev.filter(c => c.id !== category.id));
        setDeleteConfirm({ isOpen: false, category: null });
        
        console.log(response.message);
      } else {
        setError(response.error || 'Failed to delete category');
      }
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Failed to delete category');
    } finally {
      setActionLoading(prev => ({ ...prev, [category.id]: false }));
    }
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({ name: '', description: '' });
    setAddModal({ isOpen: true, loading: false });
  };

  // Close add modal
  const closeAddModal = () => {
    setFormData({ name: '', description: '' });
    setAddModal({ isOpen: false, loading: false });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-tab-container">
        <div className="admin-loading">
          <div className="admin-loading-spinner"></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-tab-container">
      {/* Header */}
      <div className="admin-tab-header">
        <div className="admin-tab-title">
          <h3>Category Management</h3>
          <p>Add, edit and remove product categories</p>
        </div>
        
        <div className="admin-header-actions">
          <button
            onClick={fetchCategories}
            className="admin-btn admin-btn--secondary"
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button
            onClick={openAddModal}
            className="admin-btn admin-btn--primary"
          >
            ➕ Add Category
          </button>
        </div>
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
          <div className="admin-stat-icon">📂</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">{categories.length}</span>
            <span className="admin-stat-label">Total Categories</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">✅</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">
              {categories.filter(c => c.isActive !== false).length}
            </span>
            <span className="admin-stat-label">Active</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">📦</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">
              {categories.reduce((sum, c) => sum + (c.productCount || 0), 0)}
            </span>
            <span className="admin-stat-label">Total Products</span>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="admin-table-container">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Products</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty">
                    No categories found. Create your first category!
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="admin-table-row">
                    <td>
                      <div className="admin-category-info">
                        <span className="admin-category-name">{category.name}</span>
                        {category.slug && (
                          <span className="admin-category-slug">/{category.slug}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="admin-category-desc">
                        {category.description || 'No description'}
                      </span>
                    </td>
                    <td>
                      <span className="admin-product-count">
                        {category.productCount || 0} products
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${category.isActive !== false ? 'admin-status-active' : 'admin-status-inactive'}`}>
                        {category.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className="admin-date">
                        {category.createdAt ? formatDate(category.createdAt) : 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, category })}
                          disabled={actionLoading[category.id]}
                          className="admin-btn admin-btn--sm admin-btn--danger"
                          title="Delete category"
                        >
                          {actionLoading[category.id] ? (
                            <span className="admin-btn-spinner"></span>
                          ) : (
                            <>🗑️ Delete</>
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

      {/* Add Category Modal */}
      {addModal.isOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>➕ Add New Category</h3>
              <button
                onClick={closeAddModal}
                className="admin-modal-close"
                disabled={addModal.loading}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCategory}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label htmlFor="name" className="admin-form-label">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="admin-form-input"
                    placeholder="Enter category name..."
                    required
                    disabled={addModal.loading}
                  />
                </div>
                
                <div className="admin-form-group">
                  <label htmlFor="description" className="admin-form-label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="admin-form-textarea"
                    placeholder="Enter category description..."
                    rows={3}
                    disabled={addModal.loading}
                  />
                </div>
              </div>
              
              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="admin-btn admin-btn--secondary"
                  disabled={addModal.loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={addModal.loading || !formData.name.trim()}
                >
                  {addModal.loading ? (
                    <>
                      <span className="admin-btn-spinner"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.category && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>⚠️ Confirm Delete</h3>
            </div>
            <div className="admin-modal-body">
              <p>
                Are you sure you want to delete the category{' '}
                <strong>"{deleteConfirm.category.name}"</strong>?
              </p>
              {deleteConfirm.category.productCount && deleteConfirm.category.productCount > 0 && (
                <p className="admin-modal-warning">
                  ⚠️ This category contains {deleteConfirm.category.productCount} products. 
                  Deleting it may affect these products.
                </p>
              )}
              <p className="admin-modal-warning">
                This action cannot be undone.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, category: null })}
                className="admin-btn admin-btn--secondary"
                disabled={actionLoading[deleteConfirm.category.id]}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCategory(deleteConfirm.category!)}
                className="admin-btn admin-btn--danger"
                disabled={actionLoading[deleteConfirm.category.id]}
              >
                {actionLoading[deleteConfirm.category.id] ? (
                  <>
                    <span className="admin-btn-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete Category'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories; 
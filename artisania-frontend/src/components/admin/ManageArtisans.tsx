import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminTabs.css';

// Types
interface Artisan {
  id: number;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  artisanProfile?: {
    id: number;
    displayName: string;
    bio: string;
    profileImageUrl?: string;
    coverImageUrl?: string;
    productCount?: number;
  };
}

interface DeleteConfirmation {
  isOpen: boolean;
  artisan: Artisan | null;
}

const ManageArtisans: React.FC = () => {
  // State
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation>({
    isOpen: false,
    artisan: null
  });
  const [actionLoading, setActionLoading] = useState<{[key: number]: boolean}>({});

  // Fetch artisans
  const fetchArtisans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getAllArtisans();
      
      if (response.success) {
        setArtisans(response.artisans);
      } else {
        setError(response.error || 'Failed to fetch artisans');
        setArtisans([]);
      }
    } catch (err: any) {
      console.error('Error fetching artisans:', err);
      setError(err.message || 'Failed to fetch artisans');
      setArtisans([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchArtisans();
  }, []);

  // Handle delete artisan
  const handleDeleteArtisan = async (artisan: Artisan) => {
    try {
      setActionLoading(prev => ({ ...prev, [artisan.id]: true }));
      
      const response = await adminService.deleteUser(artisan.id);
      
      if (response.success) {
        // Remove artisan from list
        setArtisans(prev => prev.filter(a => a.id !== artisan.id));
        setDeleteConfirm({ isOpen: false, artisan: null });
        console.log(response.message);
      } else {
        setError(response.error || 'Failed to delete artisan');
      }
    } catch (err: any) {
      console.error('Error deleting artisan:', err);
      setError(err.message || 'Failed to delete artisan');
    } finally {
      setActionLoading(prev => ({ ...prev, [artisan.id]: false }));
    }
  };

  // Handle toggle artisan status (activate/deactivate)
  const handleToggleArtisanStatus = async (artisan: Artisan) => {
    try {
      setActionLoading(prev => ({ ...prev, [artisan.id]: true }));
      
      const response = artisan.isActive 
        ? await adminService.deactivateUser(artisan.id)
        : await adminService.activateUser(artisan.id);
      
      if (response.success) {
        // Update artisan status in list
        setArtisans(prev => prev.map(a => 
          a.id === artisan.id 
            ? { ...a, isActive: !artisan.isActive }
            : a
        ));
        console.log(response.message);
      } else {
        setError(response.error || `Failed to ${artisan.isActive ? 'deactivate' : 'activate'} artisan`);
      }
    } catch (err: any) {
      console.error('Error toggling artisan status:', err);
      setError(err.message || `Failed to ${artisan.isActive ? 'deactivate' : 'activate'} artisan`);
    } finally {
      setActionLoading(prev => ({ ...prev, [artisan.id]: false }));
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

  if (loading) {
    return (
      <div className="admin-tab-container">
        <div className="admin-loading">
          <div className="admin-loading-spinner"></div>
          <p>Loading artisans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-tab-container">
      {/* Header */}
      <div className="admin-tab-header">
        <div className="admin-tab-title">
          <h3>Artisan Management</h3>
          <p>Manage artisan accounts and profiles</p>
        </div>
        
        <button
          onClick={fetchArtisans}
          className="admin-btn admin-btn--secondary"
          disabled={loading}
        >
          🔄 Refresh
        </button>
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
          <div className="admin-stat-icon">👨‍🎨</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">{artisans.length}</span>
            <span className="admin-stat-label">Total Artisans</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">✅</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">
              {artisans.filter(a => a.isActive).length}
            </span>
            <span className="admin-stat-label">Active</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">📱</div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">
              {artisans.filter(a => a.artisanProfile).length}
            </span>
            <span className="admin-stat-label">With Profiles</span>
          </div>
        </div>
      </div>

      {/* Artisans Table */}
      <div className="admin-table-container">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Artisan</th>
                <th>Email</th>
                <th>Status</th>
                <th>Products</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {artisans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty">
                    No artisans found.
                  </td>
                </tr>
              ) : (
                artisans.map((artisan) => (
                  <tr key={artisan.id} className="admin-table-row">
                    <td className="admin-artisan-cell">
                      <div className="admin-artisan-profile">
                        {artisan.artisanProfile?.profileImageUrl && (
                          <img 
                            src={artisan.artisanProfile.profileImageUrl} 
                            alt={artisan.artisanProfile.displayName}
                            className="admin-artisan-avatar"
                          />
                        )}
                        <div className="admin-artisan-details">
                          <span className="admin-artisan-name">
                            {artisan.artisanProfile?.displayName || 'No display name'}
                          </span>
                          <span className="admin-artisan-bio">
                            {artisan.artisanProfile?.bio 
                              ? (artisan.artisanProfile.bio.length > 50 
                                  ? `${artisan.artisanProfile.bio.substring(0, 50)}...`
                                  : artisan.artisanProfile.bio)
                              : 'No bio available'
                            }
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-email">{artisan.email}</span>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${artisan.isActive ? 'admin-status-active' : 'admin-status-inactive'}`}>
                        {artisan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className="admin-product-count">
                        {artisan.artisanProfile?.productCount || 0} products
                      </span>
                    </td>
                    <td>
                      <span className="admin-date">
                        {artisan.createdAt ? formatDate(artisan.createdAt) : 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          onClick={() => handleToggleArtisanStatus(artisan)}
                          disabled={actionLoading[artisan.id]}
                          className={`admin-btn admin-btn--sm ${artisan.isActive ? 'admin-btn--secondary' : 'admin-btn--primary'}`}
                          title={artisan.isActive ? 'Deactivate artisan' : 'Activate artisan'}
                        >
                          {actionLoading[artisan.id] ? (
                            <span className="admin-btn-spinner"></span>
                          ) : (
                            artisan.isActive ? '🔒 Deactivate' : '✅ Activate'
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, artisan })}
                          disabled={actionLoading[artisan.id]}
                          className="admin-btn admin-btn--sm admin-btn--danger"
                          title="Delete artisan permanently"
                        >
                          {actionLoading[artisan.id] ? (
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.artisan && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>⚠️ Confirm Delete</h3>
            </div>
            <div className="admin-modal-body">
              <p>
                Are you sure you want to permanently delete artisan{' '}
                <strong>{deleteConfirm.artisan.artisanProfile?.displayName || deleteConfirm.artisan.email}</strong>?
              </p>
              <div className="admin-modal-warning">
                <p>⚠️ <strong>Warning:</strong> This action cannot be undone.</p>
                <p>If this artisan has products or orders, deletion may fail due to database constraints.</p>
                <p><strong>Consider using "Deactivate" instead</strong> to preserve data while preventing login.</p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, artisan: null })}
                className="admin-btn admin-btn--secondary"
                disabled={actionLoading[deleteConfirm.artisan.id]}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteArtisan(deleteConfirm.artisan!)}
                className="admin-btn admin-btn--danger"
                disabled={actionLoading[deleteConfirm.artisan.id]}
              >
                {actionLoading[deleteConfirm.artisan.id] ? (
                  <>
                    <span className="admin-btn-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete Artisan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageArtisans; 
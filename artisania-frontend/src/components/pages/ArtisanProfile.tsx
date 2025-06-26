import React, { useState, useEffect } from 'react';

import { 
  fetchCurrentUserArtisan, 
  updateCurrentUserArtisan, 
  uploadProfileImage, 
  uploadCoverImage 
} from '../../services/artisanService';
import type { FrontendArtisan, UpdateArtisanProfileRequest } from '../../types/api';
import './ArtisanProfile.css';

interface ArtisanProfileProps {
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

const ArtisanProfile: React.FC<ArtisanProfileProps> = ({
  onSaveSuccess,
  onCancel
}) => {

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    displayName: '',
    bio: ''
  });
  
  // Current profile data
  const [currentProfile, setCurrentProfile] = useState<FrontendArtisan | null>(null);
  
  // Image upload states
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);

  // Load current artisan profile
  useEffect(() => {
    loadArtisanProfile();
  }, []);

  const loadArtisanProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
          const profile = await fetchCurrentUserArtisan();
      
      setCurrentProfile(profile);
      setFormData({
        displayName: profile.displayName,
        bio: profile.bio
      });
      
      // Set current images as previews if they exist
      if (profile.profileImage && profile.profileImage !== 'USE_PLACEHOLDER') {
        setProfileImagePreview(profile.profileImage);
      } else {
        setProfileImagePreview(null);
      }
      
      if (profile.coverImage && profile.coverImage !== 'USE_PLACEHOLDER') {
        setCoverImagePreview(profile.coverImage);
      } else {
        setCoverImagePreview(null);
      }
      
    } catch (err: any) {
      console.error('Failed to load artisan profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any previous success/error messages when user starts typing
    if (success) setSuccess(null);
    if (error) setError(null);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB.');
        return;
      }
      
      setProfileImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB.');
        return;
      }
      
      setCoverImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };

  const uploadImages = async (): Promise<{ profileImageUrl?: string; coverImageUrl?: string }> => {
    const results: { profileImageUrl?: string; coverImageUrl?: string } = {};
    
    try {
      // Upload profile image if selected
      if (profileImageFile) {
        setUploadingProfileImage(true);
        const profileImageUrl = await uploadProfileImage(profileImageFile);
        results.profileImageUrl = profileImageUrl;
      }
      
      // Upload cover image if selected
      if (coverImageFile) {
        setUploadingCoverImage(true);
        const coverImageUrl = await uploadCoverImage(coverImageFile);
        results.coverImageUrl = coverImageUrl;
      }
      
      return results;
    } finally {
      setUploadingProfileImage(false);
      setUploadingCoverImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.displayName.trim()) {
      setError('Display name is required.');
      return;
    }
    
    if (!formData.bio.trim()) {
      setError('Bio is required.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // First, upload any new images
      const imageUrls = await uploadImages();
      
      // Prepare update data
      const updateData: UpdateArtisanProfileRequest = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        ...(imageUrls.profileImageUrl && { profileImageUrl: imageUrls.profileImageUrl }),
        ...(imageUrls.coverImageUrl && { coverImageUrl: imageUrls.coverImageUrl })
      };
      
      // Update the profile
      const updatedProfile = await updateCurrentUserArtisan(updateData);
      
      // Update local state
      setCurrentProfile(updatedProfile);
      
      // Clear file inputs
      setProfileImageFile(null);
      setCoverImageFile(null);
      
      setSuccess('Profile updated successfully!');
      
      // Call success callback if provided
      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess();
        }, 1500);
      }
      
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (currentProfile) {
      setFormData({
        displayName: currentProfile.displayName,
        bio: currentProfile.bio
      });
    }
    
    // Clear file inputs and previews
    setProfileImageFile(null);
    setCoverImageFile(null);
    setProfileImagePreview(currentProfile?.profileImage !== 'USE_PLACEHOLDER' ? currentProfile?.profileImage || null : null);
    setCoverImagePreview(currentProfile?.coverImage !== 'USE_PLACEHOLDER' ? currentProfile?.coverImage || null : null);
    
    // Clear messages
    setError(null);
    setSuccess(null);
    
    // Call cancel callback if provided
    if (onCancel) {
      onCancel();
    }
  };

  if (loading) {
    return (
      <div className="artisan-profile-container">
        <div className="profile-loading">
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="artisan-profile-container">

      <form onSubmit={handleSave} className="profile-form">
        {/* Display Name */}
        <div className="form-group">
          <label htmlFor="displayName" className="form-label">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter your display name"
            required
          />
        </div>

        {/* Bio */}
        <div className="form-group form-group-full-width">
          <label htmlFor="bio" className="form-label">
            My Story
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            className="form-textarea"
            placeholder="Tell your story as an artisan..."
            rows={6}
            required
          />
        </div>

        {/* Profile Photo */}
        <div className="form-group">
          <label className="form-label">Profile Photo</label>
          <div className="image-upload-section">
            {profileImagePreview ? (
              <div className="image-preview">
                <img 
                  src={profileImagePreview} 
                  alt="Profile preview" 
                  className="preview-image profile-preview"
                />
              </div>
            ) : (
              <div className="image-placeholder profile-placeholder">
                <p>Upload Profile Photo</p>
                <p className="placeholder-subtitle">Click to browse</p>
              </div>
            )}
            <div className="upload-controls">
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="file-input"
              />
              <label htmlFor="profileImage" className="upload-button">
                {uploadingProfileImage ? 'Uploading...' : 'Upload Photo'}
              </label>
            </div>
          </div>
        </div>

        {/* Cover Photo */}
        <div className="form-group">
          <label className="form-label">Cover Photo</label>
          <div className="image-upload-section">
            {coverImagePreview ? (
              <div className="image-preview">
                <img 
                  src={coverImagePreview} 
                  alt="Cover preview" 
                  className="preview-image cover-preview"
                />
              </div>
            ) : (
              <div className="image-placeholder cover-placeholder">
                <p>Upload Cover Photo</p>
                <p className="placeholder-subtitle">Click to browse</p>
              </div>
            )}
            <div className="upload-controls">
              <input
                type="file"
                id="coverImage"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="file-input"
              />
              <label htmlFor="coverImage" className="upload-button">
                {uploadingCoverImage ? 'Uploading...' : 'Upload Photo'}
              </label>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="message error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="message success-message">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="cancel-button"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="save-button"
            disabled={saving || uploadingProfileImage || uploadingCoverImage}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArtisanProfile; 
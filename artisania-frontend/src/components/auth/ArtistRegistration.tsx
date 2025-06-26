import React, { useState } from 'react';
import { registerArtisan } from '../../services/artisanService';
import './ArtistRegistration.css';

interface ArtistRegistrationProps {
  onBackToHome?: () => void;
  onRegistrationSuccess?: () => void;
}

interface ArtistRegistrationData {
  // User account fields
  email: string;
  password: string;
  confirmPassword: string;
  
  // Artisan profile fields
  displayName: string;
  bio: string;
  profileImage: File | null;
  coverImage: File | null;
  
  // Terms acceptance
  acceptTerms: boolean;
  acceptArtisanAgreement: boolean;
}

const ArtistRegistration: React.FC<ArtistRegistrationProps> = ({
  onBackToHome,
  onRegistrationSuccess
}) => {
  const [formData, setFormData] = useState<ArtistRegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    bio: '',
    profileImage: null,
    coverImage: null,
    acceptTerms: false,
    acceptArtisanAgreement: false
  });

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'profileImage' | 'coverImage') => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters';
    } else if (formData.bio.length > 500) {
      newErrors.bio = 'Bio cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    if (!formData.acceptArtisanAgreement) {
      newErrors.acceptArtisanAgreement = 'You must accept the artisan agreement';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid && currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
    } else if (isValid && currentStep === 3) {
      handleSubmit();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsSubmitting(true);
    setErrors({}); // Clear previous errors
    
    try {
      // Call the real registerArtisan API
      const response = await registerArtisan({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        bio: formData.bio,
        profileImage: formData.profileImage || undefined,
        coverImage: formData.coverImage || undefined
      });

      // Store JWT token and user info for immediate login
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_info', JSON.stringify({
          id: response.user?.id,
          email: response.user?.email,
          role: response.user?.role,
          artisanId: response.artisanProfile?.id,
          displayName: response.artisanProfile?.displayName
        }));
      }

      // Show success message
      alert(`Welcome to Artisania, ${formData.displayName}! Your artisan profile has been created successfully.`);
      
      // Navigate based on provided callbacks
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      } else if (onBackToHome) {
        onBackToHome();
      }
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle specific validation errors
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        if (errorMessage.includes('email')) {
          setErrors({ email: 'This email is already registered' });
          setCurrentStep(1); // Go back to step 1
        } else if (errorMessage.includes('password')) {
          setErrors({ password: 'Password does not meet requirements' });
          setCurrentStep(1); // Go back to step 1
        } else if (errorMessage.includes('displayName')) {
          setErrors({ displayName: 'This display name is already taken' });
          setCurrentStep(2); // Go back to step 2
        } else {
          alert(`Registration failed: ${errorMessage}`);
        }
      } else {
        alert('Registration failed. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="registration-step">
      <h3 className="step-title">Account Information</h3>
      <p className="step-description">Create your account to get started</p>

      <div className="form-group">
        <label className="form-label">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="Enter your email address"
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className={`form-input ${errors.password ? 'error' : ''}`}
          placeholder="Create a strong password"
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="registration-step">
      <h3 className="step-title">Artisan Profile</h3>
      <p className="step-description">Tell us about yourself and your craft</p>

      <div className="form-group">
        <label className="form-label">Display Name</label>
        <input
          type="text"
          name="displayName"
          value={formData.displayName}
          onChange={handleInputChange}
          className={`form-input ${errors.displayName ? 'error' : ''}`}
          placeholder="Your artisan name (e.g., Aisha Ben Youssef)"
        />
        {errors.displayName && <span className="error-message">{errors.displayName}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          className={`form-textarea ${errors.bio ? 'error' : ''}`}
          placeholder="Tell us about your craft, experience, and what makes your work unique..."
          rows={5}
        />
        <div className="character-count">
          {formData.bio.length}/500 characters
        </div>
        {errors.bio && <span className="error-message">{errors.bio}</span>}
      </div>

      <div className="image-uploads">
        <div className="form-group">
          <label className="form-label">Profile Image (Optional)</label>
          <div className="file-upload">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'profileImage')}
              className="file-input"
              id="profile-image"
            />
            <label htmlFor="profile-image" className="file-upload-label">
              {formData.profileImage ? formData.profileImage.name : 'Choose profile image'}
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Cover Image (Optional)</label>
          <div className="file-upload">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'coverImage')}
              className="file-input"
              id="cover-image"
            />
            <label htmlFor="cover-image" className="file-upload-label">
              {formData.coverImage ? formData.coverImage.name : 'Choose cover image'}
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="registration-step">
      <h3 className="step-title">Terms & Agreements</h3>
      <p className="step-description">Please review and accept our terms</p>

      <div className="terms-section">
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
              className="checkbox-input"
            />
            <span className="checkbox-text">
              I accept the <a href="#" className="terms-link">Terms & Conditions</a>
            </span>
          </label>
          {errors.acceptTerms && <span className="error-message">{errors.acceptTerms}</span>}
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="acceptArtisanAgreement"
              checked={formData.acceptArtisanAgreement}
              onChange={handleInputChange}
              className="checkbox-input"
            />
            <span className="checkbox-text">
              I accept the <a href="#" className="terms-link">Artisan Agreement</a> and understand my responsibilities
            </span>
          </label>
          {errors.acceptArtisanAgreement && <span className="error-message">{errors.acceptArtisanAgreement}</span>}
        </div>
      </div>

      <div className="summary-section">
        <h4>Registration Summary:</h4>
        <div className="summary-item">
          <strong>Email:</strong> {formData.email}
        </div>
        <div className="summary-item">
          <strong>Display Name:</strong> {formData.displayName}
        </div>
        <div className="summary-item">
          <strong>Profile Image:</strong> {formData.profileImage ? 'Uploaded' : 'Not provided'}
        </div>
        <div className="summary-item">
          <strong>Cover Image:</strong> {formData.coverImage ? 'Uploaded' : 'Not provided'}
        </div>
      </div>
    </div>
  );

  return (
    <div className="artist-registration">
      <div className="registration-container">
        <div className="registration-header">
          <h1 className="registration-title">Become an Artisan</h1>
          <p className="registration-subtitle">
            Join our community and showcase your beautiful crafts to the world
          </p>
          
          <div className="progress-steps">
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Account</span>
            </div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Profile</span>
            </div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Terms</span>
            </div>
          </div>
        </div>

        <div className="registration-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <div className="registration-actions">
          <div className="action-buttons">
            {currentStep > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePreviousStep}
                disabled={isSubmitting}
              >
                Previous
              </button>
            )}
            
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextStep}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : currentStep === 3 ? 'Create Account' : 'Next'}
            </button>
          </div>

          <div className="back-to-home">
            <button
              type="button"
              className="link-button"
              onClick={onBackToHome}
              disabled={isSubmitting}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistRegistration; 
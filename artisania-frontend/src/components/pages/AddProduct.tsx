import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/AuthContext';
import { createProduct } from '../../services/productService';
import { fetchAllCategoriesWithCache } from '../../services/categoryService';
import { uploadMultipleProductImages } from '../../services/productImageService';
import type { CreateProductRequest, BackendCategory } from '../../types/api';

import './AddProduct.css';

interface AddProductProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ImageUpload {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
}

const AddProduct: React.FC<AddProductProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    categoryId: 0,
    isFeatured: false
  });

  // Form validation state
  const [errors, setErrors] = useState<Partial<CreateProductRequest>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CreateProductRequest, boolean>>>({});

  // Multiple image upload state
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const fetchedCategories = await fetchAllCategoriesWithCache();
        setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Form validation
  const validateField = (name: keyof CreateProductRequest, value: any): string | null => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length === 0) {
          return 'Product name is required';
        }
        if (value.length > 200) {
          return 'Product name must not exceed 200 characters';
        }
        return null;
      
      case 'description':
        if (value && value.length > 2000) {
          return 'Description must not exceed 2000 characters';
        }
        return null;
      
      case 'price':
        const priceNum = Number(value);
        if (isNaN(priceNum) || priceNum <= 0) {
          return 'Price must be greater than 0';
        }
        return null;
      
      case 'stockQuantity':
        const stockNum = Number(value);
        if (isNaN(stockNum) || stockNum < 0) {
          return 'Stock quantity cannot be negative';
        }
        return null;
      
      case 'categoryId':
        const categoryNum = Number(value);
        if (isNaN(categoryNum) || categoryNum <= 0) {
          return 'Please select a category';
        }
        return null;
      
      default:
        return null;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateProductRequest> = {};
    let isValid = true;

    // Validate all required fields
    Object.keys(formData).forEach((key) => {
      const fieldName = key as keyof CreateProductRequest;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error as any;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof CreateProductRequest;
    
    // Convert to appropriate type
    let processedValue: any = value;
    if (fieldName === 'price' || fieldName === 'stockQuantity' || fieldName === 'categoryId') {
      processedValue = value === '' ? 0 : Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [fieldName]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }));
    }
  };

  // Handle field blur for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    const fieldName = name as keyof CreateProductRequest;
    
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));

    const error = validateField(fieldName, formData[fieldName]);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: error as any
      }));
    }
  };

  // Handle multiple image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      setError('Only image files are allowed');
      return;
    }
    
    processFiles(imageFiles);
  };

  // Process selected files
  const processFiles = (files: File[]) => {
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Validate image type
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files');
        continue;
      }

      // Validate image size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError(`Image "${file.name}" exceeds the 5MB size limit`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Check total image limit (max 5 images)
    if (images.length + validFiles.length > 5) {
      setError('You can upload a maximum of 5 images per product');
      return;
    }

    // Create image previews
    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ImageUpload = {
          id: `img_${Date.now()}_${index}`,
          file,
          preview: e.target?.result as string,
          isPrimary: images.length === 0 && index === 0 // First image is primary by default
        };

        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  // Remove image
  const handleRemoveImage = (imageId: string) => {
    setImages(prev => {
      const updatedImages = prev.filter(img => img.id !== imageId);
      
      // If removed image was primary and there are other images, make the first one primary
      const removedImage = prev.find(img => img.id === imageId);
      if (removedImage?.isPrimary && updatedImages.length > 0) {
        updatedImages[0].isPrimary = true;
      }
      
      return updatedImages;
    });
  };

  // Set primary image
  const handleSetPrimary = (imageId: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    })));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the form errors before submitting');
      return;
    }

    if (!user) {
      setError('You must be logged in to create products');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const productData: CreateProductRequest = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity),
        categoryId: Number(formData.categoryId),
        isFeatured: formData.isFeatured || false
      };

      // First create the product
      const createdProduct = await createProduct(productData);
      console.log('Product created successfully:', createdProduct);
      
      // Then upload images if any
      if (images.length > 0) {
        const files = images.map(img => img.file);
        const primaryIndex = images.findIndex(img => img.isPrimary);
        
        try {
          const uploadResult = await uploadMultipleProductImages(
            createdProduct.id,
            files,
            primaryIndex >= 0 ? primaryIndex : 0
          );
          console.log('Images uploaded successfully:', uploadResult);
        } catch (imageError) {
          console.warn('Product created but image upload failed:', imageError);
          // Don't fail the entire operation if image upload fails
        }
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 0,
        stockQuantity: 0,
        categoryId: 0,
        isFeatured: false
      });
      
      setImages([]);
      setTouched({});
      setErrors({});

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error creating product:', error);
      setError(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      categoryId: 0,
      isFeatured: false
    });
    setImages([]);
    setErrors({});
    setTouched({});
    setError(null);

    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="add-product-container">

      {error && (
        <div className="add-product-error">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-product-form">
        {/* Product Name */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Enter product name"
            className={`form-input ${errors.name ? 'form-input-error' : ''}`}
            disabled={isLoading}
          />
          {errors.name && touched.name && (
            <span className="form-error">{errors.name}</span>
          )}
        </div>

        {/* Description */}
        <div className="form-group form-group-full-width">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Enter product description"
            rows={4}
            className={`form-textarea ${errors.description ? 'form-input-error' : ''}`}
            disabled={isLoading}
          />
          {errors.description && touched.description && (
            <span className="form-error">{errors.description}</span>
          )}
        </div>

        {/* Price */}
        <div className="form-group">
          <label htmlFor="price" className="form-label">
            Price (USD) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Enter product price"
            min="0"
            step="0.01"
            className={`form-input ${errors.price ? 'form-input-error' : ''}`}
            disabled={isLoading}
          />
          {errors.price && touched.price && (
            <span className="form-error">{errors.price}</span>
          )}
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="categoryId" className="form-label">
            Category *
          </label>
          {isLoadingCategories ? (
            <div className="form-loading">Loading categories...</div>
          ) : (
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`form-select ${errors.categoryId ? 'form-input-error' : ''}`}
              disabled={isLoading}
            >
              <option value={0}>Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
          {errors.categoryId && touched.categoryId && (
            <span className="form-error">{errors.categoryId}</span>
          )}
        </div>

        {/* Stock Quantity */}
        <div className="form-group">
          <label htmlFor="stockQuantity" className="form-label">
            Stock Quantity *
          </label>
          <input
            type="number"
            id="stockQuantity"
            name="stockQuantity"
            value={formData.stockQuantity || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Enter stock quantity"
            min="0"
            className={`form-input ${errors.stockQuantity ? 'form-input-error' : ''}`}
            disabled={isLoading}
          />
          {errors.stockQuantity && touched.stockQuantity && (
            <span className="form-error">{errors.stockQuantity}</span>
          )}
        </div>

        {/* Multiple Images Upload */}
        <div className="form-group form-group-full-width">
          <label className="form-label">
            Product Images
            <span className="form-label-hint">
              (Upload up to 5 images. First image will be the primary image)
            </span>
          </label>
          
          {/* Image Upload Dropzone */}
          <div 
            className={`image-upload-dropzone ${isDragOver ? 'drag-over' : ''} ${images.length >= 5 ? 'disabled' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="image-upload-content">
              <h3 className="image-upload-title">
                {images.length >= 5 ? 'Maximum images reached' : 'Upload Product Images'}
              </h3>
              <p className="image-upload-description">
                {images.length >= 5 
                  ? 'You can upload a maximum of 5 images' 
                  : 'Drag and drop images here or click to upload'
                }
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="image-upload-input"
              disabled={isLoading || images.length >= 5}
            />
            {images.length < 5 && (
              <button type="button" className="image-upload-btn" disabled={isLoading}>
                Upload Images
              </button>
            )}
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="image-previews-container">
              <div className="image-previews-header">
                <h4>Uploaded Images ({images.length}/5)</h4>
                <p className="image-previews-hint">
                  Click "Set as Primary" to choose the main product image
                </p>
              </div>
              <div className="image-previews-grid">
                {images.map((image) => (
                  <div 
                    key={image.id} 
                    className={`image-preview-item ${image.isPrimary ? 'primary' : ''}`}
                  >
                    <div className="image-preview-container">
                      <img 
                        src={image.preview} 
                        alt="Product preview" 
                        className="image-preview" 
                      />
                      {image.isPrimary && (
                        <div className="primary-badge">Primary</div>
                      )}
                    </div>
                    <div className="image-preview-actions">
                      {!image.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(image.id)}
                          className="btn-set-primary"
                          disabled={isLoading}
                        >
                          Set as Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(image.id)}
                        className="btn-remove-image"
                        disabled={isLoading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || isLoadingCategories}
          >
            {isLoading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct; 
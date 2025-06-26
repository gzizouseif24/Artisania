import { getAuthHeaders } from './authService';

const API_BASE_URL = 'http://localhost:8080/api';

export interface ProductImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface UploadImageResponse {
  success: boolean;
  message: string;
  imageId?: number;
  imageUrl?: string;
  fileName?: string;
  isPrimary?: boolean;
}

export interface UploadMultipleImagesResponse {
  success: boolean;
  message: string;
  uploadedCount?: number;
  images?: ProductImage[];
  fileNames?: string[];
}

export interface ProductImageServiceError extends Error {
  status?: number;
  response?: any;
}

// Upload single image for a product
export const uploadProductImage = async (
  productId: number,
  file: File,
  isPrimary: boolean = false
): Promise<UploadImageResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', isPrimary.toString());

    const response = await fetch(`${API_BASE_URL}/product-images/upload/${productId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to upload image';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      const error = new Error(errorMessage) as ProductImageServiceError;
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading product image:', error);
    throw error;
  }
};

// Upload multiple images for a product
export const uploadMultipleProductImages = async (
  productId: number,
  files: File[],
  primaryIndex: number = 0
): Promise<UploadMultipleImagesResponse> => {
  try {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('primaryIndex', primaryIndex.toString());

    const response = await fetch(`${API_BASE_URL}/product-images/upload/${productId}/multiple`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to upload images';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      const error = new Error(errorMessage) as ProductImageServiceError;
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading multiple product images:', error);
    throw error;
  }
};

// Get all images for a product
export const getProductImages = async (productId: number): Promise<ProductImage[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/product-images/product/${productId}`);

    if (!response.ok) {
      const error = new Error('Failed to fetch product images') as ProductImageServiceError;
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching product images:', error);
    throw error;
  }
};

// Get primary image for a product
export const getPrimaryProductImage = async (productId: number): Promise<ProductImage | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/product-images/product/${productId}/primary`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No primary image found
      }
      const error = new Error('Failed to fetch primary image') as ProductImageServiceError;
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching primary product image:', error);
    throw error;
  }
};

// Set an image as primary
export const setPrimaryImage = async (imageId: number): Promise<ProductImage> => {
  try {
    const response = await fetch(`${API_BASE_URL}/product-images/${imageId}/primary`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = new Error('Failed to set primary image') as ProductImageServiceError;
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error setting primary image:', error);
    throw error;
  }
};

// Delete a product image
export const deleteProductImage = async (imageId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/product-images/${imageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = new Error('Failed to delete image') as ProductImageServiceError;
      error.status = response.status;
      throw error;
    }
  } catch (error) {
    console.error('Error deleting product image:', error);
    throw error;
  }
};

// Replace an existing image
export const replaceProductImage = async (
  imageId: number,
  file: File
): Promise<UploadImageResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/product-images/upload/${imageId}/replace`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to replace image';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      const error = new Error(errorMessage) as ProductImageServiceError;
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error replacing product image:', error);
    throw error;
  }
};

// Count images for a product
export const countProductImages = async (productId: number): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/product-images/product/${productId}/count`);

    if (!response.ok) {
      const error = new Error('Failed to count product images') as ProductImageServiceError;
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error counting product images:', error);
    throw error;
  }
}; 
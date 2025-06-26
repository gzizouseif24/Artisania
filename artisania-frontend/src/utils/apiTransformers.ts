// API Data Transformers
// Utility functions to convert backend API responses to frontend-compatible types

import type { 
  BackendProduct, 
  BackendArtisanProfile, 
  FrontendProduct, 
  FrontendArtisan,
  TransformationContext,
  BackendCartItem
} from '../types/api';

// =============================================
// TRANSFORMATION CONTEXT
// =============================================

const defaultTransformContext: TransformationContext = {
  baseImageUrl: '',
  fallbackImages: {
    product: 'USE_PLACEHOLDER',
    artisan: 'USE_PLACEHOLDER'
  }
};

// =============================================
// PRODUCT TRANSFORMERS
// =============================================

/**
 * Transform backend product to frontend product
 */
export const transformBackendProduct = (
  backendProduct: BackendProduct,
  _context: TransformationContext = defaultTransformContext
): FrontendProduct => {
  // Helper function to fix image URLs by adding the missing 'products' category and base URL
  const fixImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return 'USE_PLACEHOLDER';
    
    // If it's already a placeholder, keep it
    if (imageUrl === 'USE_PLACEHOLDER') return imageUrl;
    
    // Fix backend URLs that are missing the 'products' category
    if (imageUrl.startsWith('/api/files/images/') && !imageUrl.includes('/products/')) {
      // Extract filename from URL like '/api/files/images/products_20250611_034223_37fc7b4a.jpg'
      const filename = imageUrl.replace('/api/files/images/', '');
      // Return full URL with base domain
      return `http://localhost:8080/api/files/images/products/${filename}`;
    }
    
    // If it's already a relative API URL, add the base domain
    if (imageUrl.startsWith('/api/')) {
      return `http://localhost:8080${imageUrl}`;
    }
    
    return imageUrl;
  };

  // Transform product images from backend to frontend structure
  let finalImages;
  
  // Fallback image URL - could be hosted on a CDN or local asset
  const fallbackImageUrl = '/api/placeholder/product-image.jpg';
  
  if (backendProduct.productImages && backendProduct.productImages.length > 0) {
    // Use backend images if available
    const primaryImage = backendProduct.productImages.find(img => img.isPrimary);
    const galleryImages = backendProduct.productImages.filter(img => !img.isPrimary);
    
    finalImages = {
      main: fixImageUrl(primaryImage?.imageUrl || fallbackImageUrl),
      gallery: galleryImages.map(img => fixImageUrl(img.imageUrl)).slice(0, 3),
      thumbnail: fixImageUrl(primaryImage?.imageUrl || fallbackImageUrl),
      alt: {
        main: primaryImage?.altText || `${backendProduct.name} main view`,
        view1: galleryImages[0]?.altText as string | undefined,
        view2: galleryImages[1]?.altText as string | undefined,
        view3: galleryImages[2]?.altText as string | undefined
      }
    };
  } else {
    // Use fallback image when no backend images are available
    finalImages = {
      main: fallbackImageUrl,
      gallery: [fallbackImageUrl],
      thumbnail: fallbackImageUrl,
      alt: {
        main: `${backendProduct.name} - image coming soon`,
        view1: undefined,
        view2: undefined,
        view3: undefined
      }
    };
  }

  return {
    id: backendProduct.id,
    name: backendProduct.name,
    price: backendProduct.price,
    priceFormatted: `$${backendProduct.price.toFixed(2)}`,
    artisan: backendProduct.artisan.displayName,
    artisanId: backendProduct.artisan.id,
    category: backendProduct.category.name,
    categoryId: backendProduct.category.id,
    description: backendProduct.description || '',
    inStock: backendProduct.stockQuantity > 0,
    stockCount: backendProduct.stockQuantity,
    featured: backendProduct.isFeatured,
    createdAt: backendProduct.createdAt,
    updatedAt: backendProduct.updatedAt,
    images: finalImages,
    hasRealImages: (backendProduct.productImages && backendProduct.productImages.length > 0),
    // Additional frontend-only fields (to be populated from other sources if available)
    materials: [], // Could be added to backend later
    dimensions: undefined,
    weight: undefined,
    rating: undefined,
    reviewCount: undefined
  };
};



/**
 * Transform array of backend products to frontend products
 */
export const transformBackendProducts = (
  backendProducts: BackendProduct[],
  _context: TransformationContext = defaultTransformContext
): FrontendProduct[] => {
  return backendProducts.map(product => transformBackendProduct(product, _context));
};

// =============================================
// ARTISAN TRANSFORMERS
// =============================================

/**
 * Transform backend artisan profile to frontend artisan
 */
export const transformBackendArtisan = (
  backendArtisan: BackendArtisanProfile,
  _context: TransformationContext = defaultTransformContext
): FrontendArtisan => {
  // Function to construct full image URL
  const constructImageUrl = (imageUrl: string | null | undefined): string => {
    if (!imageUrl) return 'USE_PLACEHOLDER';
    
    // If it's already a full URL, use it as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative URL starting with /api, construct full URL
    if (imageUrl.startsWith('/api/')) {
      const fullUrl = `http://localhost:8080${imageUrl}`;
      return fullUrl;
    }
    
    // If it's just a filename or other relative path, assume it's invalid
    console.warn(`Invalid image URL format: ${imageUrl}`);
    return 'USE_PLACEHOLDER';
  };

  // Use backend image URLs if available, otherwise use placeholder
  const finalProfileImage = backendArtisan.profileImageUrl 
    ? constructImageUrl(backendArtisan.profileImageUrl)
    : 'USE_PLACEHOLDER';
  const finalCoverImage = backendArtisan.coverImageUrl 
    ? constructImageUrl(backendArtisan.coverImageUrl)
    : 'USE_PLACEHOLDER';



  return {
    id: backendArtisan.id,
    displayName: backendArtisan.displayName,
    bio: backendArtisan.bio,
    profileImage: finalProfileImage,
    coverImage: finalCoverImage,
    hasRealProfileImage: !!backendArtisan.profileImageUrl && backendArtisan.profileImageUrl !== 'USE_PLACEHOLDER',
    hasRealCoverImage: !!backendArtisan.coverImageUrl && backendArtisan.coverImageUrl !== 'USE_PLACEHOLDER',
    productCount: 0, // Will be populated separately
    createdAt: backendArtisan.createdAt,
    updatedAt: backendArtisan.updatedAt,
    user: {
      id: backendArtisan.user.id,
      email: backendArtisan.user.email,
      firstName: backendArtisan.user.firstName,
      lastName: backendArtisan.user.lastName
    }
  };
};

/**
 * Transform array of backend artisans to frontend artisans
 */
export const transformBackendArtisans = (
  backendArtisans: BackendArtisanProfile[],
  _context: TransformationContext = defaultTransformContext
): FrontendArtisan[] => {
  return backendArtisans.map(artisan => transformBackendArtisan(artisan, _context));
};

// =============================================
// PRICE FORMATTING UTILITIES
// =============================================

/**
 * Format price consistently across the application
 */
export const formatPrice = (price: number, currency: string = '$'): string => {
  return `${currency}${price.toFixed(2)}`;
};

/**
 * Parse price from formatted string
 */
export const parsePrice = (formattedPrice: string): number => {
  const numericString = formattedPrice.replace(/[^0-9.]/g, '');
  return parseFloat(numericString) || 0;
};

// =============================================
// IMAGE URL UTILITIES
// =============================================

/**
 * Resolve image URL - handles both backend URLs and placeholder system
 */
export const resolveImageUrl = (
  imageUrl: string | undefined, 
  fallbackUrl: string,
  baseUrl?: string
): string => {
  if (!imageUrl) return fallbackUrl;
  if (imageUrl === 'USE_PLACEHOLDER') return fallbackUrl;
  if (imageUrl.startsWith('http')) return imageUrl;
  if (baseUrl) return `${baseUrl}/${imageUrl}`;
  return imageUrl;
};

/**
 * Check if image URL is a placeholder
 */
export const isPlaceholderImage = (imageUrl: string): boolean => {
  return imageUrl === 'USE_PLACEHOLDER' || imageUrl.includes('placeholder');
};

// =============================================
// DATE UTILITIES
// =============================================

/**
 * Format ISO date string to human-readable format
 */
export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format ISO date string to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(isoString);
};

// =============================================
// VALIDATION UTILITIES
// =============================================

/**
 * Validate that backend product has required fields
 */
export const validateBackendProduct = (product: any): product is BackendProduct => {
  return (
    product &&
    typeof product.id === 'number' &&
    typeof product.name === 'string' &&
    typeof product.price === 'number' &&
    typeof product.stockQuantity === 'number' &&
    typeof product.isFeatured === 'boolean' &&
    product.artisan &&
    product.category
  );
};

/**
 * Validate that backend artisan has required fields
 */
export const validateBackendArtisan = (artisan: any): artisan is BackendArtisanProfile => {
  const isValid = (
    artisan &&
    typeof artisan.id === 'number' &&
    typeof artisan.displayName === 'string' &&
    typeof artisan.bio === 'string' &&
    artisan.user
  );
  
  if (!isValid) {
    console.warn('Invalid artisan data:', {
      artisan,
      hasArtisan: !!artisan,
      id: artisan?.id,
      idType: typeof artisan?.id,
      displayName: artisan?.displayName,
      displayNameType: typeof artisan?.displayName,
      bio: artisan?.bio,
      bioType: typeof artisan?.bio,
      hasUser: !!artisan?.user
    });
  } else {
    console.log('Valid artisan data:', {
      id: artisan.id,
      displayName: artisan.displayName,
      bio: artisan.bio
    });
  }
  
  return isValid;
};

// =============================================
// ERROR TRANSFORMATION
// =============================================

/**
 * Transform API error to user-friendly message
 */
export const transformApiError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  if (error?.status === 404) {
    return 'The requested resource was not found.';
  }
  if (error?.status === 403) {
    return 'You do not have permission to access this resource.';
  }
  if (error?.status === 401) {
    return 'Please log in to access this feature.';
  }
  if (error?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  return 'An unexpected error occurred. Please try again.';
};

// =============================================
// CART TRANSFORMERS
// =============================================

/**
 * Frontend CartItem interface (transformed from backend)
 */
export interface FrontendCartItem {
  id: number;
  user: {
    id: number;
    email: string;
  };
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
    images: {
      main: string;
      gallery: string[];
      thumbnail: string;
      alt: {
        main: string;
        view1?: string;
        view2?: string;
        view3?: string;
      };
    };
    artisan: string;
    artisanId: number;
    category: string;
    categoryId: number;
    inStock: boolean;
    stockCount: number;
  };
  quantity: number;
  priceAtTime: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform backend cart item to frontend cart item
 */
export const transformBackendCartItem = (
  backendCartItem: BackendCartItem,
  _context: TransformationContext = defaultTransformContext
): FrontendCartItem => {
  const transformedProduct = transformBackendProduct(backendCartItem.product, _context);
  
  return {
    id: backendCartItem.id,
    user: {
      id: backendCartItem.user.id,
      email: backendCartItem.user.email,
    },
    product: {
      id: transformedProduct.id,
      name: transformedProduct.name,
      price: transformedProduct.price,
      description: transformedProduct.description,
      images: transformedProduct.images,
      artisan: transformedProduct.artisan,
      artisanId: transformedProduct.artisanId,
      category: transformedProduct.category,
      categoryId: transformedProduct.categoryId,
      inStock: transformedProduct.inStock,
      stockCount: transformedProduct.stockCount,
    },
    quantity: backendCartItem.quantity,
    priceAtTime: backendCartItem.priceAtTime,
    totalPrice: backendCartItem.priceAtTime * backendCartItem.quantity,
    createdAt: backendCartItem.createdAt,
    updatedAt: backendCartItem.updatedAt,
  };
};

/**
 * Transform array of backend cart items to frontend cart items
 */
export const transformBackendCartItems = (
  backendCartItems: BackendCartItem[],
  _context: TransformationContext = defaultTransformContext
): FrontendCartItem[] => {
  return backendCartItems.map(cartItem => transformBackendCartItem(cartItem, _context));
};

export default {
  transformBackendProduct,
  transformBackendProducts,
  transformBackendArtisan,
  transformBackendArtisans,
  formatPrice,
  parsePrice,
  resolveImageUrl,
  isPlaceholderImage,
  formatDate,
  formatRelativeTime,
  validateBackendProduct,
  validateBackendArtisan,
  transformApiError,
  transformBackendCartItem,
  transformBackendCartItems
}; 
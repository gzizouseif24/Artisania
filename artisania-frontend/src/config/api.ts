// API Configuration
// Centralized configuration for all API services and endpoints

// =============================================
// BASE CONFIGURATION
// =============================================

export const API_CONFIG = {
  // Base URL for backend API
  BASE_URL: (window as any).REACT_APP_API_BASE_URL || 'http://localhost:8080',
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
  
  // Retry configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  
  // Cache configuration
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
  CACHE_MAX_SIZE: 100,
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
} as const;

// =============================================
// API ENDPOINTS
// =============================================

export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER_CUSTOMER: '/auth/register-customer',
    REGISTER_ARTISAN: '/auth/register-artisan',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
    CHECK_EMAIL: '/auth/check-email',
  },
  
  // Public endpoints (no auth required)
  PUBLIC: {
    PRODUCTS: '/api/public/products',
    PRODUCT_BY_ID: (id: number) => `/api/public/products/${id}`,
    PRODUCTS_BY_CATEGORY: (categoryId: number) => `/api/public/products/category/${categoryId}`,
    PRODUCTS_BY_ARTISAN: (artisanId: number) => `/api/public/products/artisan/${artisanId}`,
    FEATURED_PRODUCTS: '/api/public/products/featured',
    SEARCH_PRODUCTS: '/api/public/products/search',
    
    ARTISANS: '/api/public/artisans',
    ARTISAN_BY_ID: (id: number) => `/api/public/artisans/${id}`,
    SEARCH_ARTISANS: '/api/public/artisans/search',
    
    CATEGORIES: '/api/categories',
    CATEGORY_BY_ID: (id: number) => `/api/categories/${id}`,
    SEARCH_CATEGORIES: '/api/categories/search',
  },
  
  // User endpoints (auth required)
  USER: {
    PROFILE: '/api/user/profile',
    ARTISAN_PROFILE: '/api/user/artisan-profile',
    UPDATE_PROFILE: '/api/user/profile',
    UPDATE_ARTISAN_PROFILE: '/api/user/artisan-profile',
    UPLOAD_PROFILE_IMAGE: '/api/user/artisan-profile/profile-image',
    UPLOAD_COVER_IMAGE: '/api/user/artisan-profile/cover-image',
    
    ORDERS: '/api/user/orders',
    ORDER_BY_ID: (id: number) => `/api/user/orders/${id}`,
    
    CART: '/api/user/cart',
    CART_ITEM: (id: number) => `/api/user/cart/${id}`,
  },
  
  // Admin endpoints (admin auth required)
  ADMIN: {
    ARTISANS: '/api/admin/artisans',
    ARTISAN_BY_ID: (id: number) => `/api/admin/artisans/${id}`,
    USERS: '/api/admin/users',
    USER_BY_ID: (id: number) => `/api/admin/users/${id}`,
    ORDERS: '/api/admin/orders',
    ORDER_BY_ID: (id: number) => `/api/admin/orders/${id}`,
    ANALYTICS: '/api/admin/analytics',
    REPORTS: '/api/admin/reports'
  },
} as const;

// =============================================
// HTTP HEADERS
// =============================================

export const API_HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  CONTENT_TYPE_FORM: 'multipart/form-data',
  ACCEPT_JSON: 'application/json',
} as const;

// =============================================
// STATUS CODES
// =============================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// =============================================
// ERROR MESSAGES
// =============================================

export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'Authentication required. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
} as const;

// =============================================
// LOCAL STORAGE KEYS
// =============================================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'jwt_token',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'user_info',
  CART_DATA: 'cart_data',
  FAVORITES: 'user_favorites',
  RECENT_SEARCHES: 'recent_searches',
  CACHE_PREFIX: 'api_cache_',
} as const;

// =============================================
// QUERY PARAMETER DEFAULTS
// =============================================

export const QUERY_DEFAULTS = {
  PAGE: 0,
  SIZE: API_CONFIG.DEFAULT_PAGE_SIZE,
  SORT: 'id,asc',
} as const;

// =============================================
// FILE UPLOAD CONFIGURATION
// =============================================

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as const,
} as const;

// =============================================
// VALIDATION PATTERNS
// =============================================

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  POSTAL_CODE: /^[\w\s\-]+$/,
} as const;

// =============================================
// ENVIRONMENT HELPERS
// =============================================

export const ENV = {
  isDevelopment: (window as any).NODE_ENV === 'development',
  isProduction: (window as any).NODE_ENV === 'production',
  isTest: (window as any).NODE_ENV === 'test',
} as const;

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Build full API URL from endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Build query string from parameters
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Check if endpoint requires authentication
 */
export const requiresAuth = (endpoint: string): boolean => {
  return endpoint.startsWith('/api/user') || endpoint.startsWith('/api/admin');
};

/**
 * Check if endpoint requires admin role
 */
export const requiresAdmin = (endpoint: string): boolean => {
  return endpoint.startsWith('/api/admin');
};

/**
 * Get appropriate error message for status code
 */
export const getErrorMessage = (status: number): string => {
  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return API_ERROR_MESSAGES.UNAUTHORIZED;
    case HTTP_STATUS.FORBIDDEN:
      return API_ERROR_MESSAGES.FORBIDDEN;
    case HTTP_STATUS.NOT_FOUND:
      return API_ERROR_MESSAGES.NOT_FOUND;
    case HTTP_STATUS.UNPROCESSABLE_ENTITY:
      return API_ERROR_MESSAGES.VALIDATION_ERROR;
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
    case HTTP_STATUS.BAD_GATEWAY:
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return API_ERROR_MESSAGES.SERVER_ERROR;
    default:
      return API_ERROR_MESSAGES.UNKNOWN_ERROR;
  }
};

/**
 * Validate file for upload
 */
export const validateUploadFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }
  
  if (!UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type must be one of: ${UPLOAD_CONFIG.ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
    };
  }
  
  return { valid: true };
};

export default API_CONFIG; 
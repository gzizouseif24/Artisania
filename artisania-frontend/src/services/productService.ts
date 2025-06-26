// Product Service
// Handles all product-related API operations

import type {
  BackendProduct,
  FrontendProduct,
  ProductQueryParams,
  PaginatedResponse,
  CreateProductRequest,
  UpdateProductRequest,
  AsyncApiState
} from '../types/api';
import { 
  transformBackendProduct, 
  transformBackendProducts,
  transformApiError,
  validateBackendProduct 
} from '../utils/apiTransformers';

// =============================================
// SERVICE CONFIGURATION
// =============================================

const API_BASE_URL = 'http://localhost:8080';
const PRODUCTS_ENDPOINT = '/api/products';


// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// =============================================
// HTTP CLIENT UTILITIES
// =============================================

/**
 * Generic HTTP request handler with error transformation
 */
const apiRequest = async <T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      throw {
        status: response.status,
        statusText: response.statusText,
        message: errorData || 'Request failed',
        timestamp: new Date().toISOString()
      };
    }

    // Check if response has content to parse
    // Some responses (like DELETE 204 No Content) have no body
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    if (contentLength === '0' || response.status === 204 || 
        (!contentType || !contentType.includes('application/json'))) {
      return undefined as T;
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw {
        status: 408,
        statusText: 'Request Timeout',
        message: 'Request timed out. Please try again.',
        timestamp: new Date().toISOString()
      };
    }
    
    throw error;
  }
};

/**
 * Get JWT token from localStorage for authenticated requests
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('jwt_token');
};

/**
 * Create headers for authenticated requests
 */
const createAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// =============================================
// QUERY PARAMETER UTILITIES
// =============================================

/**
 * Convert ProductQueryParams to URL search params
 */
const buildQueryString = (params: ProductQueryParams): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams.toString();
};

// =============================================
// PUBLIC PRODUCT API METHODS
// =============================================

/**
 * Fetch all products with optional filtering and pagination
 */
export const fetchProducts = async (
  params: ProductQueryParams = {}
): Promise<PaginatedResponse<FrontendProduct>> => {
  try {
    const queryString = buildQueryString(params);
    const url = `${PRODUCTS_ENDPOINT}${queryString ? `?${queryString}` : ''}`;
    
    // Backend returns List<Product> directly, not PaginatedResponse
    const response = await apiRequest<BackendProduct[]>(url);
    

    
    // Validate response structure - should be an array
    if (!Array.isArray(response)) {
      console.warn('Invalid response structure from products API:', response);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: params.size || 10,
        number: params.page || 0,
        first: true,
        last: true,
        empty: true
      };
    }
    
    // Validate and transform products
    const validProducts = response.filter(validateBackendProduct);
    const transformedProducts = transformBackendProducts(validProducts);
    
    // Convert array response to paginated response format for frontend compatibility
    const totalElements = transformedProducts.length;
    const pageSize = params.size || 10;
    const currentPage = params.page || 0;
    const totalPages = Math.ceil(totalElements / pageSize);
    
    // Apply client-side pagination if needed
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedContent = transformedProducts.slice(startIndex, endIndex);
    
    return {
      content: paginatedContent,
      totalElements,
      totalPages,
      size: pageSize,
      number: currentPage,
      first: currentPage === 0,
      last: currentPage >= totalPages - 1,
      empty: totalElements === 0
    };
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Fetch a single product by ID
 */
export const fetchProductById = async (id: number): Promise<FrontendProduct> => {
  try {
    const response = await apiRequest<BackendProduct>(`${PRODUCTS_ENDPOINT}/${id}`);
    
    // Log the response for debugging
    if (!validateBackendProduct(response)) {
      throw new Error('Invalid product data received from server');
    }
    
    const transformedProduct = transformBackendProduct(response);
    
    return transformedProduct;
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Fetch products by category ID
 */
export const fetchProductsByCategory = async (
  categoryId: number,
  params: Omit<ProductQueryParams, 'categoryId'> = {}
): Promise<PaginatedResponse<FrontendProduct>> => {
  try {
    // Use specific endpoint for category products
    const queryString = buildQueryString(params);
    const url = `${PRODUCTS_ENDPOINT}/category/${categoryId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<BackendProduct[]>(url);
    
    if (!Array.isArray(response)) {
      console.warn('Invalid response structure from category products API:', response);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: params.size || 10,
        number: params.page || 0,
        first: true,
        last: true,
        empty: true
      };
    }
    
    const validProducts = response.filter(validateBackendProduct);
    const transformedProducts = transformBackendProducts(validProducts);
    
    // Convert to paginated response format
    const totalElements = transformedProducts.length;
    const pageSize = params.size || 10;
    const currentPage = params.page || 0;
    const totalPages = Math.ceil(totalElements / pageSize);
    
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedContent = transformedProducts.slice(startIndex, endIndex);
    
    return {
      content: paginatedContent,
      totalElements,
      totalPages,
      size: pageSize,
      number: currentPage,
      first: currentPage === 0,
      last: currentPage >= totalPages - 1,
      empty: totalElements === 0
    };
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Fetch products by artisan ID
 */
export const fetchProductsByArtisan = async (
  artisanId: number,
  params: Omit<ProductQueryParams, 'artisanId'> = {}
): Promise<PaginatedResponse<FrontendProduct>> => {
  try {
    // Use specific endpoint for artisan products
    const queryString = buildQueryString(params);
    const url = `${PRODUCTS_ENDPOINT}/artisan/${artisanId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<BackendProduct[]>(url);
    
    if (!Array.isArray(response)) {
      console.warn('Invalid response structure from artisan products API:', response);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: params.size || 10,
        number: params.page || 0,
        first: true,
        last: true,
        empty: true
      };
    }
    
    const validProducts = response.filter(validateBackendProduct);
    const transformedProducts = transformBackendProducts(validProducts);
    
    // Convert to paginated response format
    const totalElements = transformedProducts.length;
    const pageSize = params.size || 10;
    const currentPage = params.page || 0;
    const totalPages = Math.ceil(totalElements / pageSize);
    
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedContent = transformedProducts.slice(startIndex, endIndex);
    
    return {
      content: paginatedContent,
      totalElements,
      totalPages,
      size: pageSize,
      number: currentPage,
      first: currentPage === 0,
      last: currentPage >= totalPages - 1,
      empty: totalElements === 0
    };
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Fetch featured products
 */
export const fetchFeaturedProducts = async (
  params: Omit<ProductQueryParams, 'featured'> = {}
): Promise<PaginatedResponse<FrontendProduct>> => {
  try {
    // Use specific endpoint for featured products
    const queryString = buildQueryString(params);
    const url = `${PRODUCTS_ENDPOINT}/featured${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<BackendProduct[]>(url);
    
    if (!Array.isArray(response)) {
      console.warn('Invalid response structure from featured products API:', response);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: params.size || 10,
        number: params.page || 0,
        first: true,
        last: true,
        empty: true
      };
    }
    
    const validProducts = response.filter(validateBackendProduct);
    const transformedProducts = transformBackendProducts(validProducts);
    
    // Convert to paginated response format
    const totalElements = transformedProducts.length;
    const pageSize = params.size || 10;
    const currentPage = params.page || 0;
    const totalPages = Math.ceil(totalElements / pageSize);
    
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedContent = transformedProducts.slice(startIndex, endIndex);
    
    return {
      content: paginatedContent,
      totalElements,
      totalPages,
      size: pageSize,
      number: currentPage,
      first: currentPage === 0,
      last: currentPage >= totalPages - 1,
      empty: totalElements === 0
    };
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Search products by name
 */
export const searchProducts = async (
  searchQuery: string,
  params: Omit<ProductQueryParams, 'name'> = {}
): Promise<PaginatedResponse<FrontendProduct>> => {
  if (!searchQuery.trim()) {
    return fetchProducts(params);
  }
  
  try {
    // Use specific search endpoint
    const queryString = buildQueryString(params);
    const searchParams = new URLSearchParams();
    searchParams.append('name', searchQuery.trim());
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          searchParams.append(key, value);
        }
      });
    }
    
    const url = `${PRODUCTS_ENDPOINT}/search?${searchParams.toString()}`;
    const response = await apiRequest<BackendProduct[]>(url);
    
    if (!Array.isArray(response)) {
      console.warn('Invalid response structure from search products API:', response);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: params.size || 10,
        number: params.page || 0,
        first: true,
        last: true,
        empty: true
      };
    }
    
    const validProducts = response.filter(validateBackendProduct);
    const transformedProducts = transformBackendProducts(validProducts);
    
    // Convert to paginated response format
    const totalElements = transformedProducts.length;
    const pageSize = params.size || 10;
    const currentPage = params.page || 0;
    const totalPages = Math.ceil(totalElements / pageSize);
    
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedContent = transformedProducts.slice(startIndex, endIndex);
    
    return {
      content: paginatedContent,
      totalElements,
      totalPages,
      size: pageSize,
      number: currentPage,
      first: currentPage === 0,
      last: currentPage >= totalPages - 1,
      empty: totalElements === 0
    };
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Fetch products with price filtering
 */
export const fetchProductsByPriceRange = async (
  minPrice: number,
  maxPrice: number,
  params: Omit<ProductQueryParams, 'minPrice' | 'maxPrice'> = {}
): Promise<PaginatedResponse<FrontendProduct>> => {
  return fetchProducts({ ...params, minPrice, maxPrice });
};

/**
 * Fetch only in-stock products
 */
export const fetchInStockProducts = async (
  params: Omit<ProductQueryParams, 'inStock'> = {}
): Promise<PaginatedResponse<FrontendProduct>> => {
  return fetchProducts({ ...params, inStock: true });
};

// =============================================
// AUTHENTICATED PRODUCT API METHODS
// =============================================

/**
 * Create a new product (requires authentication)
 */
export const createProduct = async (
  productData: CreateProductRequest
): Promise<FrontendProduct> => {
  try {
    const response = await apiRequest<BackendProduct>(PRODUCTS_ENDPOINT, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(productData)
    });
    
    if (!validateBackendProduct(response)) {
      throw new Error('Invalid product data received from server');
    }
    
    return transformBackendProduct(response);
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Update an existing product (requires authentication)
 */
export const updateProduct = async (
  id: number,
  productData: UpdateProductRequest
): Promise<FrontendProduct> => {
  try {
    const response = await apiRequest<BackendProduct>(`${PRODUCTS_ENDPOINT}/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(productData)
    });
    
    if (!validateBackendProduct(response)) {
      throw new Error('Invalid product data received from server');
    }
    
    return transformBackendProduct(response);
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Delete a product (requires authentication)
 */
export const deleteProduct = async (id: number): Promise<void> => {
  try {
    await apiRequest(`${PRODUCTS_ENDPOINT}/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders()
    });
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Fetch current user's products (requires authentication)
 */
export const fetchCurrentUserProducts = async (
  params: Omit<ProductQueryParams, 'artisanId'> = {}
): Promise<PaginatedResponse<FrontendProduct>> => {
  try {
    // First get the current user's artisan profile to get the artisan ID
    const artisanResponse = await apiRequest<any>('/api/user/artisan', {
      headers: createAuthHeaders()
    });
    
    if (!artisanResponse || !artisanResponse.id) {
      throw new Error('User does not have an artisan profile');
    }
    
    // Then fetch products by artisan ID
    return await fetchProductsByArtisan(artisanResponse.id, params);
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

// =============================================
// STATE MANAGEMENT UTILITIES
// =============================================

/**
 * Create initial async state for products
 */
export const createProductsState = <T>(): AsyncApiState<T> => ({
  data: null,
  isLoading: false,
  error: null,
  lastFetched: undefined
});

/**
 * Helper to handle loading state updates
 */
export const withLoadingState = async <T>(
  operation: () => Promise<T>,
  setState: (state: Partial<AsyncApiState<T>>) => void
): Promise<T> => {
  setState({ isLoading: true, error: null });
  
  try {
    const result = await operation();
    setState({ 
      data: result, 
      isLoading: false, 
      error: null, 
      lastFetched: new Date().toISOString() 
    });
    return result;
  } catch (error: any) {
    const apiError = {
      message: transformApiError(error),
      status: error.status || 500,
      statusText: error.statusText || 'Unknown Error',
      timestamp: new Date().toISOString()
    };
    setState({ isLoading: false, error: apiError });
    throw error;
  }
};

// =============================================
// CACHE UTILITIES
// =============================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Get cached data if still valid
 */
const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

/**
 * Set data in cache
 */
const setCachedData = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Fetch products with caching
 */
export const fetchProductsWithCache = async (
  params: ProductQueryParams = {}
): Promise<PaginatedResponse<FrontendProduct>> => {
  const cacheKey = `products_${JSON.stringify(params)}`;
  
  // Try to get from cache first
  const cached = getCachedData<PaginatedResponse<FrontendProduct>>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch fresh data
  const result = await fetchProducts(params);
  setCachedData(cacheKey, result);
  
  return result;
};

/**
 * Clear products cache
 */
export const clearProductsCache = (): void => {
  for (const key of cache.keys()) {
    if (key.startsWith('products_')) {
      cache.delete(key);
    }
  }
};

// =============================================
// EXPORT DEFAULT SERVICE
// =============================================

export default {
  // Public API
  fetchProducts,
  fetchProductById,
  fetchProductsByCategory,
  fetchProductsByArtisan,
  fetchFeaturedProducts,
  searchProducts,
  fetchProductsByPriceRange,
  fetchInStockProducts,
  
  // User API
  fetchCurrentUserProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  
  // State management
  createProductsState,
  withLoadingState,
  
  // Cache utilities
  fetchProductsWithCache,
  clearProductsCache
}; 
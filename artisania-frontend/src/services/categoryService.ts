// Category Service
// Handles all category-related API operations

import type {
  BackendCategory,
  CategoryQueryParams,
  PaginatedResponse,
  AsyncApiState
} from '../types/api';
import { transformApiError } from '../utils/apiTransformers';

// =============================================
// SERVICE CONFIGURATION
// =============================================

const API_BASE_URL = 'http://localhost:8080';
const CATEGORIES_ENDPOINT = '/api/categories';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// Mock data fallback for when backend is not accessible
const MOCK_CATEGORIES: BackendCategory[] = [
  { id: 1, name: 'Pottery', description: 'Handcrafted ceramic items', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Textiles', description: 'Traditional woven fabrics', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 3, name: 'Jewelry', description: 'Artisan-made accessories', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 4, name: 'Woodwork', description: 'Carved wooden items', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 5, name: 'Metalwork', description: 'Forged metal crafts', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 6, name: 'Glasswork', description: 'Blown and stained glass', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 7, name: 'Leatherwork', description: 'Handcrafted leather goods', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 8, name: 'Basketry', description: 'Woven baskets and containers', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
];

// =============================================
// HTTP CLIENT UTILITIES
// =============================================

/**
 * Generic HTTP request handler with error transformation
 */
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // If it's a 403 Forbidden error, this means backend security config needs fixing
      if (response.status === 403) {
        console.warn(`🔒 Backend security blocking access to ${endpoint}. Using mock data as fallback.`);
        console.warn('💡 Fix: Update your Spring Security configuration to allow public access to /api/public/** endpoints');
        throw new Error(`BACKEND_SECURITY_ISSUE:${response.status}`);
      }
      
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.message.startsWith('BACKEND_SECURITY_ISSUE')) {
      // Re-throw security issues so we can handle them specifically
      throw error;
    }
    
    throw transformApiError(error);
  }
};

// =============================================
// QUERY PARAMETER UTILITIES
// =============================================

/**
 * Convert CategoryQueryParams to URL search params
 */
const buildQueryString = (params: CategoryQueryParams): string => {
  const searchParams = new URLSearchParams();
  
  if (params.page !== undefined) searchParams.append('page', params.page.toString());
  if (params.size !== undefined) searchParams.append('size', params.size.toString());
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.name) searchParams.append('name', params.name);
  
  return searchParams.toString();
};

// =============================================
// DATA VALIDATION
// =============================================

/**
 * Validate backend category data
 */
const validateBackendCategory = (category: any): category is BackendCategory => {
  return category && 
    typeof category.id === 'number' && 
    typeof category.name === 'string' && 
    typeof category.description === 'string' &&
    typeof category.createdAt === 'string' &&
    typeof category.updatedAt === 'string';
};

// =============================================
// PUBLIC CATEGORY API METHODS
// =============================================

/**
 * Fetch all categories with optional filtering and pagination
 */
export const fetchCategories = async (params: CategoryQueryParams = {}): Promise<PaginatedResponse<BackendCategory>> => {
  try {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `${CATEGORIES_ENDPOINT}?${queryString}` : CATEGORIES_ENDPOINT;
    
    const response = await apiRequest<PaginatedResponse<BackendCategory>>(endpoint);
    
    // Validate response data
    if (response.content && Array.isArray(response.content)) {
      response.content.forEach((category, index) => {
        if (!validateBackendCategory(category)) {
          console.warn(`Invalid category data at index ${index}:`, category);
        }
      });
    }
    
    return response;
  } catch (error) {
    // Check if this is a backend security issue
    if (error instanceof Error && error.message.includes('BACKEND_SECURITY_ISSUE')) {
      console.warn('Using mock category data due to backend security configuration');
      
      // Return mock data in the same paginated format
      const { page = 0, size = 10 } = params;
      const startIndex = page * size;
      const endIndex = startIndex + size;
      const paginatedMockData = MOCK_CATEGORIES.slice(startIndex, endIndex);
      
      const mockResponse = {
        content: paginatedMockData,
        totalElements: MOCK_CATEGORIES.length,
        totalPages: Math.ceil(MOCK_CATEGORIES.length / size),
        size: size,
        number: page,
        first: page === 0,
        last: endIndex >= MOCK_CATEGORIES.length,
        empty: paginatedMockData.length === 0
      };
      
      return mockResponse;
    }
    
    throw error;
  }
};

/**
 * Fetch a single category by ID
 */
export const fetchCategoryById = async (id: number): Promise<BackendCategory> => {
  try {
    const response = await apiRequest<BackendCategory>(`${CATEGORIES_ENDPOINT}/${id}`);
    
    if (!validateBackendCategory(response)) {
      throw new Error('Invalid category data received from server');
    }
    
    return response;
  } catch (error) {
    // Check if this is a backend security issue
    if (error instanceof Error && error.message.includes('BACKEND_SECURITY_ISSUE')) {
      console.warn('🔄 Using mock category data due to backend security configuration');
      
      const mockCategory = MOCK_CATEGORIES.find(cat => cat.id === id);
      if (!mockCategory) {
        throw new Error(`Category with ID ${id} not found`);
      }
      return mockCategory;
    }
    
    throw error;
  }
};

/**
 * Search categories by name
 */
export const searchCategories = async (query: string, params: Omit<CategoryQueryParams, 'name'> = {}): Promise<PaginatedResponse<BackendCategory>> => {
  return fetchCategories({ ...params, name: query });
};

/**
 * Fetch all categories for dropdowns (without pagination)
 */
export const fetchAllCategories = async (): Promise<BackendCategory[]> => {
  try {
    const response = await fetchCategories({ page: 0, size: 1000 });
    
    const result = response.content;
    return result;
  } catch (error) {
    // If the paginated fetch fails due to security issues, the error handling in fetchCategories
    // will already provide mock data, so we just need to extract the content
    if (error instanceof Error && error.message.includes('BACKEND_SECURITY_ISSUE')) {
  
      return MOCK_CATEGORIES;
    }
    
    // For other errors, still provide mock data as fallback
    console.warn('⚠️ CategoryService: API request failed, using mock data as fallback:', error);
    return MOCK_CATEGORIES;
  }
};

/**
 * Fetch category statistics (e.g., product counts)
 */
export const fetchCategoryStats = async (): Promise<Record<number, { productCount: number }>> => {
  try {
    const response = await apiRequest<Record<number, { productCount: number }>>(`${CATEGORIES_ENDPOINT}/stats`);
    return response;
  } catch (error) {
    // Return mock stats data as fallback
    console.warn('⚠️ Category stats unavailable, using mock data:', error);
    const mockStats: Record<number, { productCount: number }> = {};
    MOCK_CATEGORIES.forEach(category => {
      mockStats[category.id] = { productCount: Math.floor(Math.random() * 50) + 1 };
    });
    return mockStats;
  }
};

// =============================================
// STATE MANAGEMENT UTILITIES
// =============================================

/**
 * Create initial async state for categories
 */
export const createCategoriesState = <T>(): AsyncApiState<T> => ({
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

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (categories change less frequently)
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
 * Fetch categories with caching
 */
export const fetchCategoriesWithCache = async (
  params: CategoryQueryParams = {}
): Promise<PaginatedResponse<BackendCategory>> => {
  const cacheKey = `categories_${JSON.stringify(params)}`;
  
  // Try to get from cache first
  const cached = getCachedData<PaginatedResponse<BackendCategory>>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch fresh data
  const result = await fetchCategories(params);
  setCachedData(cacheKey, result);
  
  return result;
};

/**
 * Fetch all categories with caching (for dropdowns)
 */
export const fetchAllCategoriesWithCache = async (): Promise<BackendCategory[]> => {
  const cacheKey = 'all_categories';
  
  // Try to get from cache first
  const cached = getCachedData<BackendCategory[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch fresh data
  const result = await fetchAllCategories();
  setCachedData(cacheKey, result);
  
  return result;
};

/**
 * Clear categories cache
 */
export const clearCategoriesCache = (): void => {
  for (const key of cache.keys()) {
    if (key.startsWith('categories_') || key === 'all_categories') {
      cache.delete(key);
    }
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Get category name by ID (with caching)
 */
export const getCategoryNameById = async (id: number): Promise<string> => {
  try {
    const categories = await fetchAllCategoriesWithCache();
    const category = categories.find(cat => cat.id === id);
    return category?.name || 'Unknown Category';
  } catch (error) {
    console.warn(`Failed to fetch category name for ID ${id}:`, error);
    return 'Unknown Category';
  }
};

/**
 * Get category by name (case-insensitive)
 */
export const getCategoryByName = async (name: string): Promise<BackendCategory | null> => {
  try {
    const categories = await fetchAllCategoriesWithCache();
    return categories.find(cat => 
      cat.name.toLowerCase() === name.toLowerCase()
    ) || null;
  } catch (error) {
    console.warn(`Failed to fetch category by name "${name}":`, error);
    return null;
  }
};

// =============================================
// EXPORT DEFAULT SERVICE
// =============================================

export default {
  // Public API
  fetchCategories,
  fetchCategoryById,
  searchCategories,
  fetchAllCategories,
  fetchCategoryStats,
  
  // State management
  createCategoriesState,
  withLoadingState,
  
  // Cache utilities
  fetchCategoriesWithCache,
  fetchAllCategoriesWithCache,
  clearCategoriesCache,
  
  // Utility functions
  getCategoryNameById,
  getCategoryByName
}; 
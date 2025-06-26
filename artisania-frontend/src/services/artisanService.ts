// Artist Service  
// Handles all artisan-related API operations

import type {
  BackendArtisanProfile,
  FrontendArtisan,
  ArtisanQueryParams,
  PaginatedResponse,
  CreateArtisanProfileRequest,
  UpdateArtisanProfileRequest,
  AsyncApiState,
  FrontendProduct
} from '../types/api';
import { 
  transformBackendArtisan, 
  transformBackendArtisans,
  transformApiError,
  validateBackendArtisan 
} from '../utils/apiTransformers';
import { fetchProductsByArtisan } from './productService';

// =============================================
// SERVICE CONFIGURATION
// =============================================

const API_BASE_URL = 'http://localhost:8080';
const ARTISANS_ENDPOINT = '/api/artisans';
const ADMIN_ARTISANS_ENDPOINT = '/api/admin/artisans';
const USER_ARTISAN_ENDPOINT = '/api/user/artisan';

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
 * Convert ArtisanQueryParams to URL search params
 */
const buildQueryString = (params: ArtisanQueryParams): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams.toString();
};

// =============================================
// PUBLIC ARTISAN API METHODS
// =============================================

/**
 * Register a new artisan with user account and profile creation
 */
export const registerArtisan = async (registrationData: {
  email: string;
  password: string;
  displayName: string;
  bio: string;
  profileImage?: File;
  coverImage?: File;
}): Promise<{
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
  artisanProfile: FrontendArtisan;
}> => {
  try {
    // Create FormData for multipart form submission
    const formData = new FormData();
    formData.append('email', registrationData.email);
    formData.append('password', registrationData.password);
    formData.append('displayName', registrationData.displayName);
    formData.append('bio', registrationData.bio);
    
    // Add image files if provided
    if (registrationData.profileImage) {
      formData.append('profileImage', registrationData.profileImage);
    }
    if (registrationData.coverImage) {
      formData.append('coverImage', registrationData.coverImage);
    }

    // Make request with multipart form data (no Content-Type header - browser sets it)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}/auth/register-artisan`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      let errorMessage = 'Registration failed';
      
      try {
        const parsedError = JSON.parse(errorData);
        errorMessage = parsedError.error || parsedError.message || errorMessage;
      } catch {
        errorMessage = errorData || errorMessage;
      }
      
      throw {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        timestamp: new Date().toISOString()
      };
    }

    const responseData = await response.json();
    
    // Transform the artisan profile data to frontend format
    const transformedArtisan = transformBackendArtisan(responseData.artisanProfile);
    
    return {
      message: responseData.message,
      token: responseData.token,
      user: responseData.user,
      artisanProfile: transformedArtisan
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Registration request timed out. Please try again.');
    }
    
    throw new Error(error.message || transformApiError(error));
  }
};

/**
 * Fetch all artisans with optional filtering and pagination
 */
export const fetchArtisans = async (
  params: ArtisanQueryParams = {}
): Promise<PaginatedResponse<FrontendArtisan>> => {
  try {
    const queryString = buildQueryString(params);
    const url = `${ARTISANS_ENDPOINT}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<PaginatedResponse<BackendArtisanProfile> | BackendArtisanProfile[]>(url);
    
    // Handle direct array response (backend returns List<ArtisanProfile>)
    if (Array.isArray(response)) {
      const validArtisans = response.filter(validateBackendArtisan);
      const transformedArtisans = transformBackendArtisans(validArtisans);
      
      return {
        content: transformedArtisans,
        totalElements: transformedArtisans.length,
        totalPages: 1,
        size: params.size || transformedArtisans.length,
        number: 0,
        first: true,
        last: true,
        empty: transformedArtisans.length === 0
      };
    }
    
    // Handle paginated response structure
    if (response && typeof response === 'object' && 'content' in response && Array.isArray(response.content)) {
      const validArtisans = response.content.filter(validateBackendArtisan);
      const transformedArtisans = transformBackendArtisans(validArtisans);
      
      return {
        ...response,
        content: transformedArtisans
      };
    }
    
    // Invalid response structure
    console.warn('fetchArtisans: Invalid response structure from artisans API:', response);
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
  } catch (error) {
    console.error('fetchArtisans: Error:', error);
    throw new Error(transformApiError(error));
  }
};

/**
 * Fetch a single artisan by ID
 */
export const fetchArtisanById = async (id: number): Promise<FrontendArtisan> => {
  try {
    const response = await apiRequest<BackendArtisanProfile>(`${ARTISANS_ENDPOINT}/${id}`);
    
    if (!validateBackendArtisan(response)) {
      throw new Error('Invalid artisan data received from server');
    }
    
    const transformedArtisan = transformBackendArtisan(response);
    
    return transformedArtisan;
  } catch (error) {
    console.error('fetchArtisanById: Error:', error);
    throw new Error(transformApiError(error));
  }
};

/**
 * Fetch artisan by user ID
 */
export const fetchArtisanByUserId = async (userId: number): Promise<FrontendArtisan> => {
  try {
    const response = await apiRequest<BackendArtisanProfile>(`${ARTISANS_ENDPOINT}/user/${userId}`);
    
    if (!validateBackendArtisan(response)) {
      throw new Error('Invalid artisan data received from server');
    }
    
    return transformBackendArtisan(response);
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Search artisans by display name
 */
export const searchArtisans = async (
  searchQuery: string,
  params: Omit<ArtisanQueryParams, 'displayName'> = {}
): Promise<PaginatedResponse<FrontendArtisan>> => {
  if (!searchQuery.trim()) {
    return fetchArtisans(params);
  }
  
  return fetchArtisans({ ...params, displayName: searchQuery.trim() });
};

/**
 * Fetch artisan with their products
 */
export const fetchArtisanWithProducts = async (
  id: number,
  productParams: { page?: number; size?: number } = {}
): Promise<{
  artisan: FrontendArtisan;
  products: PaginatedResponse<FrontendProduct>;
}> => {
  try {
    // Fetch artisan and products in parallel
    const [artisan, products] = await Promise.all([
      fetchArtisanById(id),
      fetchProductsByArtisan(id, productParams)
    ]);

    // Add product count to artisan
    const artisanWithCount: FrontendArtisan = {
      ...artisan,
      productCount: products.totalElements
    };

    return {
      artisan: artisanWithCount,
      products
    };
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

// =============================================
// USER ARTISAN API METHODS (Authenticated)
// =============================================

/**
 * Get current user's artisan profile (requires authentication)
 */
export const fetchCurrentUserArtisan = async (): Promise<FrontendArtisan> => {
  try {
    const response = await apiRequest<BackendArtisanProfile>(USER_ARTISAN_ENDPOINT, {
      headers: createAuthHeaders()
    });
    
    if (!validateBackendArtisan(response)) {
      throw new Error('Invalid artisan data received from server');
    }
    
    const transformedArtisan = transformBackendArtisan(response);
    
    return transformedArtisan;
  } catch (error) {
    console.error('Error in fetchCurrentUserArtisan:', error);
    throw new Error(transformApiError(error));
  }
};

/**
 * Create artisan profile for current user (requires authentication)
 */
export const createArtisanProfile = async (
  profileData: CreateArtisanProfileRequest
): Promise<FrontendArtisan> => {
  try {
    const response = await apiRequest<BackendArtisanProfile>(USER_ARTISAN_ENDPOINT, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    
    if (!validateBackendArtisan(response)) {
      throw new Error('Invalid artisan data received from server');
    }
    
    return transformBackendArtisan(response);
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Update current user's artisan profile (requires authentication)
 */
export const updateCurrentUserArtisan = async (
  profileData: UpdateArtisanProfileRequest
): Promise<FrontendArtisan> => {
  try {
    const response = await apiRequest<BackendArtisanProfile>(USER_ARTISAN_ENDPOINT, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    
    if (!validateBackendArtisan(response)) {
      throw new Error('Invalid artisan data received from server');
    }
    
    return transformBackendArtisan(response);
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Delete current user's artisan profile (requires authentication)
 */
export const deleteCurrentUserArtisan = async (): Promise<void> => {
  try {
    await apiRequest(USER_ARTISAN_ENDPOINT, {
      method: 'DELETE',
      headers: createAuthHeaders()
    });
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

// =============================================
// ADMIN ARTISAN API METHODS (Authenticated)
// =============================================

/**
 * Update any artisan profile as admin (requires admin authentication)
 */
export const updateArtisanAsAdmin = async (
  id: number,
  profileData: UpdateArtisanProfileRequest
): Promise<FrontendArtisan> => {
  try {
    const response = await apiRequest<BackendArtisanProfile>(`${ADMIN_ARTISANS_ENDPOINT}/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    
    if (!validateBackendArtisan(response)) {
      throw new Error('Invalid artisan data received from server');
    }
    
    return transformBackendArtisan(response);
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Delete any artisan profile as admin (requires admin authentication)
 */
export const deleteArtisanAsAdmin = async (id: number): Promise<void> => {
  try {
    await apiRequest(`${ADMIN_ARTISANS_ENDPOINT}/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders()
    });
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

// =============================================
// IMAGE UPLOAD METHODS
// =============================================

/**
 * Upload profile image for current user (requires authentication)
 */
export const uploadProfileImage = async (imageFile: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile); // Backend expects 'file', not 'image'

    const authHeaders = createAuthHeaders();
    // Don't set Content-Type for FormData - browser will set it with boundary

    const response = await fetch(`${API_BASE_URL}/api/user/profile-image`, {
      method: 'POST', // Backend uses POST, not PUT
      headers: {
        ...authHeaders // Only include Authorization header, not Content-Type
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw {
        status: response.status,
        statusText: response.statusText,
        message: errorData || 'Image upload failed',
        timestamp: new Date().toISOString()
      };
    }

    const result = await response.json();
    return result.imageUrl || result.profileImageUrl;
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

/**
 * Upload cover image for current user (requires authentication)
 */
export const uploadCoverImage = async (imageFile: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile); // Backend expects 'file', not 'image'

    const authHeaders = createAuthHeaders();
    // Don't set Content-Type for FormData - browser will set it with boundary

    const response = await fetch(`${API_BASE_URL}/api/user/cover-image`, {
      method: 'POST', // Backend uses POST, not PUT
      headers: {
        ...authHeaders // Only include Authorization header, not Content-Type
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw {
        status: response.status,
        statusText: response.statusText,
        message: errorData || 'Image upload failed',
        timestamp: new Date().toISOString()
      };
    }

    const result = await response.json();
    return result.imageUrl || result.coverImageUrl;
  } catch (error) {
    throw new Error(transformApiError(error));
  }
};

// =============================================
// STATE MANAGEMENT UTILITIES
// =============================================

/**
 * Create initial async state for artisans
 */
export const createArtisansState = <T>(): AsyncApiState<T> => ({
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
 * Fetch artisans with caching
 */
export const fetchArtisansWithCache = async (
  params: ArtisanQueryParams = {}
): Promise<PaginatedResponse<FrontendArtisan>> => {
  const cacheKey = `artisans_${JSON.stringify(params)}`;
  
  // Try to get from cache first
  const cached = getCachedData<PaginatedResponse<FrontendArtisan>>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch fresh data
  const result = await fetchArtisans(params);
  setCachedData(cacheKey, result);
  
  return result;
};

/**
 * Clear artisans cache
 */
export const clearArtisansCache = (): void => {
  for (const key of cache.keys()) {
    if (key.startsWith('artisans_')) {
      cache.delete(key);
    }
  }
};

// =============================================
// EXPORT DEFAULT SERVICE
// =============================================

export default {
  // Public API
  fetchArtisans,
  fetchArtisanById,
  fetchArtisanByUserId,
  searchArtisans,
  fetchArtisanWithProducts,
  
  // User API
  fetchCurrentUserArtisan,
  createArtisanProfile,
  updateCurrentUserArtisan,
  deleteCurrentUserArtisan,
  
  // Admin API
  updateArtisanAsAdmin,
  deleteArtisanAsAdmin,
  
  // Image upload
  uploadProfileImage,
  uploadCoverImage,
  
  // State management
  createArtisansState,
  withLoadingState,
  
  // Cache utilities
  fetchArtisansWithCache,
  clearArtisansCache
}; 
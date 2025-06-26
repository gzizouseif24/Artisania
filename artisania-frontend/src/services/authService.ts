import type {
  LoginRequest,
  RegisterRequest,
  JWTPayload,
  BackendUser,
  AsyncApiState
} from '../types/api';
import { transformApiError } from '../utils/apiTransformers';

// =============================================
// SERVICE CONFIGURATION
// =============================================

const API_BASE_URL = 'http://localhost:8080';
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER_CUSTOMER: '/auth/register-customer', 
  REGISTER_ARTISAN: '/auth/register-artisan',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  VERIFY: '/auth/verify',
  CHECK_EMAIL: '/auth/check-email'
};

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// Token storage keys (keeping existing keys for compatibility)
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'jwt_token', // Keep existing key
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'user_info' // Keep existing key
};

// =============================================
// LEGACY TYPES (for backward compatibility)
// =============================================

export interface AuthResponse {
  message: string;
  token: string;
  userId: number;
  email: string;
  role: 'CUSTOMER' | 'ARTISAN' | 'ADMIN';
}

export interface User {
  id: number;
  email: string;
  role: 'CUSTOMER' | 'ARTISAN' | 'ADMIN';
  isActive?: boolean;
}

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

// =============================================
// TOKEN MANAGEMENT
// =============================================

/**
 * Store authentication tokens in localStorage
 */
const storeTokens = (accessToken: string, refreshToken?: string): void => {
  localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
  }
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
};

/**
 * Remove all authentication data from localStorage
 */
const clearAuthData = (): void => {
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.USER_DATA);
};

/**
 * Store user data in localStorage (keeping legacy format for compatibility)
 */
const storeUserData = (user: BackendUser | User): void => {
  localStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(user));
};

/**
 * Get user data from localStorage
 */
export const getUserData = (): User | null => {
  try {
    const userData = localStorage.getItem(TOKEN_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.warn('Failed to parse user data from localStorage:', error);
    return null;
  }
};

/**
 * Decode JWT token to extract payload (without verification)
 */
const decodeJwtPayload = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.warn('Failed to decode JWT token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Get auth headers for authenticated requests
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAccessToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// =============================================
// AUTHENTICATION SERVICE (Updated)
// =============================================

export const authService = {
  // Login user
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>(AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify(loginData)
      });
      
      if (response.token) {
        // Store JWT token
        storeTokens(response.token);
        
        // Store user info in legacy format
        const userInfo: User = {
          id: response.userId,
          email: response.email,
          role: response.role,
        };
        storeUserData(userInfo);
        
        // Dispatch custom event for auth state change
        window.dispatchEvent(new CustomEvent('auth:login', { detail: userInfo }));
      }
      
      return response;
    } catch (error: any) {
      throw new Error(transformApiError(error));
    }
  },

  // Register customer
  async registerCustomer(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>(AUTH_ENDPOINTS.REGISTER_CUSTOMER, {
        method: 'POST',
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
        })
      });
      
      // Auto-login after successful registration
      if (response.userId) {
        return await this.login({
          email: registerData.email,
          password: registerData.password,
        });
      }
      
      return response;
    } catch (error: any) {
      throw new Error(transformApiError(error));
    }
  },

  // Register artisan
  async registerArtisan(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>(AUTH_ENDPOINTS.REGISTER_ARTISAN, {
        method: 'POST',
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
        })
      });
      
      // Auto-login after successful registration
      if (response.userId) {
        return await this.login({
          email: registerData.email,
          password: registerData.password,
        });
      }
      
      return response;
    } catch (error: any) {
      throw new Error(transformApiError(error));
    }
  },

  // Register with role (general)
  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    if (registerData.role === 'ARTISAN') {
      return this.registerArtisan(registerData);
    } else {
      return this.registerCustomer(registerData);
    }
  },

  // Check if email exists
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await apiRequest<{ exists: boolean }>(
        `${AUTH_ENDPOINTS.CHECK_EMAIL}?email=${encodeURIComponent(email)}`
      );
      return response.exists;
    } catch (error) {
      return false;
    }
  },

  // Get current user from localStorage
  getCurrentUser(): User | null {
    return getUserData();
  },

  // Get JWT token
  getToken(): string | null {
    return getAccessToken();
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    return !isTokenExpired(token);
  },

  // Check if user has specific role
  hasRole(role: 'CUSTOMER' | 'ARTISAN' | 'ADMIN'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  },

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  },

  // Check if user is artisan
  isArtisan(): boolean {
    return this.hasRole('ARTISAN');
  },

  // Get current user ID
  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  },

  // Get current user email
  getCurrentUserEmail(): string | null {
    const user = this.getCurrentUser();
    return user?.email || null;
  },

  // Logout user
  logout(): void {
    clearAuthData();
    
    // Dispatch custom event for auth state change
    window.dispatchEvent(new CustomEvent('auth:logout'));
  },

  // Refresh access token using refresh token
  async refreshAccessToken(): Promise<string> {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiRequest<{
        accessToken: string;
        refreshToken?: string;
      }>(AUTH_ENDPOINTS.REFRESH, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      // Store new tokens
      storeTokens(response.accessToken, response.refreshToken);
      
      return response.accessToken;
    } catch (error) {
      // If refresh fails, clear all auth data
      clearAuthData();
      throw new Error(transformApiError(error));
    }
  },

  // Verify current token and get user info
  async verifyToken(): Promise<User> {
    try {
      const response = await apiRequest<BackendUser>(AUTH_ENDPOINTS.VERIFY, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      // Convert to legacy format and update stored user data
      const legacyUser: User = {
        id: response.id,
        email: response.email,
        role: response.role,
      };
      
      storeUserData(legacyUser);
      
      return legacyUser;
    } catch (error) {
      throw new Error(transformApiError(error));
    }
  },

  // Automatically refresh token if it's about to expire
  async autoRefreshToken(): Promise<boolean> {
    try {
      const token = getAccessToken();
      if (!token) {
        return false;
      }

      const payload = decodeJwtPayload(token);
      if (!payload || !payload.exp) {
        return false;
      }

      // Refresh if token expires in the next 5 minutes
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - currentTime;
      
      if (timeUntilExpiry < 300) { // 5 minutes
        await this.refreshAccessToken();
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Auto token refresh failed:', error);
      return false;
    }
  },

  // Refresh user info (useful after profile updates)
  async refreshUserInfo(): Promise<void> {
    try {
      await this.verifyToken();
    } catch (error) {
      console.warn('Failed to refresh user info:', error);
    }
  },
};

// =============================================
// STATE MANAGEMENT UTILITIES
// =============================================

/**
 * Create initial async state for authentication
 */
export const createAuthState = <T>(): AsyncApiState<T> => ({
  data: null,
  isLoading: false,
  error: null,
  lastFetched: undefined
});

/**
 * Helper to handle loading state updates for auth operations
 */
export const withAuthLoadingState = async <T>(
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
      statusText: error.statusText || 'Authentication Error',
      timestamp: new Date().toISOString()
    };
    setState({ isLoading: false, error: apiError });
    throw error;
  }
};

// Export default for backward compatibility
export default authService;

// Re-export types for compatibility
export type { LoginRequest, RegisterRequest }; 
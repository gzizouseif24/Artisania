// Central exports for all API services
// Provides clean imports: import { productService, artistService } from '@/services'

// Service imports
export { default as productService } from './productService';
export { default as artisanService } from './artisanService'; 
export { default as categoryService } from './categoryService';
export { default as authService } from './authService';
export { default as cartService } from './cartService';
export { default as orderService } from './orderService';

// Direct exports for commonly used functions
export { 
  fetchCurrentUserProducts, 
  deleteProduct 
} from './productService';

// Auth utilities (commonly used across components)
export { 
  getAccessToken, 
  getRefreshToken, 
  getUserData, 
  getAuthHeaders,
  createAuthState,
  withAuthLoadingState
} from './authService';

// Re-export commonly used types for convenience
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User
} from './authService';

export type {
  FrontendProduct,
  FrontendArtisan,
  BackendProduct,
  BackendArtisanProfile,
  BackendCategory,
  ProductQueryParams,
  ArtisanQueryParams,
  CategoryQueryParams,
  AsyncApiState,
  ApiError,
  LoadingState
} from '../types/api';

export type { CartResponse, CartItem } from './cartService';
export type { 
  OrderCreationResponse, 
  FrontendOrder, 
  CreateOrderRequest,
  BackendOrder,
  BackendOrderItem 
} from './orderService'; 
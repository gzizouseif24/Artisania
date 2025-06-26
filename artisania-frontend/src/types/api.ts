// API Types for Artisania Marketplace
// This file contains TypeScript interfaces that match the backend API structure

// =============================================
// BACKEND ENTITY TYPES (Match Java Models)
// =============================================

export interface BackendUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ARTISAN' | 'CUSTOMER';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface BackendCategory {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendProductImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  altText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendArtisanProfile {
  id: number;
  displayName: string;
  bio: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  user: BackendUser;
  // Note: products relationship is excluded to avoid circular references
}

export interface BackendProduct {
  id: number;
  name: string;
  description?: string;
  price: number; // Backend BigDecimal becomes number in JSON
  stockQuantity: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  artisan: BackendArtisanProfile;
  category: BackendCategory;
  productImages: BackendProductImage[];
}

// =============================================
// API RESPONSE WRAPPERS
// =============================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page
  first: boolean;
  last: boolean;
  empty: boolean;
}

// =============================================
// LOADING & ERROR STATES
// =============================================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated?: string;
}

export interface ApiError {
  message: string;
  status: number;
  statusText: string;
  timestamp: string;
  path?: string;
}

export interface AsyncApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  lastFetched?: string;
}

// =============================================
// QUERY PARAMETERS
// =============================================

export interface ProductQueryParams {
  categoryId?: number;
  artisanId?: number;
  featured?: boolean;
  name?: string; // for search
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  size?: number;
  sort?: string; // e.g., "name,asc" or "price,desc"
}

export interface ArtisanQueryParams {
  displayName?: string; // for search
  page?: number;
  size?: number;
  sort?: string;
}

export interface CategoryQueryParams {
  name?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// =============================================
// REQUEST DTOs (Data Transfer Objects)
// =============================================

export interface CreateArtisanProfileRequest {
  displayName: string;
  bio: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
}

export interface UpdateArtisanProfileRequest {
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  isFeatured?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  categoryId?: number;
  isFeatured?: boolean;
}

// =============================================
// FRONTEND-COMPATIBLE TYPES (Transformed)
// =============================================

// Frontend Product interface (matches current frontend usage)
export interface FrontendProduct {
  id: number;
  name: string;
  price: number;
  priceFormatted: string;
  artisan: string; // Transformed from BackendArtisanProfile.displayName
  artisanId: number; // Added for API calls
  category: string; // Transformed from BackendCategory.name
  categoryId: number; // Added for API calls
  description: string;
  inStock: boolean; // Transformed from stockQuantity > 0
  stockCount: number; // From stockQuantity
  featured: boolean; // From isFeatured
  createdAt: string;
  updatedAt: string;
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
  // Additional frontend fields
  hasRealImages: boolean;
  materials?: string[];
  dimensions?: string;
  weight?: string;
  rating?: number;
  reviewCount?: number;
}

// Frontend Artisan interface (simplified for display)
export interface FrontendArtisan {
  id: number;
  displayName: string;
  bio: string;
  profileImage: string; // Transformed with placeholder handling
  coverImage: string; // Transformed with placeholder handling
  hasRealProfileImage: boolean;
  hasRealCoverImage: boolean;
  productCount?: number; // Calculated field
  createdAt: string;
  updatedAt: string;
  // User info for artisan pages
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// =============================================
// TRANSFORMATION UTILITIES TYPES
// =============================================

export type BackendToFrontendTransformer<B, F> = (backend: B) => F;

export interface TransformationContext {
  baseImageUrl?: string;
  fallbackImages?: {
    product: string;
    artisan: string;
  };
}

// =============================================
// API SERVICE TYPES
// =============================================

export interface ApiServiceConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface ApiMethods {
  get<T>(url: string, params?: Record<string, any>): Promise<T>;
  post<T>(url: string, data?: any): Promise<T>;
  put<T>(url: string, data?: any): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

// =============================================
// AUTHENTICATION TYPES
// =============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'ARTISAN' | 'CUSTOMER';
}

export interface AuthResponse {
  token: string;
  user: BackendUser;
  expiresIn: number; // seconds
}

export interface JWTPayload {
  sub: string; // user email
  userId: number;
  role: string;
  iat: number; // issued at
  exp: number; // expires at
}

// =============================================
// CART & ORDER TYPES
// =============================================

// Backend CartItem interface (matches the actual backend model)
export interface BackendCartItem {
  id: number;
  user: BackendUser;
  product: BackendProduct;
  quantity: number;
  priceAtTime: number;
  createdAt: string;
  updatedAt: string;
}

// Legacy CartItem interface - keeping for backward compatibility but will be phased out
export interface CartItem {
  id: number;
  user: BackendUser;
  product: BackendProduct;
  quantity: number;
  priceAtTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  product: BackendProduct;
  quantity: number;
  priceAtTime: number;
}

export interface Order {
  id: number;
  user: BackendUser;
  orderItems: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// VALIDATION TYPES
// =============================================

export interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}

export interface ApiValidationResponse {
  success: false;
  message: string;
  errors: ValidationError[];
  timestamp: string;
}

// =============================================
// CACHE TYPES
// =============================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheConfig {
  ttl: number; // time to live in milliseconds
  maxSize: number;
  enabled: boolean;
}

export default {}; 
// Admin Dashboard Types
// This file contains TypeScript interfaces specific to admin functionality

import type { BackendUser, BackendProduct, BackendCategory } from './api';

// =============================================
// ADMIN DASHBOARD STATS
// =============================================

export interface AdminStats {
  totalUsers: number;
  totalArtisans: number;
  totalCustomers: number;
  totalProducts: number;
  featuredProducts: number;
  totalCategories: number;
  totalOrders: number;
  pendingOrders: number;
}

// =============================================
// ADMIN API RESPONSE TYPES
// =============================================

export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AdminPaginatedResponse<T> {
  success: boolean;
  data?: T[];
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
  message?: string;
  error?: string;
}

// =============================================
// ADMIN USER MANAGEMENT TYPES
// =============================================

export interface AdminUser extends BackendUser {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminArtisan extends AdminUser {
  artisanProfile?: {
    id: number;
    displayName: string;
    bio: string;
    profileImageUrl?: string;
    coverImageUrl?: string;
    productCount?: number;
  };
}

export interface AdminCustomer extends AdminUser {
  orderCount?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}

// =============================================
// ADMIN PRODUCT MANAGEMENT TYPES
// =============================================

export interface AdminProduct extends BackendProduct {
  // Additional admin-specific fields
  isActive: boolean;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductUpdate {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  categoryId?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AdminProductFilters {
  search?: string;
  category?: number;
  artisan?: number;
  featured?: boolean;
  active?: boolean;
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  page?: number;
  size?: number;
}

// =============================================
// ADMIN CATEGORY MANAGEMENT TYPES
// =============================================

export interface AdminCategory extends BackendCategory {
  productCount: number;
  isActive: boolean;
  slug: string;
}

export interface AdminCategoryCreate {
  name: string;
  description?: string;
  slug?: string;
}

export interface AdminCategoryUpdate extends Partial<AdminCategoryCreate> {
  isActive?: boolean;
}

// =============================================
// ADMIN ORDER MANAGEMENT TYPES
// =============================================

export interface AdminOrder {
  id: number;
  customer: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  orderItems: AdminOrderItem[];
  shippingInfo: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    artisan: string;
    category: string;
  };
  quantity: number;
  priceAtPurchase: number;
  totalPrice: number;
}

export interface AdminOrderFilters {
  status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  customerId?: number;
  artisanId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

// =============================================
// ADMIN ACTIONS & RESPONSES
// =============================================

export interface AdminDeleteResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface AdminFeatureToggleResponse {
  success: boolean;
  product?: AdminProduct;
  message: string;
  error?: string;
}

export interface AdminUserActionResponse {
  success: boolean;
  user?: AdminUser;
  message: string;
  error?: string;
}

// =============================================
// ADMIN UI STATE TYPES
// =============================================

export type AdminDashboardTab = 'manage-site' | 'manage-artisans' | 'manage-customers' | 'manage-categories';

export interface AdminUIState {
  activeTab: AdminDashboardTab;
  loading: boolean;
  error?: string;
  selectedItems: number[];
}

export interface AdminModalState {
  type: 'delete-confirm' | 'add-category' | 'view-orders' | null;
  isOpen: boolean;
  data?: any;
  loading?: boolean;
}

// =============================================
// ADMIN FORM TYPES
// =============================================

export interface AddCategoryFormData {
  name: string;
  description: string;
}

export interface ConfirmDeleteData {
  type: 'user' | 'product' | 'category';
  id: number;
  name: string;
  onConfirm: () => Promise<void>;
}

// =============================================
// ADMIN DASHBOARD CONFIG
// =============================================

export interface AdminDashboardConfig {
  itemsPerPage: number;
  refreshInterval: number;
  enableRealTimeUpdates: boolean;
  showBulkActions: boolean;
}

export const DEFAULT_ADMIN_CONFIG: AdminDashboardConfig = {
  itemsPerPage: 20,
  refreshInterval: 30000, // 30 seconds
  enableRealTimeUpdates: false,
  showBulkActions: false,
};

export default {}; 
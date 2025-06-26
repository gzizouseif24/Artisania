import type { BackendUser, BackendProduct, BackendCategory } from '../types/api';
import { getAuthHeaders } from './authService';
import { transformApiError } from '../utils/apiTransformers';

// Admin types - explicit interface definitions
interface AdminStats {
  totalUsers: number;
  totalArtisans: number;
  totalCustomers: number;
  totalProducts: number;
  featuredProducts: number;
  totalCategories: number;
  totalOrders: number;
  pendingOrders: number;
}

interface AdminProductUpdate {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  categoryId?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface AdminCategoryCreate {
  name: string;
  description?: string;
  slug?: string;
}

// =============================================
// HTTP CLIENT UTILITIES
// =============================================

const API_BASE_URL = 'http://localhost:8080';
const REQUEST_TIMEOUT = 10000;

/**
 * Generic HTTP request handler with authentication and error transformation
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
        ...getAuthHeaders(), // Add auth headers for admin requests
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

    // Handle empty responses (like from DELETE endpoints)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // For non-JSON responses (like 204 No Content), return undefined
      return undefined as T;
    }
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

class AdminService {
  private baseUrl = '/api';

  // =============================================
  // STATS & DASHBOARD OVERVIEW
  // =============================================

  async getDashboardStats(): Promise<AdminStats> {
    try {
      // We'll make multiple API calls to get stats
      const [usersResponse, productsResponse, categoriesResponse, ordersResponse] = await Promise.all([
        apiRequest<BackendUser[]>(`${this.baseUrl}/users`),
        apiRequest<any>(`${this.baseUrl}/products`),
        apiRequest<any>(`${this.baseUrl}/categories`),
        apiRequest<any[]>(`${this.baseUrl}/orders`)
      ]);

      const users = usersResponse;
      const products = productsResponse.content || productsResponse;
      const categories = categoriesResponse.content || categoriesResponse;
      const orders = ordersResponse;

      return {
        totalUsers: users.length,
        totalArtisans: users.filter((u: BackendUser) => u.role === 'ARTISAN').length,
        totalCustomers: users.filter((u: BackendUser) => u.role === 'CUSTOMER').length,
        totalProducts: Array.isArray(products) ? products.length : products.totalElements || 0,
        featuredProducts: Array.isArray(products) ? products.filter((p: BackendProduct) => p.isFeatured).length : 0,
        totalCategories: Array.isArray(categories) ? categories.length : categories.totalElements || 0,
        totalOrders: orders.length,
        pendingOrders: orders.filter((o: any) => o.status === 'PENDING').length
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // =============================================
  // PRODUCT MANAGEMENT
  // =============================================

  async getAllProducts(params?: { page?: number; size?: number; search?: string }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.search) queryParams.append('name', params.search);
      
      const url = `${this.baseUrl}/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiRequest<any>(url);
      
      return {
        success: true,
        products: response.content || response,
        totalElements: response.totalElements || (Array.isArray(response) ? response.length : 0),
        totalPages: response.totalPages || 1,
        currentPage: response.number || 0
      };
    } catch (error: any) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        error: transformApiError(error),
        products: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0
      };
    }
  }

  async toggleProductFeature(productId: number, featured: boolean) {
    try {
      const response = await apiRequest<BackendProduct>(`${this.baseUrl}/products/${productId}/featured`, {
        method: 'PUT',
        body: JSON.stringify({ isFeatured: featured })
      });
      
      return {
        success: true,
        product: response,
        message: `Product ${featured ? 'featured' : 'unfeatured'} successfully`
      };
    } catch (error: any) {
      console.error('Error toggling product feature:', error);
      return {
        success: false,
        error: transformApiError(error)
      };
    }
  }

  async updateProduct(productId: number, updates: AdminProductUpdate) {
    try {
      const response = await apiRequest<BackendProduct>(`${this.baseUrl}/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return {
        success: true,
        product: response,
        message: 'Product updated successfully'
      };
    } catch (error: any) {
      console.error('Error updating product:', error);
      return {
        success: false,
        error: transformApiError(error)
      };
    }
  }

  // =============================================
  // USER MANAGEMENT (ARTISANS & CUSTOMERS)
  // =============================================

  async getAllArtisans() {
    try {
      const response = await apiRequest<BackendUser[]>(`${this.baseUrl}/users/role/ARTISAN`);
      return {
        success: true,
        artisans: response,
        message: 'Artisans fetched successfully'
      };
    } catch (error: any) {
      console.error('Error fetching artisans:', error);
      return {
        success: false,
        error: transformApiError(error),
        artisans: []
      };
    }
  }

  async getAllCustomers() {
    try {
      const response = await apiRequest<BackendUser[]>(`${this.baseUrl}/users/role/CUSTOMER`);
      return {
        success: true,
        customers: response,
        message: 'Customers fetched successfully'
      };
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        error: transformApiError(error),
        customers: []
      };
    }
  }

  async deleteUser(userId: number) {
    try {
      await apiRequest<void>(`${this.baseUrl}/users/${userId}`, {
        method: 'DELETE'
      });
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      // Handle specific constraint violation errors
      let errorMessage = transformApiError(error);
      if (error.status === 500 && error.message?.includes('constraint')) {
        errorMessage = 'Cannot delete user with existing products or orders. Please deactivate the user instead.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async deactivateUser(userId: number) {
    try {
      const response = await apiRequest<BackendUser>(`${this.baseUrl}/users/${userId}/deactivate`, {
        method: 'PUT'
      });
      return {
        success: true,
        user: response,
        message: 'User deactivated successfully'
      };
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      return {
        success: false,
        error: transformApiError(error)
      };
    }
  }

  async activateUser(userId: number) {
    try {
      const response = await apiRequest<BackendUser>(`${this.baseUrl}/users/${userId}/activate`, {
        method: 'PUT'
      });
      return {
        success: true,
        user: response,
        message: 'User activated successfully'
      };
    } catch (error: any) {
      console.error('Error activating user:', error);
      return {
        success: false,
        error: transformApiError(error)
      };
    }
  }

  // =============================================
  // ORDER MANAGEMENT
  // =============================================

  async getCustomerOrders(customerId: number) {
    try {
      const response = await apiRequest<any[]>(`${this.baseUrl}/orders/customer/${customerId}`);
      return {
        success: true,
        orders: response,
        message: 'Customer orders fetched successfully'
      };
    } catch (error: any) {
      console.error('Error fetching customer orders:', error);
      return {
        success: false,
        error: transformApiError(error),
        orders: []
      };
    }
  }

  async getAllOrders(params?: { page?: number; size?: number; status?: string }) {
    try {
      let url = `${this.baseUrl}/orders`;
      const queryParams = new URLSearchParams();
      
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      
      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }
      
      const response = await apiRequest<any[]>(url);
      
      let orders = response;
      
      // Filter by status if provided
      if (params?.status) {
        orders = orders.filter((order: any) => order.status === params.status);
      }
      
      return {
        success: true,
        orders: orders,
        message: 'Orders fetched successfully'
      };
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        error: transformApiError(error),
        orders: []
      };
    }
  }

  async updateOrderStatus(orderId: number, status: string) {
    try {
      const response = await apiRequest<any>(`${this.baseUrl}/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      return {
        success: true,
        order: response,
        message: 'Order status updated successfully'
      };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        error: transformApiError(error)
      };
    }
  }

  // =============================================
  // CATEGORY MANAGEMENT
  // =============================================

  async getAllCategories() {
    try {
      const response = await apiRequest<any>(`${this.baseUrl}/categories`);
      return {
        success: true,
        categories: response.content || response,
        message: 'Categories fetched successfully'
      };
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        error: transformApiError(error),
        categories: []
      };
    }
  }

  async createCategory(categoryData: AdminCategoryCreate) {
    try {
      // Generate slug from name if not provided
      const slug = categoryData.slug || this.generateSlug(categoryData.name);
      
      const response = await apiRequest<BackendCategory>(`${this.baseUrl}/categories`, {
        method: 'POST',
        body: JSON.stringify({
          ...categoryData,
          slug: slug
        })
      });
      return {
        success: true,
        category: response,
        message: 'Category created successfully'
      };
    } catch (error: any) {
      console.error('Error creating category:', error);
      return {
        success: false,
        error: transformApiError(error)
      };
    }
  }

  // Helper method to generate slug from name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  async updateCategory(categoryId: number, categoryData: Partial<AdminCategoryCreate>) {
    try {
      const response = await apiRequest<BackendCategory>(`${this.baseUrl}/categories/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
      });
      return {
        success: true,
        category: response,
        message: 'Category updated successfully'
      };
    } catch (error: any) {
      console.error('Error updating category:', error);
      return {
        success: false,
        error: transformApiError(error)
      };
    }
  }

  async deleteCategory(categoryId: number) {
    try {
      await apiRequest<void>(`${this.baseUrl}/categories/${categoryId}`, {
        method: 'DELETE'
      });
      return {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting category:', error);
      return {
        success: false,
        error: transformApiError(error)
      };
    }
  }
}

const adminService = new AdminService();
export default adminService; 
const API_BASE_URL = 'http://localhost:8080/api';

// Import the proper types and transformers
import type { BackendCartItem } from '../types/api';
import { transformBackendCartItem, type FrontendCartItem } from '../utils/apiTransformers';

// Re-export the transformed CartItem type for use in other components
export type CartItem = FrontendCartItem;

export interface CartResponse {
  success: boolean;
  cartItems?: BackendCartItem[];  // Backend returns BackendCartItem[]
  total?: number;
  itemCount?: number;
  cartItem?: BackendCartItem;     // Backend returns BackendCartItem
  cartCount?: number;
  cartTotal?: number;
  count?: number;
  inCart?: boolean;
  message?: string;
  error?: string;
}

class CartService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('jwt_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Add item to cart
  async addToCart(userId: number, productId: number, quantity: number = 1): Promise<CartResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          userId,
          productId,
          quantity
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  // Get all cart items for a user with proper transformation
  async getCartItems(userId: number): Promise<{ success: boolean; cartItems: CartItem[]; total: number; itemCount: number; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/user/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendResponse: CartResponse = await response.json();
      
      if (!backendResponse.success || !backendResponse.cartItems) {
        return {
          success: false,
          cartItems: [],
          total: 0,
          itemCount: 0,
          error: backendResponse.error || 'Failed to fetch cart items'
        };
      }

      // Transform backend cart items to frontend format using apiTransformers
      const transformedCartItems = backendResponse.cartItems.map(cartItem => transformBackendCartItem(cartItem));
      
      return {
        success: true,
        cartItems: transformedCartItems,
        total: backendResponse.total || 0,
        itemCount: backendResponse.itemCount || 0
      };
    } catch (error) {
      console.error('Error fetching cart items:', error);
      return {
        success: false,
        cartItems: [],
        total: 0,
        itemCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update cart item quantity
  async updateQuantity(userId: number, productId: number, quantity: number): Promise<CartResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/update-quantity`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          userId,
          productId,
          quantity
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeFromCart(userId: number, productId: number): Promise<CartResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/remove`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          userId,
          productId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  // Clear entire cart
  async clearCart(userId: number): Promise<CartResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/clear/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Get cart count for a user
  async getCartCount(userId: number): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/count/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CartResponse = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching cart count:', error);
      return 0;
    }
  }

  // Check if product is in cart
  async checkProductInCart(userId: number, productId: number): Promise<{ inCart: boolean; cartItem?: CartItem }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/check/${userId}/${productId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CartResponse = await response.json();
      
      let transformedCartItem: CartItem | undefined;
      if (data.cartItem) {
        transformedCartItem = transformBackendCartItem(data.cartItem);
      }
      
      return {
        inCart: data.inCart || false,
        cartItem: transformedCartItem
      };
    } catch (error) {
      console.error('Error checking product in cart:', error);
      return { inCart: false };
    }
  }

  // Sync cart prices with current product prices
  async syncCartPrices(userId: number): Promise<CartResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/sync-prices/${userId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing cart prices:', error);
      throw error;
    }
  }
}

export const cartService = new CartService();
export default cartService; 
const API_BASE_URL = 'http://localhost:8080/api';

// Import types and transformers
import type { BackendUser, BackendProduct } from '../types/api';
import type { FrontendCartItem } from '../utils/apiTransformers';

// =============================================
// BACKEND TYPES (Exact Backend Structure)
// =============================================

export interface BackendOrder {
  id: number;
  customer: BackendUser | null;
  guestEmail: string | null;
  totalPrice: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingName: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string | null;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhone?: string | null;
  createdAt: string;
  updatedAt: string;
  orderItems: BackendOrderItem[];
}

export interface BackendOrderItem {
  id: number;
  order: BackendOrder;
  product: BackendProduct;
  quantity: number;
  priceAtPurchase: number;
}

// =============================================
// FRONTEND TYPES (User-Friendly)
// =============================================

export interface FrontendOrder {
  id: number;
  customer: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  guestEmail: string | null;
  totalPrice: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingInfo: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  orderItems: FrontendOrderItem[];
  createdAt: string;
  updatedAt: string;
  isGuestOrder: boolean;
}

export interface FrontendOrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
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
    artisan: string;
    artisanId: number;
    category: string;
    categoryId: number;
  };
  quantity: number;
  priceAtPurchase: number;
  totalPrice: number;
}

// =============================================
// ORDER CREATION REQUEST INTERFACES
// =============================================

// Backend entity format for order creation (what the backend actually expects)
export interface OrderCreationPayload {
  // Order details
  totalPrice: number;
  status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  
  // Shipping information
  shippingName: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhone?: string;
  
  // Customer information (for guest orders)
  guestEmail?: string;
  
  // Order items (backend entity format)
  orderItems: OrderItemCreationPayload[];
}

export interface OrderItemCreationPayload {
  product: {
    id: number;
  };
  quantity: number;
  priceAtPurchase: number;
}

// Legacy interfaces (keep for backwards compatibility)
export interface CreateOrderRequest {
  // Order details
  totalPrice: number;
  status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  
  // Shipping information
  shippingName: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhone?: string;
  
  // Customer information (for guest orders)
  guestEmail?: string;
  
  // Order items
  orderItems: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
  priceAtPurchase: number;
}

// =============================================
// API RESPONSE INTERFACES
// =============================================

export interface OrderResponse {
  success: boolean;
  order?: BackendOrder;
  orders?: BackendOrder[];
  message?: string;
  error?: string;
}

export interface OrderCreationResponse {
  success: boolean;
  order?: BackendOrder;
  orderId?: number;
  message?: string;
  error?: string;
}

// =============================================
// TRANSFORMER FUNCTIONS
// =============================================

function transformBackendOrder(backendOrder: BackendOrder): FrontendOrder {
  return {
    id: backendOrder.id,
    customer: backendOrder.customer ? {
      id: backendOrder.customer.id,
      email: backendOrder.customer.email,
      firstName: backendOrder.customer.firstName || '',
      lastName: backendOrder.customer.lastName || ''
    } : null,
    guestEmail: backendOrder.guestEmail,
    totalPrice: backendOrder.totalPrice,
    status: backendOrder.status,
    shippingInfo: {
      name: backendOrder.shippingName,
      addressLine1: backendOrder.shippingAddressLine1,
      addressLine2: backendOrder.shippingAddressLine2 || undefined,
      city: backendOrder.shippingCity,
      postalCode: backendOrder.shippingPostalCode,
      country: backendOrder.shippingCountry,
      phone: backendOrder.shippingPhone || undefined
    },
    orderItems: backendOrder.orderItems?.map(transformBackendOrderItem) || [],
    createdAt: backendOrder.createdAt,
    updatedAt: backendOrder.updatedAt,
    isGuestOrder: !backendOrder.customer && !!backendOrder.guestEmail
  };
}

function transformBackendOrderItem(backendItem: BackendOrderItem): FrontendOrderItem {
  return {
    id: backendItem.id,
    product: {
      id: backendItem.product.id,
      name: backendItem.product.name,
      price: backendItem.product.price,
      description: backendItem.product.description || '',
      images: {
        main: backendItem.product.productImages?.[0]?.imageUrl || '',
        gallery: backendItem.product.productImages?.map(img => img.imageUrl) || [],
        thumbnail: backendItem.product.productImages?.[0]?.imageUrl || '',
        alt: {
          main: backendItem.product.productImages?.[0]?.altText || `${backendItem.product.name} by artisan`,
          view1: backendItem.product.productImages?.[1]?.altText,
          view2: backendItem.product.productImages?.[2]?.altText,
          view3: backendItem.product.productImages?.[3]?.altText
        }
      },
      artisan: backendItem.product.artisan?.displayName || 'Artisan',
      artisanId: backendItem.product.artisan?.id || 0,
      category: backendItem.product.category?.name || 'Category',
      categoryId: backendItem.product.category?.id || 0
    },
    quantity: backendItem.quantity,
    priceAtPurchase: backendItem.priceAtPurchase,
    totalPrice: backendItem.priceAtPurchase * backendItem.quantity
  };
}

// =============================================
// ORDER SERVICE CLASS
// =============================================

class OrderService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('jwt_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Create a new order (for authenticated customers only)
   */
  async createOrder(orderData: CreateOrderRequest): Promise<OrderCreationResponse> {
    try {
      // Transform the flat DTO to backend entity format
      const backendPayload: OrderCreationPayload = {
        totalPrice: orderData.totalPrice,
        status: orderData.status || 'PENDING',
        shippingName: orderData.shippingName,
        shippingAddressLine1: orderData.shippingAddressLine1,
        shippingAddressLine2: orderData.shippingAddressLine2,
        shippingCity: orderData.shippingCity,
        shippingPostalCode: orderData.shippingPostalCode,
        shippingCountry: orderData.shippingCountry,
        shippingPhone: orderData.shippingPhone,
        guestEmail: orderData.guestEmail,
        orderItems: orderData.orderItems.map(item => ({
          product: {
            id: item.productId
          },
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase
        }))
      };

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(backendPayload)
      });

      if (!response.ok) {
        let errorMessage = `Failed to create order: ${response.status} ${response.statusText}`;
        
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (e) {
          // Ignore error text parsing errors
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      let backendOrder: BackendOrder;
      try {
        backendOrder = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        // Try to get the raw response text for debugging
        try {
          const responseText = await response.text();
          console.error('Raw response:', responseText);
          return {
            success: false,
            error: `Failed to parse response JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`
          };
        } catch (textError) {
          return {
            success: false,
            error: 'Failed to parse response and unable to get response text'
          };
        }
      }
      
      return {
        success: true,
        order: backendOrder,
        orderId: backendOrder.id,
        message: 'Order created successfully'
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create order from cart items (convenience method for authenticated customers)
   */
  async createOrderFromCart(
    cartItems: FrontendCartItem[],
    shippingInfo: {
      fullName: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      postalCode: string;
      country: string;
      phone?: string;
      email?: string; // For guest orders (not used in simplified version)
    },
    totalPrice: number
  ): Promise<OrderCreationResponse> {
    const orderItems: CreateOrderItemRequest[] = cartItems.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtTime
    }));

    const orderData: CreateOrderRequest = {
      totalPrice,
      shippingName: shippingInfo.fullName,
      shippingAddressLine1: shippingInfo.addressLine1,
      shippingAddressLine2: shippingInfo.addressLine2,
      shippingCity: shippingInfo.city,
      shippingPostalCode: shippingInfo.postalCode,
      shippingCountry: shippingInfo.country,
      shippingPhone: shippingInfo.phone,
      // No guestEmail since we only support authenticated customers
      orderItems
    };

    return this.createOrder(orderData);
  }

  /**
   * Get orders for the current authenticated user
   */
  async getUserOrders(): Promise<{ success: boolean; orders?: FrontendOrder[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/customer/me`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch orders: ${response.status} ${response.statusText}`
        };
      }

      const backendOrders: BackendOrder[] = await response.json();
      const transformedOrders = backendOrders.map(transformBackendOrder);

      return {
        success: true,
        orders: transformedOrders
      };
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get orders by guest email
   */
  async getGuestOrders(email: string): Promise<{ success: boolean; orders?: FrontendOrder[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/guest/${encodeURIComponent(email)}`);

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch guest orders: ${response.status} ${response.statusText}`
        };
      }

      const backendOrders: BackendOrder[] = await response.json();
      const transformedOrders = backendOrders.map(transformBackendOrder);

      return {
        success: true,
        orders: transformedOrders
      };
    } catch (error) {
      console.error('Error fetching guest orders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: number): Promise<{ success: boolean; order?: FrontendOrder; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch order: ${response.status} ${response.statusText}`
        };
      }

      const backendOrder: BackendOrder = await response.json();
      const transformedOrder = transformBackendOrder(backendOrder);

      return {
        success: true,
        order: transformedOrder
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update order status (for artisans and admins)
   */
  async updateOrderStatus(
    orderId: number, 
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  ): Promise<{ success: boolean; order?: FrontendOrder; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status?status=${status}`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to update order status: ${response.status} ${response.statusText}`
        };
      }

      const backendOrder: BackendOrder = await response.json();
      const transformedOrder = transformBackendOrder(backendOrder);

      return {
        success: true,
        order: transformedOrder
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: number): Promise<{ success: boolean; order?: FrontendOrder; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to cancel order: ${response.status} ${response.statusText}`
        };
      }

      const backendOrder: BackendOrder = await response.json();
      const transformedOrder = transformBackendOrder(backendOrder);

      return {
        success: true,
        order: transformedOrder
      };
    } catch (error) {
      console.error('Error canceling order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Convenience methods for status updates
   */
  async markAsProcessing(orderId: number) {
    return this.updateOrderStatus(orderId, 'PROCESSING');
  }

  async markAsShipped(orderId: number) {
    return this.updateOrderStatus(orderId, 'SHIPPED');
  }

  async markAsDelivered(orderId: number) {
    return this.updateOrderStatus(orderId, 'DELIVERED');
  }

  // =============================================
  // ARTISAN-SPECIFIC ORDER METHODS
  // =============================================

  /**
   * Fetch orders containing the current artisan's products
   */
  async getArtisanOrders(): Promise<{ success: boolean; orders?: FrontendOrder[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/artisan`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        let errorMessage = `Failed to fetch artisan orders: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (e) {
          // Ignore error text parsing errors
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      const backendOrders: BackendOrder[] = await response.json();
      const frontendOrders = backendOrders.map(transformBackendOrder);

      return {
        success: true,
        orders: frontendOrders
      };

    } catch (error: any) {
      console.error('Error fetching artisan orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch artisan orders'
      };
    }
  }

  /**
   * Get order details with only the current artisan's items
   */
  async getArtisanOrderDetails(orderId: number): Promise<{ 
    success: boolean; 
    order?: FrontendOrder; 
    artisanItems?: FrontendOrderItem[];
    error?: string 
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/artisan`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        let errorMessage = `Failed to fetch order details: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (e) {
          // Ignore error text parsing errors
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      const backendOrder: BackendOrder = await response.json();
      const frontendOrder = transformBackendOrder(backendOrder);
      
      // Extract only artisan's items (backend should already filter this)
      const artisanItems = frontendOrder.orderItems;

      return {
        success: true,
        order: frontendOrder,
        artisanItems: artisanItems
      };

    } catch (error: any) {
      console.error('Error fetching artisan order details:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch order details'
      };
    }
  }

  /**
   * Update the status of a specific order item (artisan's product)
   */
  async updateOrderItemStatus(
    orderId: number,
    itemId: number,
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}/status`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        let errorMessage = `Failed to update item status: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (e) {
          // Ignore error text parsing errors
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: true
      };

    } catch (error: any) {
      console.error('Error updating order item status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update item status'
      };
    }
  }
}

// Export singleton instance
export const orderService = new OrderService();
export default orderService; 
import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CartItem } from '../services/cartService';
import { cartService } from '../services/cartService';
import { useAuth } from '../stores/AuthContext';


interface CartState {
  items: CartItem[];
  itemCount: number;
  total: number;
  loading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART_DATA'; payload: { items: CartItem[]; total: number; itemCount: number } }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { productId: number; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: number } // productId
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ITEM_COUNT'; payload: number };

const initialState: CartState = {
  items: [],
  itemCount: 0,
  total: 0,
  loading: false,
  error: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_CART_DATA':
      return {
        ...state,
        items: action.payload.items,
        total: action.payload.total,
        itemCount: action.payload.itemCount,
        loading: false,
        error: null,
      };
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(
        item => item.product.id === action.payload.product.id
      );
      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;
        return {
          ...state,
          items: updatedItems,
          itemCount: state.itemCount + action.payload.quantity,
          total: state.total + (action.payload.priceAtTime * action.payload.quantity),
        };
      } else {
        return {
          ...state,
          items: [...state.items, action.payload],
          itemCount: state.itemCount + action.payload.quantity,
          total: state.total + (action.payload.priceAtTime * action.payload.quantity),
        };
      }
    case 'UPDATE_ITEM':
      const updatedItems = state.items.map(item => {
        if (item.product.id === action.payload.productId) {
          return { ...item, quantity: action.payload.quantity };
        }
        return item;
      });
      const item = state.items.find(item => item.product.id === action.payload.productId);
      const quantityDiff = item ? action.payload.quantity - item.quantity : 0;
      const priceDiff = item ? item.priceAtTime * quantityDiff : 0;
      return {
        ...state,
        items: updatedItems,
        itemCount: state.itemCount + quantityDiff,
        total: state.total + priceDiff,
      };
    case 'REMOVE_ITEM':
      const itemToRemove = state.items.find(item => item.product.id === action.payload);
      const filteredItems = state.items.filter(item => item.product.id !== action.payload);
      return {
        ...state,
        items: filteredItems,
        itemCount: itemToRemove ? state.itemCount - itemToRemove.quantity : state.itemCount,
        total: itemToRemove ? state.total - (itemToRemove.priceAtTime * itemToRemove.quantity) : state.total,
      };
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        itemCount: 0,
        total: 0,
      };
    case 'SET_ITEM_COUNT':
      return { ...state, itemCount: action.payload };
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  isProductInCart: (productId: number) => boolean;
  getCartItemQuantity: (productId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();

  // Load cart when user changes
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartService.getCartItems(user.id);
      
      if (response.success && response.cartItems) {
        dispatch({
          type: 'SET_CART_DATA',
          payload: {
            items: response.cartItems,
            total: response.total || 0,
            itemCount: response.itemCount || 0,
          },
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load cart' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
      console.error('Error loading cart:', error);
    }
  };

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!user) {
      console.error('No user found when trying to add to cart');
      dispatch({ type: 'SET_ERROR', payload: 'Please login to add items to cart' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartService.addToCart(user.id, productId, quantity);
      
      if (response.success) {
        await loadCart();
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        console.error('Failed to add item to cart:', response.error);
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to add item to cart' });
      }
    } catch (error) {
      console.error('Error in addToCart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartService.updateQuantity(user.id, productId, quantity);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_ITEM', payload: { productId, quantity } });
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to update quantity' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update quantity' });
      console.error('Error updating quantity:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromCart = async (productId: number) => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartService.removeFromCart(user.id, productId);
      
      if (response.success) {
        dispatch({ type: 'REMOVE_ITEM', payload: productId });
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to remove item' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item' });
      console.error('Error removing from cart:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartService.clearCart(user.id);
      
      if (response.success) {
        dispatch({ type: 'CLEAR_CART' });
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to clear cart' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
      console.error('Error clearing cart:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const isProductInCart = (productId: number): boolean => {
    return state.items.some(item => item.product.id === productId);
  };

  const getCartItemQuantity = (productId: number): number => {
    const item = state.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const value: CartContextType = {
    state,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    loadCart,
    isProductInCart,
    getCartItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 
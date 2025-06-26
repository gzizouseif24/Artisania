import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User } from '../services/authService';

// Auth Context Types
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'CUSTOMER' | 'ARTISAN') => Promise<void>;
  registerCustomer: (email: string, password: string) => Promise<void>;
  registerArtisan: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const currentUser = authService.getCurrentUser();
        const token = authService.getToken();
        
        if (currentUser && token) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear potentially corrupted data
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth events (from authService)
  useEffect(() => {
    const handleAuthLogin = (event: CustomEvent) => {
      setUser(event.detail);
    };

    const handleAuthLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:login' as any, handleAuthLogin);
    window.addEventListener('auth:logout' as any, handleAuthLogout);

    return () => {
      window.removeEventListener('auth:login' as any, handleAuthLogin);
      window.removeEventListener('auth:logout' as any, handleAuthLogout);
    };
  }, []);

  // Auth functions
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });
      
      const userInfo: User = {
        id: response.userId,
        email: response.email,
        role: response.role,
      };
      
      setUser(userInfo);
    } catch (error) {
      throw error; // Re-throw to handle in component
    } finally {
      setIsLoading(false);
    }
  };

  const registerCustomer = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.registerCustomer({ email, password, role: 'CUSTOMER' });
      
      const userInfo: User = {
        id: response.userId,
        email: response.email,
        role: response.role,
      };
      
      setUser(userInfo);
    } catch (error) {
      throw error; // Re-throw to handle in component
    } finally {
      setIsLoading(false);
    }
  };

  const registerArtisan = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.registerArtisan({ email, password, role: 'ARTISAN' });
      
      const userInfo: User = {
        id: response.userId,
        email: response.email,
        role: response.role,
      };
      
      setUser(userInfo);
    } catch (error) {
      throw error; // Re-throw to handle in component
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: 'CUSTOMER' | 'ARTISAN'): Promise<void> => {
    if (role === 'CUSTOMER') {
      await registerCustomer(email, password);
    } else {
      await registerArtisan(email, password);
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading: isLoading,
    login,
    register,
    registerCustomer,
    registerArtisan,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher-order component for protected routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'CUSTOMER' | 'ARTISAN' | 'ADMIN';
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  fallback = <div>Access denied. Please log in.</div> 
}) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <div>Access denied. Insufficient permissions.</div>;
  }

  return <>{children}</>;
};

export default AuthContext; 
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

// ✅ Updated interfaces to match backend from #backend
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  role: string;
  permissions: string[];
  created_at: string;
  updated_at?: string;
  last_login?: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  location?: string;
  bio?: string;
  website?: string;
  job_title?: string;
  company?: string;
  timezone?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: string;
  phone?: string;
  department?: string;
  is_admin?: boolean;
  is_active?: boolean;
  permissions?: string[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
  refresh_token?: string;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  department?: string;
  location?: string;
  bio?: string;
  website?: string;
  job_title?: string;
  company?: string;
  timezone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  register: (userData: RegisterRequest) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  // ✅ Enhanced methods
  checkAuthStatus: () => Promise<void>;
  isAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ Enhanced auth status check with proper error handling
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Initialize auth service first
      authService.initializeAuth();
      
      const token = authService.getToken();
      const storedUser = authService.getUser();
      
      if (!token) {
        console.log('🔵 AuthContext: No token found');
        setIsLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      if (storedUser) {
        // Set user immediately from storage for better UX
        setUser(storedUser);
        setIsAuthenticated(true);
      }

      try {
        console.log('🔵 AuthContext: Verifying token with backend...');
        const userData = await authService.getCurrentUser();
        
        if (userData) {
          console.log('✅ AuthContext: User authenticated:', userData.username);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          throw new Error('Invalid user data received');
        }
      } catch (error: any) {
        console.error('❌ AuthContext: Token validation failed:', error);
        
        // Clear invalid auth state
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        
        // Only show error toast for non-401 errors (401 is expected for expired tokens)
        if (error.response?.status !== 401) {
          toast.error('Session expired. Please login again.');
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // ✅ Enhanced login with proper backend integration
  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      setIsLoading(true);
      console.log('🔵 AuthContext: Attempting login for:', credentials.username);
      
      const response = await authService.login(credentials);
      
      if (!response || !response.access_token || !response.user) {
        throw new Error('Invalid login response format');
      }

      // ✅ Set user data from login response
      setUser(response.user);
      setIsAuthenticated(true);
      
      console.log('✅ AuthContext: Login successful for user:', response.user.username);
      toast.success(`Welcome back, ${response.user.full_name || response.user.username}!`);
      
      return response;
      
    } catch (error: any) {
      console.error('❌ AuthContext: Login failed:', error);
      
      // Clear any existing auth state on login failure
      setUser(null);
      setIsAuthenticated(false);
      
      // Enhanced error handling based on backend responses from #backend
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (error.response?.status === 403) {
        errorMessage = 'Account is disabled. Please contact administrator.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Enhanced register with backend integration from #backend
  const register = async (userData: RegisterRequest): Promise<User> => {
    try {
      setIsLoading(true);
      console.log('🔵 AuthContext: Attempting registration for:', userData.username);
      
      const user = await authService.register(userData);
      
      console.log('✅ AuthContext: Registration successful');
      toast.success('Registration successful! You can now sign in.');
      
      return user;
      
    } catch (error: any) {
      console.error('❌ AuthContext: Registration failed:', error);
      
      // Enhanced error handling for registration based on backend from #backend
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.status === 400) {
        if (error.response.data?.detail?.includes('already registered')) {
          errorMessage = 'Username or email already exists';
        } else {
          errorMessage = error.response.data?.detail || errorMessage;
        }
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Enhanced logout with proper cleanup
  const logout = () => {
    try {
      console.log('🔵 AuthContext: Logging out user:', user?.username);
      
      // Use auth service logout which handles all cleanup
      authService.logout();
      
      // Clear context state
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ AuthContext: Logout successful');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
      
      // Still clear auth state even if error occurs
      setUser(null);
      setIsAuthenticated(false);
      
      toast.error('Error during logout, but you have been signed out');
    }
  };

  // ✅ Enhanced updateUser with local state update
  const updateUser = (userData: Partial<User>) => {
    try {
      console.log('🔵 AuthContext: Updating user profile locally...');
      
      if (!user) {
        throw new Error('No user to update');
      }
      
      // Update local user state immediately for better UX
      const updatedUser: User = {
        ...user,
        ...userData,
        updated_at: new Date().toISOString()
      };
      
      setUser(updatedUser);
      
      // Update stored user data
      authService.setUser(updatedUser);
      
      console.log('✅ AuthContext: User profile updated locally');
    } catch (error: any) {
      console.error('❌ AuthContext: Update user error:', error);
      toast.error('Failed to update user profile');
    }
  };

  // ✅ Enhanced refreshUser with error handling
  const refreshUser = async () => {
    try {
      setIsLoading(true);
      console.log('🔵 AuthContext: Refreshing user data...');
      
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        console.log('✅ AuthContext: User data refreshed');
      } else {
        throw new Error('Failed to get current user data');
      }
    } catch (error: any) {
      console.error('❌ AuthContext: Refresh user error:', error);
      
      // If refresh fails due to auth issues, logout user
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🔵 AuthContext: Auth error during refresh, logging out...');
        logout();
      } else {
        toast.error('Failed to refresh user data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Enhanced helper methods
  const isAdmin = (): boolean => {
    return !!(user && user.is_admin);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.is_admin) return true; // Admins have all permissions
    return user.permissions?.includes(permission) || false;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    checkAuthStatus,
    isAdmin,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ✅ Enhanced custom hooks for specific use cases
export const useAuthUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export const useIsAdmin = (): boolean => {
  const { isAdmin } = useAuth();
  return isAdmin();
};

export const useHasPermission = (permission: string): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

export default AuthContext;
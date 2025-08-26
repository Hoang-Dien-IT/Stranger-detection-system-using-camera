import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Re-export useAuth from AuthContext for consistency
export { useAuth } from '@/contexts/AuthContext';

// Additional auth-related hooks can be added here if needed

/**
 * Extended auth hook with additional utilities
 */
export const useAuthExtended = () => {
  const auth = useAuth(); // ✅ Fixed: Use useAuth directly
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isFullyAuthenticated = auth.isAuthenticated && auth.user && isOnline;

  return {
    ...auth,
    isOnline,
    isFullyAuthenticated,
    
    // Additional helper methods
    hasPermission: (permission: string) => {
      if (!auth.user) return false;
      
      // Admin has all permissions
      if (auth.user.is_admin) return true;
      
      // Add specific permission checks here based on your requirements
      switch (permission) {
        case 'admin':
          return auth.user.is_admin;
        case 'cameras.create':
        case 'cameras.update':
        case 'cameras.delete':
        case 'persons.create':
        case 'persons.update':
        case 'persons.delete':
        case 'detections.view':
        case 'detections.delete':
          return auth.isAuthenticated; // All authenticated users can do these
        default:
          return false;
      }
    },

    isAdmin: () => {
      return auth.user?.is_admin || false;
    },

    getUserInitials: () => {
      if (!auth.user?.full_name) return 'U';
      return auth.user.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    },

    getDisplayName: () => {
      return auth.user?.full_name || auth.user?.username || 'Unknown User';
    }
  };
};

/**
 * Hook for checking specific permissions
 */
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth(); // ✅ Fixed: Use useAuth directly

  const checkPermission = (permission: string): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Admin has all permissions
    if (user.is_admin) return true;
    
    // Regular user permissions
    const userPermissions = [
      'cameras.view',
      'cameras.create',
      'cameras.update',
      'cameras.delete',
      'persons.view',
      'persons.create',
      'persons.update',
      'persons.delete',
      'detections.view',
      'detections.delete',
      'settings.view',
      'settings.update'
    ];

    const adminOnlyPermissions = [
      'admin.dashboard',
      'admin.users',
      'admin.system',
      'users.manage',
      'system.health'
    ];

    if (adminOnlyPermissions.includes(permission)) {
      return user.is_admin;
    }

    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => checkPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => checkPermission(permission));
  };

  return {
    checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: user?.is_admin || false,
    isAuthenticated,
    user
  };
};

/**
 * Hook for session management
 */
export const useSession = () => {
  const { user, logout } = useAuth(); // ✅ Fixed: Use useAuth directly
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  useEffect(() => {
    // Check token expiry from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Parse JWT token to get expiry (basic implementation)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
          setSessionExpiry(new Date(payload.exp * 1000));
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (sessionExpiry) {
      const checkExpiry = () => {
        if (new Date() >= sessionExpiry) {
          logout();
        }
      };

      const interval = setInterval(checkExpiry, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [sessionExpiry, logout]);

  const getTimeUntilExpiry = (): number => {
    if (!sessionExpiry) return 0;
    return Math.max(0, sessionExpiry.getTime() - new Date().getTime());
  };

  const isSessionExpiringSoon = (): boolean => {
    const timeUntilExpiry = getTimeUntilExpiry();
    return timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000; // 5 minutes
  };

  return {
    sessionExpiry,
    getTimeUntilExpiry,
    isSessionExpiringSoon,
    user
  };
};

/**
 * Hook for user preferences
 */
export const useUserPreferences = () => {
  const { user } = useAuth(); // ✅ Fixed: Use useAuth directly
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });

  useEffect(() => {
    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem(`user_preferences_${user?.id}`);
    if (savedPreferences) {
      try {
        setPreferences(prev => ({ ...prev, ...JSON.parse(savedPreferences) }));
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }
  }, [user?.id]);

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, [key]: value };
      
      // Save to localStorage
      if (user?.id) {
        localStorage.setItem(
          `user_preferences_${user.id}`, 
          JSON.stringify(newPreferences)
        );
      }
      
      return newPreferences;
    });
  };

  const resetPreferences = () => {
    const defaultPreferences = {
      theme: 'light',
      language: 'en',
      notifications: true,
      autoRefresh: true,
      refreshInterval: 30000
    };
    
    setPreferences(defaultPreferences);
    
    if (user?.id) {
      localStorage.setItem(
        `user_preferences_${user.id}`, 
        JSON.stringify(defaultPreferences)
      );
    }
  };

  return {
    preferences,
    updatePreference,
    resetPreferences,
    theme: preferences.theme,
    language: preferences.language,
    notifications: preferences.notifications,
    autoRefresh: preferences.autoRefresh,
    refreshInterval: preferences.refreshInterval
  };
};

// Export default
export default useAuth;
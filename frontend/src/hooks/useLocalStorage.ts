import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useLocalStorage Hook - Sync state with localStorage
 * Perfect for Face Recognition SaaS user preferences, settings, and caching
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * useSessionStorage Hook - Similar to localStorage but for session storage
 * Useful for temporary data that should clear when browser closes
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * useAuthStorage Hook - Specialized storage for authentication data
 * Handles token, user data, and auth preferences securely
 */
export function useAuthStorage() {
  const [token, setToken, removeToken] = useLocalStorage<string | null>('auth_token', null);
  const [user, setUser, removeUser] = useLocalStorage<any>('user_data', null);
  const [refreshToken, setRefreshToken, removeRefreshToken] = useLocalStorage<string | null>('refresh_token', null);
  const [rememberMe, setRememberMe] = useLocalStorage<boolean>('remember_me', false);
  const [lastLoginTime, setLastLoginTime] = useLocalStorage<string | null>('last_login_time', null);

  const clearAuth = useCallback(() => {
    removeToken();
    removeUser();
    removeRefreshToken();
    setLastLoginTime(null);
  }, [removeToken, removeUser, removeRefreshToken, setLastLoginTime]);

  const setAuthData = useCallback((authData: {
    token: string;
    user: any;
    refreshToken?: string;
  }) => {
    setToken(authData.token);
    setUser(authData.user);
    if (authData.refreshToken) {
      setRefreshToken(authData.refreshToken);
    }
    setLastLoginTime(new Date().toISOString());
  }, [setToken, setUser, setRefreshToken, setLastLoginTime]);

  const isAuthenticated = useCallback(() => {
    return !!(token && user);
  }, [token, user]);

  return {
    token,
    user,
    refreshToken,
    rememberMe,
    lastLoginTime,
    setToken,
    setUser,
    setRefreshToken,
    setRememberMe,
    setAuthData,
    clearAuth,
    isAuthenticated
  };
}

/**
 * useUserPreferences Hook - Manage user UI preferences
 * Perfect for Face Recognition SaaS interface customization
 */
export function useUserPreferences() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark' | 'system'>('theme', 'system');
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>('sidebar_collapsed', false);
  const [language, setLanguage] = useLocalStorage<string>('language', 'en');
  const [timezone, setTimezone] = useLocalStorage<string>('timezone', 'UTC+7');
  const [cameraViewMode, setCameraViewMode] = useLocalStorage<'grid' | 'list'>('camera_view_mode', 'grid');
  const [detectionSensitivity, setDetectionSensitivity] = useLocalStorage<number>('detection_sensitivity', 0.7);
  const [autoRefresh, setAutoRefresh] = useLocalStorage<boolean>('auto_refresh', true);
  const [refreshInterval, setRefreshInterval] = useLocalStorage<number>('refresh_interval', 30000);
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage<boolean>('notifications_enabled', true);
  const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>('sound_enabled', true);

  const resetPreferences = useCallback(() => {
    setTheme('system');
    setSidebarCollapsed(false);
    setLanguage('en');
    setTimezone('UTC+7');
    setCameraViewMode('grid');
    setDetectionSensitivity(0.7);
    setAutoRefresh(true);
    setRefreshInterval(30000);
    setNotificationsEnabled(true);
    setSoundEnabled(true);
  }, [
    setTheme, setSidebarCollapsed, setLanguage, setTimezone,
    setCameraViewMode, setDetectionSensitivity, setAutoRefresh,
    setRefreshInterval, setNotificationsEnabled, setSoundEnabled
  ]);

  return {
    theme,
    sidebarCollapsed,
    language,
    timezone,
    cameraViewMode,
    detectionSensitivity,
    autoRefresh,
    refreshInterval,
    notificationsEnabled,
    soundEnabled,
    setTheme,
    setSidebarCollapsed,
    setLanguage,
    setTimezone,
    setCameraViewMode,
    setDetectionSensitivity,
    setAutoRefresh,
    setRefreshInterval,
    setNotificationsEnabled,
    setSoundEnabled,
    resetPreferences
  };
}

/**
 * useCameraCache Hook - Cache camera data and settings
 * Optimizes Face Recognition camera management
 */
export function useCameraCache() {
  const [cameraList, setCameraList] = useLocalStorage<any[]>('camera_list', []);
  const [cameraSettings, setCameraSettings] = useLocalStorage<Record<string, any>>('camera_settings', {});
  const [streamQuality, setStreamQuality] = useLocalStorage<'low' | 'medium' | 'high'>('stream_quality', 'medium');
  const [lastCameraUpdate, setLastCameraUpdate] = useLocalStorage<string | null>('last_camera_update', null);

  const updateCameraInList = useCallback((cameraId: string, updates: any) => {
    setCameraList(prevList => 
      prevList.map(camera => 
        camera.id === cameraId ? { ...camera, ...updates } : camera
      )
    );
    setLastCameraUpdate(new Date().toISOString());
  }, [setCameraList, setLastCameraUpdate]);

  const addCameraToList = useCallback((camera: any) => {
    setCameraList(prevList => [...prevList, camera]);
    setLastCameraUpdate(new Date().toISOString());
  }, [setCameraList, setLastCameraUpdate]);

  const removeCameraFromList = useCallback((cameraId: string) => {
    setCameraList(prevList => prevList.filter(camera => camera.id !== cameraId));
    setLastCameraUpdate(new Date().toISOString());
  }, [setCameraList, setLastCameraUpdate]);

  const updateCameraSettings = useCallback((cameraId: string, settings: any) => {
    setCameraSettings(prevSettings => ({
      ...prevSettings,
      [cameraId]: { ...prevSettings[cameraId], ...settings }
    }));
  }, [setCameraSettings]);

  const clearCameraCache = useCallback(() => {
    setCameraList([]);
    setCameraSettings({});
    setLastCameraUpdate(null);
  }, [setCameraList, setCameraSettings, setLastCameraUpdate]);

  return {
    cameraList,
    cameraSettings,
    streamQuality,
    lastCameraUpdate,
    setCameraList,
    setCameraSettings,
    setStreamQuality,
    updateCameraInList,
    addCameraToList,
    removeCameraFromList,
    updateCameraSettings,
    clearCameraCache
  };
}

/**
 * useFormPersistence Hook - Persist form data across page reloads
 * Useful for Face Recognition person creation, camera setup forms
 */
export function useFormPersistence<T extends Record<string, any>>(
  formKey: string,
  initialValues: T,
  options: {
    timeout?: number; // Auto-clear after timeout (ms)
    clearOnSubmit?: boolean;
  } = {}
) {
  const { timeout = 30 * 60 * 1000, clearOnSubmit = true } = options; // 30 minutes default
  
  const [formData, setFormData] = useLocalStorage<{
    values: T;
    timestamp: number;
  } | null>(`form_${formKey}`, null);

  // Check if cached form data is still valid
  const isValid = formData && 
    formData.timestamp && 
    (Date.now() - formData.timestamp) < timeout;

  const values = isValid ? formData.values : initialValues;

  const updateFormData = useCallback((newValues: Partial<T>) => {
    const updatedValues = { ...values, ...newValues };
    setFormData({
      values: updatedValues,
      timestamp: Date.now()
    });
  }, [values, setFormData]);

  const clearFormData = useCallback(() => {
    setFormData(null);
  }, [setFormData]);

  const handleSubmit = useCallback(() => {
    if (clearOnSubmit) {
      clearFormData();
    }
  }, [clearOnSubmit, clearFormData]);

  return {
    values,
    updateFormData,
    clearFormData,
    handleSubmit,
    isValid: !!isValid
  };
}

/**
 * useRecentItems Hook - Track recently accessed items
 * Perfect for Face Recognition recent cameras, persons, detections
 */
export function useRecentItems<T extends { id: string; [key: string]: any }>(
  key: string,
  maxItems: number = 10
) {
  const [recentItems, setRecentItems] = useLocalStorage<T[]>(`recent_${key}`, []);

  const addRecentItem = useCallback((item: T) => {
    setRecentItems(prevItems => {
      const filtered = prevItems.filter(i => i.id !== item.id);
      return [item, ...filtered].slice(0, maxItems);
    });
  }, [setRecentItems, maxItems]);

  const removeRecentItem = useCallback((itemId: string) => {
    setRecentItems(prevItems => prevItems.filter(i => i.id !== itemId));
  }, [setRecentItems]);

  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
  }, [setRecentItems]);

  return {
    recentItems,
    addRecentItem,
    removeRecentItem,
    clearRecentItems
  };
}

/**
 * useLocalStorageSync Hook - Sync localStorage changes across tabs
 * Ensures consistent state across multiple Face Recognition tabs
 */
export function useLocalStorageSync<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useLocalStorage(key, initialValue);
  const eventRef = useRef<((e: StorageEvent) => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error parsing localStorage sync for key "${key}":`, error);
        }
      }
    };

    eventRef.current = handleStorageChange;
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (eventRef.current) {
        window.removeEventListener('storage', eventRef.current);
      }
    };
  }, [key, setStoredValue]);

  return [storedValue, setStoredValue];
}

/**
 * useBulkLocalStorage Hook - Manage multiple localStorage keys efficiently
 * Perfect for Face Recognition settings that need to be saved together
 */
export function useBulkLocalStorage<T extends Record<string, any>>(
  keys: (keyof T)[],
  initialValues: T
) {
  const [values, setValues] = useState<T>(() => {
    const stored: Partial<T> = {};
    
    if (typeof window !== 'undefined') {
      keys.forEach(key => {
        try {
          const item = window.localStorage.getItem(String(key));
          if (item !== null) {
            stored[key] = JSON.parse(item);
          }
        } catch (error) {
          console.warn(`Error reading localStorage key "${String(key)}":`, error);
        }
      });
    }
    
    return { ...initialValues, ...stored };
  });

  const updateValues = useCallback((updates: Partial<T>) => {
    setValues(prev => {
      const newValues = { ...prev, ...updates };
      
      // Save each updated key to localStorage
      if (typeof window !== 'undefined') {
        Object.entries(updates).forEach(([key, value]) => {
          try {
            window.localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
          }
        });
      }
      
      return newValues;
    });
  }, []);

  const clearAll = useCallback(() => {
    setValues(initialValues);
    
    if (typeof window !== 'undefined') {
      keys.forEach(key => {
        window.localStorage.removeItem(String(key));
      });
    }
  }, [keys, initialValues]);

  return {
    values,
    updateValues,
    clearAll
  };
}

// Export default useLocalStorage for backward compatibility
export default useLocalStorage;

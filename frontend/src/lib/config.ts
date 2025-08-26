/**
 * Application Configuration
 * Centralized configuration for the SafeFace application
 */

// ✅ API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
export const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8000/ws';

// ✅ Authentication Configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'safeface_token',
  REFRESH_TOKEN_KEY: 'safeface_refresh_token',
  USER_KEY: 'safeface_user',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes in milliseconds
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
} as const;

// ✅ WebSocket Configuration
export const WS_CONFIG = {
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 3000, // 3 seconds
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const;

// ✅ Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/avi'] as const,
  MAX_FACE_IMAGES: 10,
  FACE_IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// ✅ UI Configuration
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 280,
  SIDEBAR_COLLAPSED_WIDTH: 80,
  HEADER_HEIGHT: 64,
  PAGE_SIZE: 20,
  SEARCH_DEBOUNCE: 300, // milliseconds
  TOAST_DURATION: 5000, // 5 seconds
  ANIMATION_DURATION: 200, // milliseconds
} as const;

// ✅ Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_DARK_MODE: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_BULK_OPERATIONS: true,
  ENABLE_EXPORT: true,
  ENABLE_REAL_TIME_UPDATES: true,
  ENABLE_FACE_RECOGNITION: true,
} as const;

// ✅ Application Metadata
export const APP_CONFIG = {
  NAME: 'SafeFace',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-Powered Face Recognition Security Platform',
  AUTHOR: 'SafeFace Technologies',
  CONTACT_EMAIL: 'support@safeface.ai',
  DOCUMENTATION_URL: 'https://docs.safeface.ai',
  SUPPORT_URL: 'https://support.safeface.ai',
} as const;

// ✅ Camera Configuration
export const CAMERA_CONFIG = {
  DEFAULT_RESOLUTION: '1920x1080',
  SUPPORTED_RESOLUTIONS: [
    '640x480',
    '1280x720', 
    '1920x1080',
    '2560x1440',
    '3840x2160'
  ] as const,
  DEFAULT_FPS: 30,
  SUPPORTED_FPS: [15, 24, 30, 60] as const,
  STREAM_TIMEOUT: 30000, // 30 seconds
} as const;

// ✅ Detection Configuration  
export const DETECTION_CONFIG = {
  CONFIDENCE_THRESHOLD: 0.7,
  MIN_FACE_SIZE: 80, // pixels
  MAX_FACES_PER_FRAME: 10,
  DETECTION_INTERVAL: 1000, // 1 second
  RETENTION_DAYS: 90,
} as const;

// ✅ Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    PATTERN: /^\+?[\d\s\-\(\)]{10,}$/,
  },
} as const;

// ✅ Environment-specific configurations
export const ENV_CONFIG = {
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
  DEBUG_MODE: process.env.REACT_APP_DEBUG === 'true',
  ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING !== 'false',
} as const;

// ✅ Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UPLOAD_ERROR: 'Failed to upload file. Please try again.',
  CONNECTION_ERROR: 'Connection failed. Please check your network.',
} as const;

// ✅ Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  SAVE_SUCCESS: 'Changes saved successfully.',
  DELETE_SUCCESS: 'Item deleted successfully.',
  UPLOAD_SUCCESS: 'File uploaded successfully.',
  UPDATE_SUCCESS: 'Updated successfully.',
  CREATE_SUCCESS: 'Created successfully.',
} as const;

// ✅ Routes Configuration
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CAMERAS: '/cameras',
  PERSONS: '/persons',
  DETECTIONS: '/detections',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  ADMIN: '/admin',
  PROFILE: '/profile',
  HELP: '/help',
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized',
} as const;

// ✅ Export default configuration object
export default {
  API_BASE_URL,
  WS_BASE_URL,
  AUTH_CONFIG,
  WS_CONFIG,
  UPLOAD_CONFIG,
  UI_CONFIG,
  FEATURE_FLAGS,
  APP_CONFIG,
  CAMERA_CONFIG,
  DETECTION_CONFIG,
  VALIDATION_RULES,
  ENV_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
} as const;

// ✅ Type exports for TypeScript
export type FeatureFlag = keyof typeof FEATURE_FLAGS;
export type Route = typeof ROUTES[keyof typeof ROUTES];
export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];
export type SuccessMessage = typeof SUCCESS_MESSAGES[keyof typeof SUCCESS_MESSAGES];
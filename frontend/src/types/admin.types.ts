// ✅ Unified DashboardStats interface that matches backend response
export interface DashboardStats {
  // User stats
  total_users: number;
  active_users: number;
  admin_users: number;
  
  // Camera stats
  total_cameras: number;
  active_cameras: number;
  streaming_cameras: number;
  
  // Person stats  
  total_persons: number;
  active_persons: number;
  
  // Detection stats
  total_detections: number;
  stranger_detections: number;
  known_person_detections: number;
  today_detections: number;
  this_week_detections: number;
  
  // Recent activity
  recent_activity: Array<{
    type: string;
    description: string;
    timestamp: string;
    user_id?: string;
    camera_id?: string;
    detection_id?: string;
    severity?: 'info' | 'warning' | 'error';
  }>;
  
  // Additional metadata
  system_status?: string;
  last_updated?: string;
}

// ✅ Unified SystemHealth interface that matches backend response
export interface SystemHealth {
  // Service status
  database: 'healthy' | 'warning' | 'error' | 'unknown';
  face_recognition: 'healthy' | 'warning' | 'error' | 'unknown';
  websocket: 'healthy' | 'warning' | 'error' | 'unknown';
  
  // System metrics
  system: {
    memory: {
      total: number;
      available: number;
      used: number;
      percent: number;
    };
    cpu: {
      percent: number;
    };
    disk: {
      total: number;
      used: number;
      free: number;
      percent: number;
    };
  };
  
  // System info
  uptime: number;
  last_check: string;
  
  // Additional health indicators
  network_status?: 'connected' | 'disconnected' | 'limited';
  storage_status?: 'healthy' | 'warning' | 'critical';
  temperature?: number;
  load_average?: number[];
}

// ✅ Base User interface (simplified for basic use)
export interface BaseUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  login_count?: number;
  permissions?: string[];
  role?: 'admin' | 'user' | 'viewer';
  phone?: string;
  department?: string;
  avatar_url?: string;
}

// ✅ Extended User for UserManagement component
export interface User extends BaseUser {
  cameras_count: number;
  persons_count: number;
  detections_count: number;
  metadata?: Record<string, any>;
}

// ✅ Comprehensive UserDetails for detail views and modals
export interface UserDetails {
  // ✅ FIX: Include user object as expected by UserManagement
  user: User;
  
  // ✅ FIX: Include stats object as expected
  stats: {
    total_cameras: number;
    active_cameras: number;
    total_persons: number;
    recent_detections: number;
    total_detections: number;
    login_history: Array<{
      timestamp: string;
      ip_address: string;
      user_agent: string;
    }>;
  };
  
  // ✅ FIX: Include cameras array as expected
  cameras: Array<{
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
  }>;
  
  // ✅ FIX: Include persons array as expected
  persons: Array<{
    id: string;
    name: string;
    face_images_count: number;
    created_at: string;
  }>;
}

// ✅ User creation interface
export interface UserCreate {
  username: string;
  email: string;
  full_name: string;
  password: string;
  is_admin?: boolean;
  is_active?: boolean;
  permissions?: string[];
  role?: 'admin' | 'user' | 'viewer';
  phone?: string;
  department?: string;
}

// ✅ User update interface
export interface UserUpdate {
  username?: string;
  email?: string;
  full_name?: string;
  password?: string;
  is_admin?: boolean;
  is_active?: boolean;
  permissions?: string[];
  role?: 'admin' | 'user' | 'viewer';
  phone?: string;
  department?: string;
  avatar_url?: string;
}

// ✅ System monitoring interfaces
export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  category: 'system' | 'auth' | 'camera' | 'detection' | 'user' | 'api';
  message: string;
  details?: any;
  user_id?: string;
  camera_id?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

export interface SystemMetrics {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: {
    bytes_sent: number;
    bytes_recv: number;
  };
  active_connections: number;
  response_time: number;
}

// ✅ Chart data interfaces
export interface ChartDataPoint {
  name: string;
  date: string;
  detections: number;
  users: number;
  stranger_detections: number;
  known_detections: number;
  cameras_active?: number;
  system_load?: number;
}

export interface AdminStats {
  overview: DashboardStats;
  health: SystemHealth;
  charts: {
    activity: ChartDataPoint[];
    users: ChartDataPoint[];
    detections: ChartDataPoint[];
  };
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    timestamp: string;
    acknowledged: boolean;
    source: string;
  }>;
}

export interface UserWithStats {
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
  // ✅ ADD: Stats properties
  stats?: {
    total_logins: number;
    last_activity: string;
    devices_count: number;
    permissions_count: number;
  };
}

// ✅ Export aliases for backward compatibility
export type { DashboardStats as AdminDashboardStats };
export type { SystemHealth as SystemHealthData };
export type { UserDetails as AdminUserDetails };
export type { User as AdminUser };
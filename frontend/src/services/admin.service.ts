import { apiService } from './api';
import { 
  DashboardStats, 
  SystemHealth, 
  UserDetails, 
  User,
  UserCreate, 
  UserUpdate,
  SystemLog,
  SystemMetrics,
  AdminStats,
  UserWithStats
} from '@/types/admin.types';

class AdminService {

    // ✅ FIX: Update getUsers method to return UserWithStats
  async getUsers(): Promise<UserWithStats[]> {
    try {
      console.log('🔵 AdminService: Getting users...');
      
      // ✅ Try to get users with stats first
      try {
        const response = await apiService.get<UserWithStats[]>('/admin/users/with-stats');
        console.log('✅ AdminService: Got users with stats:', response.data.length);
        return response.data;
      } catch (error) {
        // ✅ Fallback: Get regular users and add empty stats
        console.log('⚠️ AdminService: Stats endpoint not available, using regular users endpoint');
        const response = await apiService.get<User[]>('/admin/users');
        
        // ✅ Transform User[] to UserWithStats[]
        const usersWithStats: UserWithStats[] = response.data.map(user => ({
          ...user,
          role: user.role || (user.is_admin ? 'admin' : 'user'),
          permissions: user.permissions || [],
          stats: {
            total_logins: 0,
            last_activity: user.last_login || user.created_at,
            devices_count: 1,
            permissions_count: user.permissions?.length || 0
          }
        }));
        
        console.log('✅ AdminService: Got users (transformed to UserWithStats):', usersWithStats.length);
        return usersWithStats;
      }
    } catch (error: any) {
      console.error('❌ AdminService: Error getting users:', error);
      throw new Error(error.message || 'Failed to get users');
    }
  }

  // ✅ Dashboard stats - unified interface
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('🔵 AdminService: Getting dashboard stats...');
      console.log('🔵 AdminService: Making request to /admin/dashboard...');
      
      const response = await apiService.get<DashboardStats>('/admin/dashboard');
      console.log('✅ AdminService: Dashboard API response status:', response.status);
      console.log('✅ AdminService: Got dashboard stats:', response.data);
      
      // ✅ Ensure all required fields are present with defaults
      const stats: DashboardStats = {
        total_users: response.data.total_users || 0,
        active_users: response.data.active_users || 0,
        admin_users: response.data.admin_users || 0,
        total_cameras: response.data.total_cameras || 0,
        active_cameras: response.data.active_cameras || 0,
        streaming_cameras: response.data.streaming_cameras || 0,
        total_persons: response.data.total_persons || 0,
        active_persons: response.data.active_persons || 0,
        total_detections: response.data.total_detections || 0,
        stranger_detections: response.data.stranger_detections || 0,
        known_person_detections: response.data.known_person_detections || 0,
        today_detections: response.data.today_detections || 0,
        this_week_detections: response.data.this_week_detections || 0,
        recent_activity: response.data.recent_activity || [],
        system_status: response.data.system_status || 'unknown',
        last_updated: response.data.last_updated || new Date().toISOString()
      };
      
      return stats;
    } catch (error: any) {
      console.error('❌ AdminService: Error getting dashboard stats:', error);
      
      // Return default stats on error
      return {
        total_users: 0,
        active_users: 0,
        admin_users: 0,
        total_cameras: 0,
        active_cameras: 0,
        streaming_cameras: 0,
        total_persons: 0,
        active_persons: 0,
        total_detections: 0,
        stranger_detections: 0,
        known_person_detections: 0,
        today_detections: 0,
        this_week_detections: 0,
        recent_activity: [],
        system_status: 'error',
        last_updated: new Date().toISOString()
      };
    }
  }

  // ✅ System health - unified interface
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      console.log('🔵 AdminService: Getting system health...');
      const response = await apiService.get<any>('/admin/health');
      console.log('✅ AdminService: Got system health:', response.data);
      
      // ✅ Ensure all required fields are present with defaults
      const health: SystemHealth = {
        database: response.data.database || 'unknown',
        face_recognition: response.data.face_recognition || 'unknown',
        websocket: response.data.websocket || 'unknown',
        system: {
          memory: {
            total: response.data.system?.memory?.total || 0,
            available: response.data.system?.memory?.available || 0,
            used: response.data.system?.memory?.used || 0,
            percent: response.data.system?.memory?.percent || 0
          },
          cpu: {
            percent: response.data.system?.cpu?.percent || 0
          },
          disk: {
            total: response.data.system?.disk?.total || 0,
            used: response.data.system?.disk?.used || 0,
            free: response.data.system?.disk?.free || 0,
            percent: response.data.system?.disk?.percent || 0
          }
        },
        uptime: response.data.uptime || 0,
        last_check: response.data.last_check || new Date().toISOString(),
        network_status: response.data.network_status || 'unknown',
        storage_status: response.data.storage_status || 'unknown',
        temperature: response.data.temperature,
        load_average: response.data.load_average
      };
      
      return health;
    } catch (error: any) {
      console.error('❌ AdminService: Error getting system health:', error);
      
      // Return default health on error
      return {
        database: 'error',
        face_recognition: 'error',
        websocket: 'error',
        system: {
          memory: { total: 0, available: 0, used: 0, percent: 0 },
          cpu: { percent: 0 },
          disk: { total: 0, used: 0, free: 0, percent: 0 }
        },
        uptime: 0,
        last_check: new Date().toISOString(),
        network_status: 'disconnected',
        storage_status: 'critical'
      };
    }
  }

  // ✅ Get all users with proper User interface
  async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔵 AdminService: Getting all users...');
      const response = await apiService.get<any[]>('/admin/users');
      console.log('✅ AdminService: Got users:', response.data.length);
      
      // ✅ Transform response to match User interface
      const users: User[] = response.data.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        is_active: user.is_active,
        is_admin: user.is_admin,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        login_count: user.login_count || 0,
        permissions: user.permissions || [],
        role: user.role || (user.is_admin ? 'admin' : 'user'),
        phone: user.phone,
        department: user.department,
        avatar_url: user.avatar_url,
        cameras_count: user.cameras_count || 0,
        persons_count: user.persons_count || 0,
        detections_count: user.detections_count || 0,
        metadata: user.metadata || {}
      }));
      
      return users;
    } catch (error: any) {
      console.error('❌ AdminService: Error getting users:', error);
      throw new Error(error.message || 'Failed to get users');
    }
  }

  // ✅ Get user details with comprehensive UserDetails interface
  async getUserDetails(userId: string): Promise<UserDetails> {
    try {
      console.log('🔵 AdminService: Getting user details:', userId);
      const response = await apiService.get<any>(`/admin/users/${userId}/details`);
      console.log('✅ AdminService: Got user details:', response.data);
      
      // ✅ FIX: Transform response to match expected UserDetails interface
      const userDetails: UserDetails = {
        user: {
          id: response.data.id || response.data.user?.id,
          username: response.data.username || response.data.user?.username,
          email: response.data.email || response.data.user?.email,
          full_name: response.data.full_name || response.data.user?.full_name,
          is_active: response.data.is_active ?? response.data.user?.is_active ?? true,
          is_admin: response.data.is_admin ?? response.data.user?.is_admin ?? false,
          created_at: response.data.created_at || response.data.user?.created_at || new Date().toISOString(),
          updated_at: response.data.updated_at || response.data.user?.updated_at,
          last_login: response.data.last_login || response.data.user?.last_login,
          login_count: response.data.login_count || response.data.user?.login_count || 0,
          permissions: response.data.permissions || response.data.user?.permissions || [],
          role: response.data.role || response.data.user?.role || (response.data.is_admin ? 'admin' : 'user'),
          phone: response.data.phone || response.data.user?.phone,
          department: response.data.department || response.data.user?.department,
          avatar_url: response.data.avatar_url || response.data.user?.avatar_url,
          cameras_count: response.data.cameras_count || response.data.stats?.total_cameras || 0,
          persons_count: response.data.persons_count || response.data.stats?.total_persons || 0,
          detections_count: response.data.detections_count || response.data.stats?.recent_detections || 0,
          metadata: response.data.metadata || response.data.user?.metadata || {}
        },
        stats: {
          total_cameras: response.data.stats?.total_cameras || 0,
          active_cameras: response.data.stats?.active_cameras || 0,
          total_persons: response.data.stats?.total_persons || 0,
          recent_detections: response.data.stats?.recent_detections || 0,
          total_detections: response.data.stats?.total_detections || 0,
          login_history: response.data.stats?.login_history || []
        },
        cameras: response.data.cameras || [],
        persons: response.data.persons || []
      };
      
      return userDetails;
    } catch (error: any) {
      console.error('❌ AdminService: Error getting user details:', error);
      throw new Error(error.message || 'Failed to get user details');
    }
  }

  // ✅ Create user
  async createUser(userData: UserCreate): Promise<User> {
    try {
      console.log('🔵 AdminService: Creating user:', userData.username);
      const response = await apiService.post<any>('/admin/users', userData);
      console.log('✅ AdminService: User created:', response.data);
      
      // ✅ Transform response to User interface
      const user: User = {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        full_name: response.data.full_name,
        is_active: response.data.is_active ?? true,
        is_admin: response.data.is_admin ?? false,
        created_at: response.data.created_at || new Date().toISOString(),
        updated_at: response.data.updated_at,
        last_login: response.data.last_login,
        login_count: response.data.login_count || 0,
        permissions: response.data.permissions || [],
        role: response.data.role || (response.data.is_admin ? 'admin' : 'user'),
        phone: response.data.phone,
        department: response.data.department,
        avatar_url: response.data.avatar_url,
        cameras_count: 0,
        persons_count: 0,
        detections_count: 0,
        metadata: response.data.metadata || {}
      };
      
      return user;
    } catch (error: any) {
      console.error('❌ AdminService: Error creating user:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  }

  // ✅ Update user
  async updateUser(userId: string, userData: UserUpdate): Promise<User> {
    try {
      console.log('🔵 AdminService: Updating user:', userId);
      const response = await apiService.put<any>(`/admin/users/${userId}`, userData);
      console.log('✅ AdminService: User updated:', response.data);
      
      // ✅ Transform response to User interface
      const user: User = {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        full_name: response.data.full_name,
        is_active: response.data.is_active,
        is_admin: response.data.is_admin,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        last_login: response.data.last_login,
        login_count: response.data.login_count || 0,
        permissions: response.data.permissions || [],
        role: response.data.role || (response.data.is_admin ? 'admin' : 'user'),
        phone: response.data.phone,
        department: response.data.department,
        avatar_url: response.data.avatar_url,
        cameras_count: response.data.cameras_count || 0,
        persons_count: response.data.persons_count || 0,
        detections_count: response.data.detections_count || 0,
        metadata: response.data.metadata || {}
      };
      
      return user;
    } catch (error: any) {
      console.error('❌ AdminService: Error updating user:', error);
      throw new Error(error.message || 'Failed to update user');
    }
  }

  // ✅ Toggle user status
  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      console.log('🔵 AdminService: Toggling user status:', userId, isActive);
      await apiService.post(`/admin/users/${userId}/toggle-status`, { is_active: isActive });
      console.log('✅ AdminService: User status toggled');
    } catch (error: any) {
      console.error('❌ AdminService: Error toggling user status:', error);
      throw new Error(error.message || 'Failed to toggle user status');
    }
  }

  // ✅ Toggle admin role
  async toggleAdminRole(userId: string, isAdmin: boolean): Promise<void> {
    try {
      console.log('🔵 AdminService: Toggling admin role:', userId, isAdmin);
      await apiService.post(`/admin/users/${userId}/toggle-admin`, { is_admin: isAdmin });
      console.log('✅ AdminService: Admin role toggled');
    } catch (error: any) {
      console.error('❌ AdminService: Error toggling admin role:', error);
      throw new Error(error.message || 'Failed to toggle admin role');
    }
  }

  // ✅ Delete user
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log('🔵 AdminService: Deleting user:', userId);
      await apiService.delete(`/admin/users/${userId}`);
      console.log('✅ AdminService: User deleted');
    } catch (error: any) {
      console.error('❌ AdminService: Error deleting user:', error);
      throw new Error(error.message || 'Failed to delete user');
    }
  }

  // ✅ Get system logs
  async getSystemLogs(limit: number = 100, level?: string, category?: string): Promise<SystemLog[]> {
    try {
      console.log('🔵 AdminService: Getting system logs...');
      const params: any = { limit };
      if (level) params.level = level;
      if (category) params.category = category;
      
      const response = await apiService.get<SystemLog[]>('/admin/logs', params);
      console.log('✅ AdminService: Got system logs:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ AdminService: Error getting system logs:', error);
      throw new Error(error.message || 'Failed to get system logs');
    }
  }

  // ✅ Get system metrics
  async getSystemMetrics(timeRange: string = '1h'): Promise<SystemMetrics[]> {
    try {
      console.log('🔵 AdminService: Getting system metrics...');
      const response = await apiService.get<SystemMetrics[]>('/admin/metrics', { time_range: timeRange });
      console.log('✅ AdminService: Got system metrics');
      return response.data;
    } catch (error: any) {
      console.error('❌ AdminService: Error getting system metrics:', error);
      throw new Error(error.message || 'Failed to get system metrics');
    }
  }

  // ✅ Get comprehensive admin stats
  async getAdminStats(): Promise<AdminStats> {
    try {
      console.log('🔵 AdminService: Getting comprehensive admin stats...');
      const [dashboardStats, systemHealth] = await Promise.all([
        this.getDashboardStats(),
        this.getSystemHealth()
      ]);

      // Generate chart data (you can replace this with real API calls)
      const chartData = this.generateMockChartData();

      const adminStats: AdminStats = {
        overview: dashboardStats,
        health: systemHealth,
        charts: chartData,
        alerts: [] // You can add real alerts here
      };

      return adminStats;
    } catch (error: any) {
      console.error('❌ AdminService: Error getting admin stats:', error);
      throw new Error(error.message || 'Failed to get admin stats');
    }
  }

  // ✅ Generate mock chart data (replace with real API when available)
  private generateMockChartData() {
    const now = new Date();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        name: date.toLocaleDateString('en', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
        detections: Math.floor(Math.random() * 100) + 50,
        users: Math.floor(Math.random() * 20) + 10,
        stranger_detections: Math.floor(Math.random() * 30) + 5,
        known_detections: Math.floor(Math.random() * 70) + 30,
        cameras_active: Math.floor(Math.random() * 10) + 5,
        system_load: Math.random() * 100
      });
    }

    return {
      activity: data,
      users: data,
      detections: data
    };
  }

  // ✅ System maintenance operations
  async clearSystemLogs(): Promise<void> {
    try {
      await apiService.post('/admin/logs/clear');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to clear system logs');
    }
  }

  async backupSystem(): Promise<any> {
    try {
      const response = await apiService.post('/admin/backup');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to backup system');
    }
  }

  async restartService(serviceName: string): Promise<void> {
    try {
      await apiService.post(`/admin/services/${serviceName}/restart`);
    } catch (error: any) {
      throw new Error(error.message || `Failed to restart ${serviceName} service`);
    }
  }
}

export const adminService = new AdminService();
export default AdminService;